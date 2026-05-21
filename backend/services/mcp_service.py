"""
services/mcp_service.py — Model Context Protocol execution layer.

Handles executing MCP tools over HTTP / Server-Sent Events (SSE) gateways.
Automatically integrates with our OAuth token vault to inject decrypted,
fresh credentials into the tool execution environment.
"""
import asyncio
from datetime import datetime, timedelta, timezone
import logging
from typing import Any, Optional
import httpx
from sqlalchemy.orm import Session

from config.config import get_settings
from database.database import SessionLocal
from models.models import UserIntegration
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
    "instagram": "instagram",
    "youtube": "youtube",
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
        elif integration.provider == "youtube":
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
        elif integration.provider == "instagram":
            token_url = "https://graph.facebook.com/v19.0/oauth/access_token"
            client_id = settings.oauth_instagram_client_id
            client_secret = settings.oauth_instagram_client_secret

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
                        new_expires_at = None
                        if expires_in:
                            new_expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                        
                        db.query(UserIntegration).filter(UserIntegration.id == integration.id).update({
                            "access_token": encrypt_secret(new_access),
                            "refresh_token": encrypt_secret(new_refresh),
                            "expires_at": new_expires_at or integration.expires_at
                        })
                        db.commit()
                        log.info(f"Successfully refreshed OAuth token for {integration.provider}.")
                        return new_access
        except Exception as e:
            log.error(f"Error during OAuth token refresh: {e}")

    return dec_access


# ── Composio Cloud MCP Gateway ──────────────────────────────────
COMPOSIO_MCP_URL = "https://connect.composio.dev/mcp"


def normalize_mcp_url(url: str) -> str:
    url_lower = url.lower()
    
    # Catch legacy/hardcoded npx endpoints in user databases
    if "mcp-youtube" in url_lower:
        return "composio:youtube"
    if "server-github" in url_lower:
        return "composio:github"
        
    if "api2bot.studio" in url_lower or "localhost:8000" in url_lower or "mcp-server" in url_lower:
        if "google" in url_lower or "drive" in url_lower or "gdrive" in url_lower:
            return "composio:googledrive"
        elif "github" in url_lower:
            return "composio:github"
        elif "slack" in url_lower:
            return "composio:slack"
        elif "instagram" in url_lower:
            return "composio:instagram"
        elif "youtube" in url_lower:
            return "composio:youtube"
    return url


