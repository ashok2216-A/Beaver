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
from typing import Any

import httpx

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
            path = path.replace(f"{{{name}}}", str(remaining.pop(name)))
    return path, remaining


def _build_auth_headers(auth_type: str, auth_secret: str) -> dict[str, str]:
    if not auth_secret:
        return {}
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {auth_secret}"}
    if auth_type == "apikey":
        return {"X-API-Key": auth_secret}
    return {}


def call_api(
    base_url: str,
    path: str,
    method: str,
    endpoint_params: list[dict],     # parameter defs from spec
    extracted_params: dict[str, Any],# values from LLM
    auth_type: str = "bearer",
    auth_secret: str = "",
) -> tuple[Any, int, int]:
    """
    Execute an API call and return (response_data, status_code, latency_ms).

    Parameters are routed automatically:
      - path params  → substituted into URL
      - query params → sent as URL query string
      - body params  → sent as JSON body
    """
    resolved_path, leftover = _substitute_path_params(path, extracted_params)
    url = base_url.rstrip("/") + resolved_path

    # Classify remaining params by their spec location
    loc_map: dict[str, str] = {p["name"]: p.get("in", "query") for p in endpoint_params}
    query_params: dict[str, Any] = {}
    body_params:  dict[str, Any] = {}

    for name, value in leftover.items():
        location = loc_map.get(name, "query")
        if location in ("query",):
            query_params[name] = value
        else:
            body_params[name] = value

    headers = {
        "Content-Type": "application/json",
        "Accept":       "application/json",
        **_build_auth_headers(auth_type, auth_secret),
    }

    start = time.monotonic()
    try:
        with httpx.Client(timeout=TIMEOUT, follow_redirects=True) as client:
            method_upper = method.upper()
            if method_upper == "GET":
                r = client.get(url, params=query_params, headers=headers)
            elif method_upper == "DELETE":
                r = client.delete(url, params=query_params, headers=headers)
            elif method_upper in ("POST", "PUT", "PATCH"):
                r = client.request(
                    method_upper,
                    url,
                    params=query_params,
                    json=body_params or None,
                    headers=headers,
                )
            else:
                r = client.get(url, params=query_params, headers=headers)

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
