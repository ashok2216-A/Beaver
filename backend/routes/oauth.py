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
from pathlib import Path
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
import httpx
from sqlalchemy.orm import Session

from config.config import get_settings
from database.database import get_db
from models.models import User, UserIntegration
from schemas.schemas import MessageOut, UserIntegrationOut, OAuthConnectUrlOut
from utils.auth import get_current_user
from utils.security import encrypt_secret, decrypt_secret

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
                    
                conn = c.connected_accounts.link(user_id=str(user.id), auth_config_id=auth_id, callback_url=redirect_uri)
            else:
                integrations = c.integrations.get(app_name=provider_lower)
                if not integrations:
                    raise ValueError(f"Composio integration not found for {provider_lower}")
                auth_id = integrations[0].id
                conn = c.connected_accounts.initiate(entity_id=str(user.id), integration_id=auth_id, redirect_url=redirect_uri)
            
            redirect_url = getattr(conn, "redirect_url", None) or getattr(conn, "redirectUrl", None)
            return OAuthConnectUrlOut(auth_url=redirect_url)
        except Exception as e:
            log.error(f"Failed to generate Composio connection link for {provider_lower}: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to connect via Composio: {e}")
            
    raise HTTPException(status_code=501, detail="Composio API key is not configured on the server.")


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
    deletes database vault records to force a brand new OAuth authorization handshake on next connect.
    """
    provider_lower = provider.lower()
    db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.provider == provider_lower
    ).delete()
    db.commit()

    return MessageOut(message=f"Successfully disconnected {provider} and wiped cached OAuth credentials.")
