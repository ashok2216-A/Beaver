import json
import os
import logging
from typing import Any, Dict, Optional

log = logging.getLogger(__name__)

# Cache for the dynamically generated integration registry
_DYNAMIC_REGISTRY = None

def get_integration_registry() -> Dict[str, Dict[str, Any]]:
    """
    Dynamically fetches toolkits from Composio and builds the integration registry.
    Returns the cached registry if already built.
    """
    global _DYNAMIC_REGISTRY
    if _DYNAMIC_REGISTRY is not None:
        return _DYNAMIC_REGISTRY
        
    registry = {}
    
    try:
        from config.config import get_settings
        import requests
        
        settings = get_settings()
        if not settings.composio_api_key:
            log.warning("No composio_api_key found. Cannot fetch dynamic toolkits.")
            return {}
            
        r = requests.get("https://backend.composio.dev/api/v3.1/toolkits", headers={"x-api-key": settings.composio_api_key}, timeout=15)
        if r.status_code == 200:
            toolkits = r.json().get("items", [])
        else:
            log.error(f"Failed to fetch toolkits from Composio API: {r.status_code} - {r.text}")
            toolkits = []
        
        for t in toolkits:
            slug = t.get("slug")
            if not slug:
                continue
            name = t.get("name", "")
            
            # Map auth scheme (prefer OAUTH over API_KEY if multiple exist)
            auth_type = "NONE"
            schemes = t.get("auth_schemes", [])
            if schemes:
                scheme_strs = [s.upper() for s in schemes]
                if any("OAUTH" in s for s in scheme_strs):
                    auth_type = "OAUTH"
                elif any("API" in s or "TOKEN" in s for s in scheme_strs):
                    auth_type = "API_KEY"
                    
            # Generate aliases
            aliases = [slug, slug.replace("-", ""), slug.replace("_", "")]
            if name:
                aliases.append(name.lower())
                name_clean = name.lower().replace(" ", "")
                if name_clean not in aliases:
                    aliases.append(name_clean)
                if "google" in name.lower() and name.lower() != "google":
                    # e.g. "Google Sheets" -> "google sheets"
                    aliases.append(name.lower())
                    
            # Remove duplicates
            aliases = list(set([a.lower() for a in aliases if a]))
            
            registry[slug] = {
                "provider_name": slug, # We use the slug as the provider_name for simplicity
                "composio_slug": slug,
                "auth_type": auth_type,
                "aliases": aliases,
                "env_var_names": [] # Composio manages env vars usually
            }
            
        # Add local custom apps just in case
        registry["code_interpreter"] = {
            "provider_name": "code_interpreter",
            "composio_slug": "codeinterpreter",
            "auth_type": "NONE",
            "aliases": ["code-interpreter", "codeinterpreter"],
            "env_var_names": []
        }
            
        _DYNAMIC_REGISTRY = registry
        return registry
        
    except Exception as e:
        log.error(f"Error building dynamic integration registry: {e}")
        return {}


def get_integration_by_alias(alias: str) -> Optional[Dict[str, Any]]:
    """
    Find integration registry item matching a given alias string.
    """
    alias_lower = alias.lower()
    
    # Strip common MCP server prefixes
    alias_lower = alias_lower.replace("composio:", "")
    alias_lower = alias_lower.replace("npx:@modelcontextprotocol/server-", "")
    alias_lower = alias_lower.replace("npx:@kirbah/mcp-", "")
    
    registry = get_integration_registry()
    
    # 1. Try exact match first
    for item in registry.values():
        if alias_lower in item["aliases"]:
            return item
            
    # 2. Fallback to strict matching without special characters
    alias_clean = alias_lower.replace("_", "").replace("-", "")
    for item in registry.values():
        for a in item["aliases"]:
            if a == alias_lower or a == alias_clean:
                return item
                
    # 3. Fallback to prefix/suffix matching (e.g., github_mcp -> github)
    for item in registry.values():
        for a in item["aliases"]:
            if alias_lower.startswith(f"{a}_") or alias_lower.endswith(f"_{a}"):
                return item
                
    return None
