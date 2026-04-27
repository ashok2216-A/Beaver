"""
services/ai_discovery.py — Automated API Discovery.
Fetches and identifies OpenAPI specs from URLs.
"""
import httpx
import yaml
import logging
from typing import Any, Dict
from utils.security import validate_url_safe

log = logging.getLogger(__name__)

async def smart_ingest_url(url: str) -> Dict[str, Any]:
    """
    Fetch a URL and attempt to parse it as an OpenAPI spec (JSON or YAML).
    Includes SSRF protection to prevent internal network scanning.
    """
    validate_url_safe(url)
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            content_type = response.headers.get("Content-Type", "").lower()
            
            if "json" in content_type or response.text.strip().startswith("{"):
                return response.json()
            else:
                return yaml.safe_load(response.text)
                
    except Exception as e:
        log.error(f"Discovery failed for {url}: {e}")
        raise Exception(f"Could not discover or parse API spec at {url}: {e}")
