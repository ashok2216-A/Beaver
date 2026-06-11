"""
services/executor.py — Dynamic API executor.

Handles:
  - Path parameter substitution  (/v1/customers/{id} → /v1/customers/cus_123)
  - Query vs body parameter placement
  - Bearer / API-key authentication
  - Timeout and error handling
"""
from __future__ import annotations
import json
import logging
import re
import time
from typing import Any, Optional

import httpx
from utils.security import validate_url_safe

log = logging.getLogger(__name__)

TIMEOUT = 15.0   # seconds


def _substitute_path_params(path: str, params: dict[str, Any]) -> tuple[str, dict]:
    """
    Replace {name} tokens in path with values from params.
    Returns (resolved_path, remaining_params).
    """
    remaining = dict(params)
    placeholders = re.findall(r"\{(\w+)\}", path)
    for name in placeholders:
        if name in remaining:
            val = str(remaining.pop(name)).strip()
            path = path.replace(f"{{{name}}}", val)
    return path, remaining


def _build_auth_headers(auth_type: str, auth_secret: str, url: str, auth_header: str | None = None) -> dict[str, str]:
    if not auth_secret:
        return {}
    
    # Normalize inputs
    a_type = (auth_type or "bearer").lower()
    header_name = auth_header or "Authorization"
    
    # Clean the secret (token)
    token = auth_secret.strip()

    # SEC: If the secret is a JSON block (multi-key), we usually don't want to send it in a header
    # unless explicitly requested via auth_header. This prevents leaking JSON keys in Bearer headers.
    if token.startswith("{") and a_type in ("apikey", "query_key") and not auth_header:
        return {}

    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    elif token.lower().startswith("token "):
        token = token[6:].strip()

    # If we are using the standard 'Authorization' header
    if header_name.lower() == "authorization":
        if a_type == "apikey":
            return {"Authorization": token}
        return {"Authorization": f"Bearer {token}"}

    # If it's a truly custom header (e.g. x-api-key)
    if a_type == "apikey" or auth_header:
        return {header_name: token}

    return {}


def _unflatten_params(params: dict[str, Any]) -> dict[str, Any]:
    """
    Convert a flat dict with dot-notation keys into a nested dict.
    e.g. {'user.name': 'Bob', 'user.age': 30} -> {'user': {'name': 'Bob', 'age': 30}}
    """
    result = {}
    for key, value in params.items():
        if "." not in key:
            result[key] = value
            continue
            
        parts = key.split(".")
        d = result
        for part in parts[:-1]:
            if part not in d or not isinstance(d[part], dict):
                d[part] = {}
            d = d[part]
        d[parts[-1]] = value
    return result


