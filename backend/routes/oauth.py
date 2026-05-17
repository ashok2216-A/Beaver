"""
routes/oauth.py — OAuth 2.0 integration management.

Handles connecting external provider accounts (Google, GitHub, etc.),
securely exchanging codes for tokens, encrypting them via AES-256,
and persisting them in the UserIntegration vault.
"""
from datetime import datetime, timedelta, timezone
import json
import logging
import os
import shutil
import subprocess
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import User, UserIntegration
from schemas import MessageOut, UserIntegrationOut, OAuthConnectUrlOut
from utils.auth import get_current_user
from utils.security import encrypt_secret, decrypt_secret

log = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["OAuth Integrations"])

PROVIDERS = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "default_scopes": ["https://www.googleapis.com/auth/drive", "https://www.googleapis.com/auth/userinfo.email"],
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "default_scopes": ["repo", "user"],
    },
    "slack": {
        "auth_url": "https://slack.com/oauth/v2/authorize",
        "token_url": "https://slack.com/api/oauth.v2.access",
        "default_scopes": ["channels:read", "chat:write", "users:read", "channels:history"],
    }
}

def get_redirect_uri(request: Request, provider: str) -> str:
    settings = get_settings()
    base = settings.frontend_url.rstrip("/")
    return f"{base}/dashboard/integrations/callback/{provider}"


@router.get("/connect/{provider}", response_model=OAuthConnectUrlOut)
async def connect_provider(
    provider: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    """
    Generate an OAuth 2.0 authorization URL for external providers (Google Drive, GitHub).
    """
    provider_lower = provider.lower()
    if provider_lower not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    settings = get_settings()
    cfg = PROVIDERS[provider_lower]
    
    if provider_lower == "google":
        client_id = settings.oauth_google_client_id
    elif provider_lower == "github":
        client_id = settings.oauth_github_client_id
    elif provider_lower == "slack":
        client_id = settings.oauth_slack_client_id
    else:
        client_id = ""
        
    if not client_id:
        raise HTTPException(
            status_code=501, 
            detail=f"{provider.capitalize()} OAuth client ID is not configured on the server."
        )

    redirect_uri = get_redirect_uri(request, provider_lower)
    state = f"{user.id}::{provider_lower}"
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "response_type": "code",
    }
    
    if provider_lower == "google":
        params["scope"] = " ".join(cfg["default_scopes"])
        params["access_type"] = "offline"
        params["prompt"] = "consent"
    elif provider_lower == "github":
        params["scope"] = " ".join(cfg["default_scopes"])
    elif provider_lower == "slack":
        params["scope"] = ",".join(cfg["default_scopes"])

    auth_url = f"{cfg['auth_url']}?{urllib.parse.urlencode(params)}"
    return OAuthConnectUrlOut(auth_url=auth_url)


