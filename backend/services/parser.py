"""
services/parser.py — OpenAPI 3.x / Swagger 2.x spec parser.

Extracts:
  - path, method, summary, description
  - path + query parameters (name, in, required, schema)
  - simplified request body schema

Returns a list of dicts ready to be stored as Endpoint rows.
"""
from __future__ import annotations
from typing import Any
import json
import yaml


def _load_spec(raw: str | dict) -> dict:
    """Accept a dict, JSON string, or YAML string and return a dict."""
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return yaml.safe_load(raw)


def _extract_params(operation: dict) -> list[dict]:
    """Return a normalised list of parameter dicts."""
    params = []
    for p in operation.get("parameters", []):
        params.append({
            "name":     p.get("name", ""),
            "in":       p.get("in", ""),
            "required": bool(p.get("required", False)),
            "schema":   p.get("schema", {}),
            "description": p.get("description", ""),
        })
    return params


def _extract_body(operation: dict) -> dict:
    """Return a simplified request body schema dict."""
    body = operation.get("requestBody", {})
    if not body:
        return {}
    content = body.get("content", {})
    for media_type in ("application/json", "application/x-www-form-urlencoded"):
        if media_type in content:
            return content[media_type].get("schema", {})
    # Fallback: return the first available content schema
    for v in content.values():
        return v.get("schema", {})
    return {}


def parse_openapi(spec: str | dict) -> list[dict[str, Any]]:
    """
    Parse an OpenAPI / Swagger spec and return endpoint descriptors.

    Each descriptor:
    {
        "path": "/v1/customers",
        "method": "GET",
        "summary": "List customers",
        "description": "...",
        "parameters": [...],
        "request_body": {...},
    }
    """
    data = _load_spec(spec)
    endpoints: list[dict] = []

    # Swagger 2 compatibility
    swagger_base = data.get("basePath", "")
    paths = data.get("paths", {})

    SKIP_METHODS = {"head", "options", "trace"}

    for path, methods_obj in paths.items():
        if not isinstance(methods_obj, dict):
            continue

        # shared path-level parameters
        shared_params = methods_obj.get("parameters", [])

        for method, operation in methods_obj.items():
            if method.lower() in SKIP_METHODS or not isinstance(operation, dict):
                continue

            # Merge shared params, operation-level override by name
            op_params = operation.get("parameters", [])
            merged_params: dict[str, dict] = {p["name"]: p for p in shared_params if isinstance(p, dict) and "name" in p}
            for p in op_params:
                if isinstance(p, dict) and "name" in p:
                    merged_params[p["name"]] = p

            endpoints.append({
                "path":         path,
                "method":       method.upper(),
                "summary":      operation.get("summary", ""),
                "description":  operation.get("description", "") or operation.get("summary", ""),
                "parameters":   _extract_params({**operation, "parameters": list(merged_params.values())}),
                "request_body": _extract_body(operation),
            })

    return endpoints
