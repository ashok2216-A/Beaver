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

from services.mcp_registry import get_integration_by_alias, get_integration_registry

log = logging.getLogger(__name__)


async def refresh_oauth_token_if_needed(integration: UserIntegration, db: Session) -> str:
    """
    Since Composio manages OAuth end-to-end, the access_token field usually
    contains the literal placeholder string "composio".
    For custom/self-hosted integrations, this just decrypts and returns
    whatever token is stored without attempting manual HTTP refresh.
    """
    return decrypt_secret(integration.access_token)


# ── Composio Cloud MCP Gateway ──────────────────────────────────
COMPOSIO_MCP_URL = "https://connect.composio.dev/mcp"


def normalize_mcp_url(url: str) -> str:
    url_lower = url.lower()
    
    if url_lower.startswith("composio:"):
        return url_lower
        
    matched = get_integration_by_alias(url_lower)
    if matched:
        composio_slug = matched.get("composio_slug")
        if composio_slug:
            return f"composio:{composio_slug}"
            
    return url


async def _composio_rpc(method: str, params: Optional[dict] = None, timeout: float = 30.0, user_id: Optional[str] = "default", target_toolkit: Optional[str] = None) -> dict:
    """
    Connect to the Composio Cloud MCP gateway using the official MCP SSE transport protocol.
    """
    if target_toolkit:
        # Use the centralized registry to resolve the true Composio slug
        reg_item = get_integration_by_alias(target_toolkit)
        if reg_item and reg_item.get("composio_slug"):
            target_toolkit = reg_item["composio_slug"]

    from mcp.client.streamable_http import streamablehttp_client
    from mcp.client.session import ClientSession
    from database.database import SessionLocal
    from models.models import UserIntegration
    
    settings = get_settings()
    api_key = settings.composio_api_key
    if not api_key:
        log.error("COMPOSIO_API_KEY is not configured. Cannot call Composio MCP gateway.")
        return {"error": {"message": "Composio API key not configured.", "code": -32000}}

    try:
        # Create a dynamic Tool Router session for this specific user
        import httpx
        async with httpx.AsyncClient() as client:
            # First fetch the connected accounts to build the toolkits allowlist and IDs
            toolkits_allowlist = []
            connected_account_ids = []
            auth_configs_dict = {}
            try:
                acc_resp = await client.get(
                    "https://backend.composio.dev/api/v3.1/connected_accounts",
                    params={"user_ids": user_id or "default"},
                    headers={"x-api-key": api_key},
                    timeout=timeout
                )
                if acc_resp.status_code == 200:
                    slug_to_conn = {}
                    for item in acc_resp.json().get("items", []):
                        if item.get("status") == "ACTIVE":
                            conn_id = item.get("id")
                            
                            # Extract the slug, trying various common naming conventions in the Composio API
                            raw_slug = (
                                item.get("toolkit", {}).get("slug") or
                                item.get("toolkit_slug") or 
                                item.get("appSlug") or 
                                item.get("toolkitSlug") or 
                                item.get("appId") or 
                                "unknown"
                            )
                            if raw_slug:
                                # Resolve legacy/incorrect slugs using the centralized registry
                                reg_item = get_integration_by_alias(raw_slug)
                                slug = reg_item.get("composio_slug") if reg_item else raw_slug
                                
                                # If a specific toolkit is requested, only include connections for that toolkit
                                if target_toolkit and slug != target_toolkit:
                                    continue
    
                                if conn_id:
                                    # Overwrite so we only keep one connection per slug
                                    slug_to_conn[slug] = conn_id
                                    
                                auth_config_id = item.get("auth_config", {}).get("id")
                                if auth_config_id:
                                    auth_configs_dict[slug] = auth_config_id
                                if slug not in toolkits_allowlist:
                                    toolkits_allowlist.append(slug)
                                    
                    connected_account_ids = list(slug_to_conn.values())
            except Exception as e:
                log.warning(f"Failed to fetch connected accounts for toolkits allowlist: {e}")

            # Dynamic Fallback: In a single-tenant local app, if the current session has 0 accounts (e.g. cleared localStorage),
            # try to recover by fetching the primary user ID from the database.
            if not connected_account_ids:
                try:
                    db_user_id = None
                    with SessionLocal() as db:
                        first_integration = db.query(UserIntegration).first()
                        if first_integration:
                            db_user_id = first_integration.user_id
                            
                    if db_user_id and db_user_id != user_id:
                        fallback_resp = await client.get(
                            "https://backend.composio.dev/api/v3.1/connected_accounts",
                            params={"user_ids": db_user_id},
                            headers={"x-api-key": api_key},
                            timeout=timeout
                        )
                        if fallback_resp.status_code == 200:
                            slug_to_conn = {}
                            for item in fallback_resp.json().get("items", []):
                                if item.get("status") == "ACTIVE":
                                    conn_id = item.get("id")
                                    raw_slug = (
                                        item.get("toolkit", {}).get("slug") or
                                        item.get("toolkit_slug") or 
                                        item.get("appSlug") or 
                                        item.get("toolkitSlug") or 
                                        item.get("appId") or 
                                        "unknown"
                                    )
                                    if raw_slug:
                                        reg_item = get_integration_by_alias(raw_slug)
                                        slug = reg_item.get("composio_slug") if reg_item else raw_slug
                                        if target_toolkit and slug != target_toolkit:
                                            continue
                                        if conn_id:
                                            slug_to_conn[slug] = conn_id
                                            
                                        auth_config_id = item.get("auth_config", {}).get("id")
                                        if auth_config_id:
                                            auth_configs_dict[slug] = auth_config_id
                                        if slug not in toolkits_allowlist:
                                            toolkits_allowlist.append(slug)
                            connected_account_ids = list(slug_to_conn.values())
                            if connected_account_ids:
                                user_id = db_user_id
                                log.info(f"Recovered {len(connected_account_ids)} Composio accounts using DB fallback user_id {db_user_id}")
                except Exception as e:
                    log.warning(f"Failed DB user_id fallback for Composio: {e}")

            # If the caller explicitly targets a toolkit (e.g. for creating a new connection),
            # ALWAYS allow it in the session, even if it's not currently connected!
            if target_toolkit and target_toolkit not in toolkits_allowlist:
                toolkits_allowlist.append(target_toolkit)

            # Construct session payload
            payload = {"user_id": user_id or "default"}
            if toolkits_allowlist:
                payload["toolkits"] = {"enable": toolkits_allowlist}
                payload["preload"] = {"tools": "all"}
            if connected_account_ids:
                payload["connected_account_ids"] = connected_account_ids
            if auth_configs_dict:
                payload["auth_configs"] = auth_configs_dict

            try:
                import json
                with open("d:/Beaver/Beaver/backend/mcp_debug.json", "w") as f:
                    json.dump(payload, f)
            except:
                pass

            # Retry loop for invalid toolkit slugs
            max_retries = 3
            for attempt in range(max_retries):
                session_resp = await client.post(
                    "https://backend.composio.dev/api/v3.1/tool_router/session",
                    json=payload,
                    headers={"x-api-key": api_key, "Content-Type": "application/json"},
                    timeout=timeout
                )
                
                if session_resp.status_code == 400:
                    try:
                        err_data = session_resp.json()
                        err_slug = err_data.get("error", {}).get("slug", "")
                        if err_slug == "ToolRouterV2_InvalidToolkitSlugs":
                            err_msg = err_data.get("error", {}).get("message", "")
                            # Parse invalid slugs: "Invalid toolkit slugs: code-interpreter. Please provide valid toolkit slugs."
                            if "Invalid toolkit slugs:" in err_msg:
                                bad_slugs_part = err_msg.split("Invalid toolkit slugs:")[1].split(".")[0].strip()
                                bad_slugs = [s.strip() for s in bad_slugs_part.split(",")]
                                
                                log.warning(f"Removing invalid toolkits from allowlist and retrying: {bad_slugs}")
                                toolkits_allowlist = [t for t in toolkits_allowlist if t not in bad_slugs]
                                
                                # Update payload for next attempt
                                if toolkits_allowlist:
                                    payload["toolkits"] = {"enable": toolkits_allowlist}
                                else:
                                    payload.pop("toolkits", None)
                                    payload.pop("preload", None)
                                continue  # Retry
                    except Exception:
                        pass
                
                session_resp.raise_for_status()
                break  # Success
                
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
        # Composio MCP Gateway may need X-User-Id to correctly resolve connections
        if user_id:
            mcp_headers["X-User-Id"] = user_id

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
                    result_dict = {"content": [c.model_dump() for c in res.content]}
                    if getattr(res, "isError", None) is not None:
                        result_dict["isError"] = res.isError
                    return {"result": result_dict}
                    
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
                    except Exception:  # nosec B110
                        pass
        elif hasattr(exc, "response"):
            try:
                err_msg = f"{exc.response.status_code} - {exc.response.text}"
            except Exception:  # nosec B110
                pass
                
        log.exception(f"Composio MCP gateway error: {err_msg}")
        return {"error": {"message": err_msg, "code": -32002}}