@router.post("/callback/{provider}", response_model=UserIntegrationOut)
async def oauth_callback(
    provider: str,
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Handle OAuth callback exchange from frontend after redirect from provider.
    Exchanges code for access/refresh tokens, encrypts them, and saves to database.
    """
    provider_lower = provider.lower()
    if provider_lower not in PROVIDERS:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    # Validate state matches current user
    parts = state.split("::")
    if len(parts) != 2 or parts[0] != str(user.id) or parts[1] != provider_lower:
        raise HTTPException(status_code=403, detail="Invalid OAuth state parameter or user mismatch.")

    settings = get_settings()
    cfg = PROVIDERS[provider_lower]
    
    if provider_lower == "google":
        client_id = settings.oauth_google_client_id
        client_secret = settings.oauth_google_client_secret
    elif provider_lower == "github":
        client_id = settings.oauth_github_client_id
        client_secret = settings.oauth_github_client_secret
    elif provider_lower == "slack":
        client_id = settings.oauth_slack_client_id
        client_secret = settings.oauth_slack_client_secret
    else:
        client_id, client_secret = "", ""

    if not client_id or not client_secret:
        raise HTTPException(status_code=501, detail="Provider OAuth secrets not configured.")

    base = settings.frontend_url.rstrip("/")
    redirect_uri = f"{base}/dashboard/integrations/callback/{provider_lower}"

    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri,
    }
    
    if provider_lower == "google":
        payload["grant_type"] = "authorization_code"

    headers = {"Accept": "application/json"}
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(cfg["token_url"], data=payload, headers=headers)
        if r.status_code >= 400:
            log.error(f"OAuth token exchange failed for {provider}: {r.text}")
            raise HTTPException(status_code=r.status_code, detail="OAuth code exchange failed with provider.")
        
        token_data = r.json()

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in")
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Provider response missing access token.")

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in)) if expires_in else None

    # Fetch user account details from provider if possible
    account_id = f"connected_{provider_lower}"
    if provider_lower == "google":
        async with httpx.AsyncClient(timeout=10.0) as client:
            userinfo = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo.status_code == 200:
                account_id = userinfo.json().get("email", account_id)
    elif provider_lower == "github":
        async with httpx.AsyncClient(timeout=10.0) as client:
            userinfo = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}", "User-Agent": "api2bot-studio"}
            )
            if userinfo.status_code == 200:
                account_id = userinfo.json().get("login", account_id)
    elif provider_lower == "slack":
        async with httpx.AsyncClient(timeout=10.0) as client:
            userinfo = await client.post(
                "https://slack.com/api/auth.test",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if userinfo.status_code == 200:
                body = userinfo.json()
                if body.get("ok"):
                    account_id = f"{body.get('team', 'SlackTeam')}::{body.get('user', 'User')}"

    # Securely encrypt tokens before storing in DB
    enc_access = encrypt_secret(access_token)
    enc_refresh = encrypt_secret(refresh_token) if refresh_token else None

    # Check for existing integration
    integration = db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == provider_lower
    ).first()

    if integration:
        integration.access_token = enc_access
        if enc_refresh:
            integration.refresh_token = enc_refresh
        integration.expires_at = expires_at
        integration.account_id = account_id
        integration.scopes = cfg["default_scopes"]
    else:
        integration = UserIntegration(
            user_id=user.id,
            provider=provider_lower,
            account_id=account_id,
            access_token=enc_access,
            refresh_token=enc_refresh,
            expires_at=expires_at,
            scopes=cfg["default_scopes"]
        )
        db.add(integration)

    db.commit()
    db.refresh(integration)
    return integration


@router.get("/list", response_model=list[UserIntegrationOut])
def list_integrations(user: User = Depends(get_current_user)):
    """List all connected integrations for the current user."""
    return user.integrations


@router.delete("/disconnect/{integration_id}", response_model=MessageOut)
def disconnect_integration(
    integration_id: int, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    """Disconnect an integration and delete stored credentials."""
    integration = db.query(UserIntegration).filter(
        UserIntegration.id == integration_id,
        UserIntegration.user_id == user.id
    ).first()
    
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found or access denied.")
    
    db.delete(integration)
    db.commit()
    return MessageOut(message=f"Successfully disconnected {integration.provider.capitalize()}.")


@router.post("/disconnect/provider/{provider}", response_model=MessageOut)
def disconnect_provider_oauth(
    provider: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Disconnect OAuth session for a given provider string (e.g. notion, googledrive):
    deletes database vault records and executes smithery CLI logout to force a brand new OAuth authorization handshake on next connect.
    """
    provider_lower = provider.lower()
    db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == provider_lower
    ).delete()
    db.commit()

    npx_cmd = shutil.which("npx") or ("npx.cmd" if os.name == "nt" else "npx")
    try:
        subprocess.run([npx_cmd, "-y", "@smithery/cli@latest", "logout"], capture_output=True, timeout=10)
    except Exception as e:
        log.error(f"Error executing smithery logout: {e}")

    return MessageOut(message=f"Successfully disconnected {provider} and wiped cached OAuth credentials.")
