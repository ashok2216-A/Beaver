"""
services/mcp_registry.py — Model Context Protocol Registry.

Provides a centralized, dynamically extensible metadata registry for all OAuth integrations.
Eliminates hardcoded provider paths, keys, and environments in both execution and subprocess layers.
"""
from typing import Any, Dict, Optional

INTEGRATION_REGISTRY: Dict[str, Dict[str, Any]] = {
    "google": {
        "provider_name": "google",
        "composio_slug": "googledrive",
        "auth_type": "OAUTH",
        "aliases": [
            "gdrive",
            "google_drive",
            "googledrive",
            "gmail",
            "googlecalendar",
            "googlesheets",
            "googledocs",
            "google",
            "drive",
            "calendar",
            "sheet",
            "doc"
        ],
        "env_var_names": [
            "GOOGLE_DRIVE_TOKEN",
            "GOOGLE_DRIVE_ACCESS_TOKEN",
            "GOOGLE_ACCESS_TOKEN",
            "GDRIVE_ACCESS_TOKEN",
            "GMAIL_ACCESS_TOKEN",
            "GOOGLE_CALENDAR_ACCESS_TOKEN"
        ],
        "temp_json_file": {
            "filename_prefix": "google_cred_",
            "env_vars": [
                "GDRIVE_CREDENTIALS_PATH",
                "GOOGLE_APPLICATION_CREDENTIALS"
            ],
            "template": {
                "access_token": "{auth_token}",
                "refresh_token": "{auth_token}",
                "token_type": "Bearer",  # nosec B105
                "scope": "https://www.googleapis.com/auth/drive",
                "expiry_date": 9999999999999
            }
        }
    },
    "youtube": {
        "provider_name": "youtube",
        "composio_slug": "youtube",
        "auth_type": "OAUTH",
        "aliases": ["youtube"],
        "env_var_names": ["YOUTUBE_API_KEY", "YOUTUBE_ACCESS_TOKEN", "YOUTUBE_TOKEN"],
        "legacy_indicators": ["mcp-youtube"]
    },
    "github": {
        "provider_name": "github",
        "composio_slug": "github",
        "auth_type": "OAUTH",
        "aliases": ["github", "server-github"],
        "env_var_names": ["GITHUB_PERSONAL_ACCESS_TOKEN", "GITHUB_TOKEN"],
        "legacy_indicators": ["server-github"]
    },
    "slack": {
        "provider_name": "slack",
        "composio_slug": "slack",
        "auth_type": "OAUTH",
        "aliases": ["slack"],
        "env_var_names": ["SLACK_TOKEN", "SLACK_BOT_TOKEN"]
    },
    "instagram": {
        "provider_name": "instagram",
        "composio_slug": "instagram",
        "auth_type": "OAUTH",
        "aliases": ["instagram"],
        "env_var_names": ["INSTAGRAM_TOKEN", "INSTAGRAM_ACCESS_TOKEN"]
    },
    "notion": {
        "provider_name": "notion",
        "composio_slug": "notion",
        "auth_type": "OAUTH",
        "aliases": ["notion"],
        "env_var_names": ["NOTION_API_KEY", "NOTION_TOKEN"]
    },
    "airtable": {
        "provider_name": "airtable",
        "composio_slug": "airtable",
        "auth_type": "OAUTH",
        "aliases": ["airtable"],
        "env_var_names": []
    },
    "hubspot": {
        "provider_name": "hubspot",
        "composio_slug": "hubspot",
        "auth_type": "OAUTH",
        "aliases": ["hubspot"],
        "env_var_names": []
    },
    "salesforce": {
        "provider_name": "salesforce",
        "composio_slug": "salesforce",
        "auth_type": "OAUTH",
        "aliases": ["salesforce"],
        "env_var_names": []
    },
    "discord": {
        "provider_name": "discord",
        "composio_slug": "discord",
        "auth_type": "OAUTH",
        "aliases": ["discord"],
        "env_var_names": []
    },
    "perplexity": {
        "provider_name": "perplexity",
        "composio_slug": "perplexityai",
        "auth_type": "API_KEY",
        "aliases": ["perplexity", "perplexityai", "perplexity-ai"],
        "env_var_names": []
    },
    "openai": {
        "provider_name": "openai",
        "composio_slug": "openai",
        "auth_type": "API_KEY",
        "aliases": ["openai"],
        "env_var_names": []
    },
    "anthropic": {
        "provider_name": "anthropic",
        "composio_slug": "anthropic",
        "auth_type": "API_KEY",
        "aliases": ["anthropic"],
        "env_var_names": []
    },
    "serpapi": {
        "provider_name": "serpapi",
        "composio_slug": "serpapi",
        "auth_type": "API_KEY",
        "aliases": ["serpapi", "serp-api"],
        "env_var_names": []
    },
    "code_interpreter": {
        "provider_name": "code_interpreter",
        "composio_slug": "codeinterpreter",
        "auth_type": "NONE",
        "aliases": ["code-interpreter", "codeinterpreter"],
        "env_var_names": []
    },
    "calculator": {
        "provider_name": "calculator",
        "composio_slug": "calculator",
        "auth_type": "NONE",
        "aliases": ["calculator"],
        "env_var_names": []
    },
    "duckduckgo": {
        "provider_name": "duckduckgo",
        "composio_slug": "duckduckgo",
        "auth_type": "NONE",
        "aliases": ["duckduckgo"],
        "env_var_names": []
    }
}


def get_integration_by_alias(alias: str) -> Optional[Dict[str, Any]]:
    """
    Find integration registry item matching a given alias string.
    """
    alias_lower = alias.lower()
    for item in INTEGRATION_REGISTRY.values():
        for a in item["aliases"]:
            if a in alias_lower:
                return item
    return None
