"""
services/mcp_service.py — Model Context Protocol execution layer.

Handles executing MCP tools over HTTP / Server-Sent Events (SSE) gateways.
Automatically integrates with our OAuth token vault to inject decrypted,
fresh credentials into the tool execution environment.
"""
import asyncio
from datetime import datetime, timedelta, timezone
import json
import logging
from typing import Any, Optional
import httpx
from sqlalchemy.orm import Session

from config import get_settings
from database import SessionLocal
from models import UserIntegration
from utils.security import decrypt_secret, encrypt_secret

log = logging.getLogger(__name__)

# Map MCP server identifiers to OAuth provider names
MCP_PROVIDER_MAP = {
    "gdrive": "google",
    "google_drive": "google",
    "googledrive": "google",
    "gmail": "google",
    "googlecalendar": "google",
    "googlesheets": "google",
    "googledocs": "google",
    "github": "github",
    "slack": "slack",
    "notion": "notion",
}


async def refresh_oauth_token_if_needed(integration: UserIntegration, db: Session) -> str:
    """
    Check if an OAuth access token is expired (or close to expiring).
    If expired, use the refresh token to get a fresh access token and persist it.
    Returns the decrypted, valid access token.
    """
    dec_access = decrypt_secret(integration.access_token)
    if not integration.expires_at or not integration.refresh_token:
        return dec_access

    # Check if within 5 minutes of expiration
    if datetime.now(timezone.utc) >= (integration.expires_at - timedelta(minutes=5)):
        log.info(f"OAuth token for {integration.provider} expired or expiring soon. Auto-refreshing...")
        dec_refresh = decrypt_secret(integration.refresh_token)
        settings = get_settings()
        
        token_url = ""
        client_id, client_secret = "", ""
        if integration.provider == "google":
            token_url = "https://oauth2.googleapis.com/token"
            client_id = settings.oauth_google_client_id
            client_secret = settings.oauth_google_client_secret
        elif integration.provider == "github":
            token_url = "https://github.com/login/oauth/access_token"
            client_id = settings.oauth_github_client_id
            client_secret = settings.oauth_github_client_secret
        elif integration.provider == "slack":
            token_url = "https://slack.com/api/oauth.v2.access"
            client_id = settings.oauth_slack_client_id
            client_secret = settings.oauth_slack_client_secret

        if not token_url or not client_id:
            log.warning(f"Unable to refresh token for {integration.provider}: Missing client credentials.")
            return dec_access

        payload = {
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": dec_refresh,
            "grant_type": "refresh_token",
        }
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(token_url, data=payload, headers={"Accept": "application/json"})
                if r.status_code < 400:
                    data = r.json()
                    new_access = data.get("access_token")
                    new_refresh = data.get("refresh_token", dec_refresh)
                    expires_in = data.get("expires_in")
                    
                    if new_access:
                        integration.access_token = encrypt_secret(new_access)
                        integration.refresh_token = encrypt_secret(new_refresh)
                        if expires_in:
                            integration.expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                        db.commit()
                        log.info(f"Successfully refreshed OAuth token for {integration.provider}.")
                        return new_access
        except Exception as e:
            log.error(f"Error during OAuth token refresh: {e}")

    return dec_access


def normalize_mcp_url(url: str) -> str:
    url_lower = url.lower()
    if "api2bot.studio" in url_lower or "localhost:8000" in url_lower or "mcp-server" in url_lower:
        if "google" in url_lower or "drive" in url_lower or "gdrive" in url_lower:
            return "smithery:googledrive"
        elif "github" in url_lower:
            return "smithery:github"
        elif "slack" in url_lower:
            return "smithery:slack"
    return url


