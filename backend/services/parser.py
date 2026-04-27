"""
services/parser.py — OpenAPI Spec Parser.
Extracts endpoints, parameters, and request bodies for the Agentic Studio.
"""
import logging
from typing import Any, Dict, List

log = logging.getLogger(__name__)

def parse_openapi(spec: Any) -> List[Dict[str, Any]]:
    """
    Parse an OpenAPI 3.x or Swagger 2.0 spec and return a flat list of endpoints.
    Each endpoint dict contains: path, method, summary, description, parameters, request_body.
    """
    if not isinstance(spec, dict):
        log.warning("OpenAPI spec is not a dictionary.")
        return []

    endpoints = []
    paths = spec.get("paths", {})

    for path, methods in paths.items():
        for method, details in methods.items():
            if method.lower() not in ["get", "post", "put", "patch", "delete", "options", "head"]:
                continue

            # Extract parameters (both path-level and method-level)
            parameters = methods.get("parameters", []).copy()
            parameters.extend(details.get("parameters", []))

            # Extract request body (OpenAPI 3.x)
            request_body = {}
            if "requestBody" in details:
                # Basic extraction of the first content type found
                content = details["requestBody"].get("content", {})
                for content_type, media_type in content.items():
                    request_body = media_type.get("schema", {})
                    break

            endpoints.append({
                "path": path,
                "method": method.upper(),
                "summary": details.get("summary", ""),
                "description": details.get("description", ""),
                "parameters": parameters,
                "request_body": request_body,
            })

    return endpoints
