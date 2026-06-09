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
            import httpx
            
            async with httpx.AsyncClient() as client:
                # 1. Fetch all auth configs to find the auth_config_id for the provider
                configs_resp = await client.get(
                    "https://backend.composio.dev/api/v3/auth_configs",
                    headers={"x-api-key": settings.composio_api_key},
                    timeout=10.0
                )
                configs_resp.raise_for_status()
                
                auth_config_id = None
                for c in configs_resp.json().get("items", []):
                    # Try to match the toolkit slug or name
                    slug = c.get("toolkit", {}).get("slug", "")
                    if slug == provider_lower or provider_lower in c.get("name", "").lower():
                        auth_config_id = c.get("id")
                        break
                        
                if not auth_config_id:
                    raise ValueError(f"No active Composio Auth Config found for toolkit: {provider_lower}")
                    
                # 2. Generate a new connection link for this user with the correct callback_url
                payload = {
                    "auth_config_id": auth_config_id,
                    "user_id": str(user.id),
                    "callback_url": redirect_uri
                }
                
                link_resp = await client.post(
                    "https://backend.composio.dev/api/v3/connected_accounts/link",
                    json=payload,
                    headers={"x-api-key": settings.composio_api_key},
                    timeout=10.0
                )
                link_resp.raise_for_status()
                
                link_data = link_resp.json()
                redirect_url = link_data.get("redirect_url")
                
                if not redirect_url:
                    raise ValueError(f"Failed to generate redirect_url: {link_data}")
                    
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
    from utils.security import encrypt_secret

    try:
        existing = db.query(UserIntegration).filter(
            UserIntegration.user_id == user.id,
            UserIntegration.provider == provider_lower
        ).first()
        
        if existing:
            existing.access_token = encrypt_secret(input.api_key)
        else:
            db.add(UserIntegration(
                user_id=user.id,
                provider=provider_lower,
                access_token=encrypt_secret(input.api_key),
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
    from services.mcp_registry import get_integration_registry
    return get_integration_registry()


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