async def call_api(
    base_url: str,
    path: str,
    method: str,
    endpoint_params: list[dict],     # parameter defs from spec
    extracted_params: dict[str, Any],# values from LLM
    auth_type: str = "bearer",       # bearer | apikey | query_key | none
    auth_secret: str = "",
    auth_header: Optional[str] = None, # name of header or query param
    custom_headers: dict[str, str] | None = None,
) -> tuple[Any, int, int]:
    """
    Execute an API call and return (response_data, status_code, latency_ms).

    Parameters are routed automatically:
      - path params  → substituted into URL
      - query params → sent as URL query string
      - body params  → sent as JSON body
    """
    # Debug: Check if auth_secret is present
    masked_secret = f"{auth_secret[:2]}...{auth_secret[-2:]}" if len(auth_secret) > 4 else "too short"
    log.info(f"EXECUTOR: Calling {method} {path} | AuthType: {auth_type} | Secret: {masked_secret} (len={len(auth_secret)})")

    resolved_path, leftover = _substitute_path_params(path, extracted_params)
    
    # Self-Healing: Strip accidental domain names from the start of the path
    # e.g. /api.firecrawl.dev/v2/scrape -> /v2/scrape
    if resolved_path.startswith("/") and len(resolved_path.split("/")) > 2:
        parts = resolved_path.split("/")
        if "." in parts[1]: # Segment 1 is a domain like 'api.firecrawl.dev'
            resolved_path = "/" + "/".join(parts[2:])

    # Handle case where LLM passes a full URL in the path
    clean_base = base_url.strip()
    clean_path = resolved_path.strip()

    if clean_path.startswith("http://") or clean_path.startswith("https://"):
        url = clean_path
    else:
        # Add protocol to base_url if missing
        if clean_base and not clean_base.startswith("http://") and not clean_base.startswith("https://"):
            clean_base = "https://" + clean_base if "localhost" not in clean_base and "127.0.0.1" not in clean_base else "http://" + clean_base
            
        clean_base = clean_base.rstrip("/")
        clean_path = "/" + clean_path.lstrip("/")
        url = clean_base + clean_path

    # Final safety: Collapse any accidental double slashes (except the protocol)
    protocol = "https://" if url.startswith("https://") else "http://" if url.startswith("http://") else ""
    if protocol:
        path_part = url[len(protocol):].replace("//", "/")
        url = protocol + path_part
    else:
        url = "https://" + url.replace("//", "/")

    log.info(f"EXECUTOR: Final Constructed URL: {url}")

    import os
    is_local = "localhost" in url or "127.0.0.1" in url

    # SEC-13: Block SSRF and Insecure Credential transmission
    # Validate BEFORE the httpx call, but handle HTTPException gracefully
    try:
        validate_url_safe(url)
    except Exception as ssrf_exc:
        log.warning(f"SSRF check blocked URL: {url} — {ssrf_exc}")
        return {
            "error": "ssrf_blocked",
            "detail": f"The URL was blocked by the security validator: {ssrf_exc}"
        }, 422, 0

    if url.startswith("http://") and auth_secret and not (is_local or os.getenv("APP_ENV") == "development"):
        return {
            "error": "insecure_transport",
            "detail": "For security reasons, authentication secrets can only be sent over HTTPS. Please update the Agent's base_url to use https://."
        }, 403, 0

    if not url.startswith(("http://", "https://")):
        return {
            "error": "invalid_url",
            "detail": "The constructed URL is missing a protocol (http:// or https://). Please check the Agent's base_url setting."
        }, 400, 0

    # SEC-13: Warn when credentials are sent over unencrypted HTTP
    if url.startswith("http://") and auth_secret and not is_local:
        log.warning("API call with credentials sent over unencrypted HTTP: %s", url.split("?")[0])

    # Classify remaining params by their spec location
    loc_map: dict[str, str] = {p["name"]: p.get("in", "query") for p in endpoint_params if isinstance(p, dict) and "name" in p}
    query_params: dict[str, Any] = {}
    body_params:  dict[str, Any] = {}

    method_upper = method.upper()
    default_loc = "body" if method_upper in ("POST", "PUT", "PATCH") else "query"

    for name, value in leftover.items():
        location = loc_map.get(name, default_loc)
        if location in ("query",):
            query_params[name] = value
        else:
            body_params[name] = value

    # Support Multi-Key Auth Injection (e.g. Vonage api_key + api_secret)
    if auth_type in ("apikey", "query_key") and auth_secret:
        auth_data = {}
        if auth_secret.strip().startswith("{"):
            try:
                auth_data = json.loads(auth_secret)
            except Exception:
                auth_data = {auth_header or "api_key": auth_secret}
        else:
            auth_data = {auth_header or "api_key": auth_secret}

        for k, v in auth_data.items():
            if method_upper in ("GET", "DELETE") or auth_type == "query_key":
                query_params[k] = v
            else:
                body_params[k] = v

    headers = {
        "User-Agent":   "beaver/1.0",
        "Content-Type": "application/json",
        "Accept":       "application/json",
        **_build_auth_headers(auth_type, auth_secret, url, auth_header),
    }

    # Inject dynamic custom headers
    if custom_headers:
        headers.update(custom_headers)

    # Debug: Log final headers (masked)
    safe_headers = {k: (v if k.lower() != "authorization" else f"{v[:12]}...") for k, v in headers.items()}
    log.info(f"EXECUTOR: Request Headers: {json.dumps(safe_headers)}")
    log.info(f"EXECUTOR: Query Params: {json.dumps(query_params)}")
    log.info(f"EXECUTOR: Body Params: {json.dumps(body_params)}")

    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, follow_redirects=True) as client:
            method_upper = method.upper()
            if method_upper == "GET":
                r = await client.get(url, params=query_params, headers=headers)
            elif method_upper == "DELETE":
                r = await client.delete(url, params=query_params, headers=headers)
            elif method_upper in ("POST", "PUT", "PATCH"):
                # Unflatten body params to support nested JSON structures (e.g. conversation_config.model_id)
                final_body = _unflatten_params(body_params) if body_params else {}
                
                # Ensure we send an empty JSON body {} instead of None for methods that usually expect a body,
                # as some APIs (like GitHub starring) require Content-Length: 0 or an empty body.
                r = await client.request(
                    method_upper,
                    url,
                    params=query_params,
                    json=final_body,
                    headers=headers,
                )
            else:
                r = await client.get(url, params=query_params, headers=headers)

        latency_ms = int((time.monotonic() - start) * 1000)

        try:
            return r.json(), r.status_code, latency_ms
        except Exception:
            return r.text, r.status_code, latency_ms

    except httpx.TimeoutException:
        latency_ms = int((time.monotonic() - start) * 1000)
        log.warning("API call timed out: %s %s", method, url)
        return {"error": "upstream_timeout", "detail": f"No response from {url} within {TIMEOUT}s"}, 504, latency_ms

    except Exception as exc:
        latency_ms = int((time.monotonic() - start) * 1000)
        log.exception("API call failed: %s %s", method, url)
        return {"error": "executor_error", "detail": str(exc)}, 500, latency_ms