async def _composio_rpc(method: str, params: Optional[dict] = None, timeout: float = 30.0, user_id: Optional[str] = "default", target_toolkit: Optional[str] = None) -> dict:
    """
    Connect to the Composio Cloud MCP gateway using the official MCP SSE transport protocol.
    """
    from mcp.client.streamable_http import streamablehttp_client
    from mcp.client.session import ClientSession
    
    settings = get_settings()
    api_key = settings.composio_api_key
    if not api_key:
        log.error("COMPOSIO_API_KEY is not configured. Cannot call Composio MCP gateway.")
        return {"error": {"message": "Composio API key not configured.", "code": -32000}}

    try:
        # Create a dynamic Tool Router session for this specific user
        import httpx
        async with httpx.AsyncClient() as client:
            # First fetch the connected accounts to build the toolkits allowlist
            toolkits_allowlist = []
            try:
                acc_resp = await client.get(
                    "https://backend.composio.dev/api/v3.1/connected_accounts",
                    params={"user_ids": user_id or "default"},
                    headers={"x-api-key": api_key},
                    timeout=timeout
                )
                if acc_resp.status_code == 200:
                    for item in acc_resp.json().get("items", []):
                        # Extract the slug, trying various common naming conventions in the Composio API
                        slug = item.get("toolkit_slug") or item.get("appSlug") or item.get("toolkitSlug") or item.get("appId")
                        if slug and slug not in toolkits_allowlist:
                            toolkits_allowlist.append(slug)
            except Exception as e:
                log.warning(f"Failed to fetch connected accounts for toolkits allowlist: {e}")

            if target_toolkit and target_toolkit not in toolkits_allowlist:
                toolkits_allowlist.append(target_toolkit)

            # Construct session payload
            payload = {"user_id": user_id or "default"}
            if toolkits_allowlist:
                payload["toolkits"] = {"enable": toolkits_allowlist}
                payload["preload"] = {"tools": "all"}

            session_resp = await client.post(
                "https://backend.composio.dev/api/v3.1/tool_router/session",
                json=payload,
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
                timeout=timeout
            )
            session_resp.raise_for_status()
            session_data = session_resp.json()
            
        mcp_data = session_data.get("mcp", {})
        mcp_url = mcp_data.get("url")
        mcp_headers = mcp_data.get("headers", {})
        
        # Ensure the API key is passed to the MCP endpoint
        if not mcp_headers:
            mcp_headers = {}
        mcp_headers["x-api-key"] = api_key
        # Some endpoints might expect Bearer token instead
        mcp_headers["Authorization"] = f"Bearer {api_key}"

        if not mcp_url:
            return {"error": {"message": "Failed to retrieve Composio MCP URL", "code": -32000}}

        async with streamablehttp_client(mcp_url, headers=mcp_headers, timeout=timeout) as (read_stream, write_stream, _):
            async with ClientSession(read_stream, write_stream) as session:
                await session.initialize()
                
                if method == "tools/list":
                    res = await session.list_tools()
                    # Convert Pydantic models to dict to match our expected format
                    return {"result": {"tools": [t.model_dump() for t in res.tools]}}
                    
                elif method == "tools/call":
                    if not params or "name" not in params:
                        return {"error": {"message": "Missing tool name", "code": -32602}}
                        
                    res = await session.call_tool(params["name"], params.get("arguments", {}))
                    return {"result": {"content": [c.model_dump() for c in res.content]}}
                    
                else:
                    return {"error": {"message": f"Unsupported method {method}", "code": -32601}}
                    
    except Exception as exc:
        err_msg = str(exc)
        # Try to extract detailed response text if it's an HTTPStatusError wrapped in an ExceptionGroup
        if hasattr(exc, "exceptions"):
            for sub_exc in exc.exceptions:
                if hasattr(sub_exc, "response"):
                    try:
                        err_msg = f"{sub_exc.response.status_code} - {sub_exc.response.text}"
                    except Exception:
                        pass
        elif hasattr(exc, "response"):
            try:
                err_msg = f"{exc.response.status_code} - {exc.response.text}"
            except Exception:
                pass
                
        log.exception(f"Composio MCP gateway error: {err_msg}")
        return {"error": {"message": err_msg, "code": -32002}}


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

    # ── Composio cloud gateway ──────────────────────────────────
    if url_lower.startswith("composio:"):
        target_toolkit = url_lower.split(":", 1)[1] if ":" in url_lower else None
        resp = await _composio_rpc("tools/list", timeout=60.0, user_id=user_id or "default", target_toolkit=target_toolkit)
        if "error" in resp:
            log.warning(f"Composio tool discovery failed: {resp['error']}")
            return []
        tools = resp.get("result", {}).get("tools", [])
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

    # ── Local subprocess (npx, docker, python) ────────────────
    if url_lower.startswith("docker:") or url_lower.startswith("npx:") or url_lower.startswith("python:"):
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
        return asyncio.run(_discover_async(mcp_server_url, user_id))
    except Exception as e:
        log.error(f"Error discovering MCP tools: {e}")
        return []

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

    # ── Composio cloud gateway ──────────────────────────────────
    if url_lower.startswith("composio:"):
        target_toolkit = url_lower.split(":", 1)[1] if ":" in url_lower else None
        resp = await _composio_rpc("tools/call", {"name": tool_name, "arguments": arguments}, timeout=60.0, user_id=user_id or "default", target_toolkit=target_toolkit)
        latency = int((asyncio.get_event_loop().time() - start_time) * 1000)
        if "error" in resp:
            err = resp["error"]
            return {"error": err.get("message", "Composio error")}, err.get("code", 500), latency
        result = resp.get("result", {})
        content = result.get("content", [])
        if isinstance(content, list) and len(content) == 1 and isinstance(content[0], dict) and content[0].get("type") == "text":
            return {"data": content[0].get("text", "")}, 200, latency
        return {"data": result}, 200, latency

    # ── Local subprocess (npx, docker, python) ────────────────
    if url_lower.startswith("docker:") or url_lower.startswith("npx:") or url_lower.startswith("python:"):
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
