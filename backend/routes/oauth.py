"""
routes/oauth.py — OAuth 2.0 integration management.

Handles connecting external provider accounts (Google, GitHub, etc.),
securely exchanging codes for tokens, encrypting them via AES-256,
and persisting them in the UserIntegration vault.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from config.config import get_settings
from database.database import get_db
from models.models import User, UserIntegration
from schemas.schemas import MessageOut, OAuthConnectUrlOut
from utils.auth import get_current_user

class ApiKeyInput(BaseModel):
    api_key: str

log = logging.getLogger(__name__)

router = APIRouter(prefix="/oauth", tags=["OAuth Integrations"])

# Custom OAuth providers logic removed as requested


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

    settings = get_settings()
    base = settings.frontend_url.rstrip("/")
    redirect_uri = f"{base}/dashboard/integrations/callback/{provider_lower}"

    # Use Composio OAuth directly
    if settings.composio_api_key:
        try:
            from composio import Composio
            c = Composio(api_key=settings.composio_api_key)
            
            # Special case mapping for providers if needed (e.g. google is standard, but you might want googledrive)
            # We'll try the exact provider string first
            if hasattr(c, "toolkits"):
                auth_id = c.toolkits._get_auth_config_id(provider_lower)
                if not auth_id:
                    raise ValueError(f"Composio auth config not found for {provider_lower}")
                    
                conn = c.connected_accounts.link(user_id=str(user.id), auth_config_id=auth_id, callback_url=redirect_uri, allow_multiple=True)
            else:
                integrations = c.integrations.get(app_name=provider_lower)
                if not integrations:
                    raise ValueError(f"Composio integration not found for {provider_lower}")
                auth_id = integrations[0].id
                conn = c.connected_accounts.initiate(entity_id=str(user.id), integration_id=auth_id, redirect_url=redirect_uri, allow_multiple=True)
            
            redirect_url = getattr(conn, "redirect_url", None) or getattr(conn, "redirectUrl", None)
            return OAuthConnectUrlOut(auth_url=redirect_url)
        except Exception as e:
            log.error(f"Failed to generate Composio connection link for {provider_lower}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect via Composio: {e}")
            
    raise HTTPException(status_code=501, detail="Composio API key is not configured on the server.")


@router.post("/apikey/{provider}", response_model=MessageOut)
def connect_apikey(
    provider: str,
    input: ApiKeyInput,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save an API Key natively to bypass Composio for custom auth providers.
    """
    provider_lower = provider.lower()

    try:
        existing = db.query(UserIntegration).filter(
            UserIntegration.user_id == user.id,
            UserIntegration.provider == provider_lower
        ).first()
        
        if existing:
            existing.access_token = input.api_key
        else:
            db.add(UserIntegration(
                user_id=user.id,
                provider=provider_lower,
                access_token=input.api_key,
                account_id="native_api_key",
                refresh_token=None,
                scopes=[],
            ))
        db.commit()

        return MessageOut(message=f"Successfully connected {provider_lower} natively using API Key.")

    except Exception as e:
        log.error(f"Failed to save native API Key for {provider_lower}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save API Key: {str(e)}")


@router.get("/list")
def list_integrations(user: User = Depends(get_current_user)):
    """List all explicitly connected integrations for the current user."""
    return [
        {"id": i.id, "provider": i.provider, "source": "db"}
        for i in user.integrations
    ]


@router.get("/providers")
def list_providers():
    """Return the central integration registry so the frontend can dynamically resolve auth types and aliases."""
    from services.mcp_registry import INTEGRATION_REGISTRY
    return INTEGRATION_REGISTRY


@router.post("/mark-connected", response_model=MessageOut)
def mark_connected(
    provider: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record that the user explicitly connected a toolkit via Composio OAuth.
    
    This is called after the OAuth callback succeeds so we track exactly which
    toolkits the user connected — not all Composio accounts.
    """
    provider_lower = provider.lower()
    
    # Only insert if not already present
    existing = db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == provider_lower
    ).first()
    
    if not existing:
        db.add(UserIntegration(
            user_id=user.id,
            provider=provider_lower,
            access_token="composio",  # nosec B106 - Composio manages the actual token
            account_id=None,
            refresh_token=None,
            expires_at=None,
            scopes=[],
        ))
        db.commit()
    
    return MessageOut(message=f"Marked {provider} as connected.")


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
    deletes database vault records to force a brand new OAuth authorization handshake on next connect.
    """
    provider_lower = provider.lower()
    db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == provider_lower
    ).delete()
    db.commit()

    return MessageOut(message=f"Successfully disconnected {provider} and wiped cached OAuth credentials.")