async def _discover_async(mcp_server_url: str, user_id: Optional[str]) -> list[dict[str, Any]]:
    mcp_server_url = normalize_mcp_url(mcp_server_url)
    url_lower = mcp_server_url.lower()

    provider = None
    for key, val in MCP_PROVIDER_MAP.items():
        if key in url_lower:
            provider = val
            break

    auth_token = ""
    if provider and user_id:
        try:
            with SessionLocal() as db:
                integration = db.query(UserIntegration).filter(
                    UserIntegration.user_id == str(user_id),
                    UserIntegration.provider == provider.lower()
                ).first()
                if integration:
                    auth_token = await refresh_oauth_token_if_needed(integration, db)
        except Exception as e:
            log.error(f"Failed to fetch integration token in discovery: {e}")

    if url_lower.startswith("docker:") or url_lower.startswith("npx:") or url_lower.startswith("python:") or url_lower.startswith("smithery:"):
        from services.mcp_subprocess import subprocess_manager
        try:
            return await subprocess_manager.discover_tools(mcp_server_url, auth_token)
        except Exception as e:
            log.warning(f"Failed stdio subprocess tool discovery for {mcp_server_url}: {e}")
            return []

    rpc_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if user_id:
        headers["X-User-Id"] = str(user_id)
    if auth_token:
        headers["X-OAuth-Token"] = auth_token
        headers["Authorization"] = f"Bearer {auth_token}"

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            r = await client.post(mcp_server_url, json=rpc_payload, headers=headers)
            if r.status_code == 200:
                data = r.json()
                tools = data.get("result", {}).get("tools", [])
                if tools:
                    return [
                        {
                            "name": t.get("name", "tool"),
                            "description": t.get("description", ""),
                            "parameters": [
                                {"name": k, "type": v.get("type", "string"), "required": k in t.get("inputSchema", {}).get("required", [])}
                                for k, v in t.get("inputSchema", {}).get("properties", {}).items()
                            ]
                        }
                        for t in tools if isinstance(t, dict)
                    ]
    except Exception as e:
        log.warning(f"Failed to fetch dynamic tools async from {mcp_server_url}: {e}")

    return []


def discover_mcp_tools_sync(mcp_server_url: str, user_id: Optional[str] = None) -> list[dict[str, Any]]:
    """
    Call tools/list on remote MCP server or local stdio package to discover tools and their schemas dynamically.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(_discover_async(mcp_server_url, user_id))

async def execute_mcp_tool(
    user_id: str,
    mcp_server_url: str,
    tool_name: str,
    arguments: dict[str, Any],
    provider_hint: Optional[str] = None
) -> tuple[Any, int, int]:
    """
    Execute a Model Context Protocol tool call against a remote HTTP/SSE gateway or local stdio package.
    Automatically retrieves and refreshes user OAuth tokens.

    Returns: (response_data, status_code, latency_ms)
    """
    start_time = asyncio.get_event_loop().time()
    
    mcp_server_url = normalize_mcp_url(mcp_server_url)
    
    url_lower = mcp_server_url.lower()
    provider = provider_hint
    if not provider:
        for key, val in MCP_PROVIDER_MAP.items():
            if key in mcp_server_url.lower() or key in tool_name.lower():
                provider = val
                break

    auth_token = ""
    if provider:
        try:
            with SessionLocal() as db:
                integration = db.query(UserIntegration).filter(
                    UserIntegration.user_id == user_id,
                    UserIntegration.provider == provider.lower()
                ).first()
                
                if integration:
                    auth_token = await refresh_oauth_token_if_needed(integration, db)
        except Exception as e:
            log.error(f"Failed to fetch integration token for MCP: {e}")

    if url_lower.startswith("docker:") or url_lower.startswith("npx:") or url_lower.startswith("python:") or url_lower.startswith("smithery:"):
        from services.mcp_subprocess import subprocess_manager
        data, status = await subprocess_manager.execute_tool(f"session_{user_id}_{mcp_server_url}", mcp_server_url, tool_name, arguments, auth_token)
        latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
        return {"data": data}, status, latency

    # 2. Build Standard MCP JSON-RPC Payload
    rpc_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }

    # Pass the user OAuth token securely via headers to the remote MCP Gateway
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-User-Id": str(user_id),
    }
    
    if auth_token:
        headers["X-OAuth-Token"] = auth_token
        headers["Authorization"] = f"Bearer {auth_token}"

    log.info(f"MCP EXECUTOR: Calling {tool_name} on remote server {mcp_server_url} (Provider={provider})")

    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            r = await client.post(mcp_server_url, json=rpc_payload, headers=headers)
            latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
            
            if r.status_code >= 400:
                log.error(f"MCP Gateway error: {r.text}")
                return {"error": "mcp_gateway_error", "detail": r.text}, r.status_code, latency

            resp_data = r.json()
            # Standard MCP tool response format: { "jsonrpc": "2.0", "id": 1, "result": { "content": [{ "type": "text", "text": "..." }] } }
            result = resp_data.get("result", {})
            content = result.get("content", [])
            
            # Unwrap text content if present
            if isinstance(content, list) and len(content) == 1 and isinstance(content[0], dict) and content[0].get("type") == "text":
                return {"data": content[0].get("text", "")}, 200, latency
                
            return {"data": result}, 200, latency

    except httpx.TimeoutException:
        latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
        return {"error": "mcp_timeout", "detail": f"MCP server at {mcp_server_url} timed out after 30s."}, 504, latency
    except Exception as exc:
        latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
        log.exception(f"MCP execution failed for {tool_name}")
        return {"error": "mcp_internal_error", "detail": str(exc)}, 500, latency