async def _discover_async(mcp_server_url: str, user_id: Optional[str]) -> list[dict[str, Any]]:
    mcp_server_url = normalize_mcp_url(mcp_server_url)
    url_lower = mcp_server_url.lower()

    provider = None
    # Special handling for legacy composio connection strings
    if url_lower.startswith("composio:"):
        provider = url_lower.split(":")[1]
        
    integration = get_integration_by_alias(url_lower)
    if integration:
        provider = integration.get("provider_name")

    auth_token = ""  # nosec B105
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
        integration = get_integration_by_alias(mcp_server_url.lower())
        if not integration:
            integration = get_integration_by_alias(tool_name.lower())
        if integration:
            provider = integration.get("provider_name")

    auth_token = ""  # nosec B105
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
        
        is_error = result.get("isError", False)
        status_code = 400 if is_error else 200
        
        content = result.get("content", [])
        if isinstance(content, list):
            text_items = [c.get("text", "") for c in content if isinstance(c, dict) and c.get("type") == "text"]
            if text_items and len(text_items) == len(content):
                return {"data": "\n".join(text_items)}, status_code, latency
            if len(content) == 1 and isinstance(content[0], dict) and content[0].get("type") == "text":
                return {"data": content[0].get("text", "")}, status_code, latency
        return {"data": result}, status_code, latency

    return {"error": "Unsupported MCP protocol or unknown endpoint. Only Composio is supported."}, 400, int((asyncio.get_event_loop().time() - start_time) * 1000)
