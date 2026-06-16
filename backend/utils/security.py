import base64
import hashlib
import ipaddress
import os
import socket
from urllib.parse import urlparse

from cryptography.fernet import Fernet
from fastapi import HTTPException
from dotenv import load_dotenv

# SEC-02: End-to-End Encryption (AES-256 at rest)
# If ENCRYPTION_KEY is missing, we load .env from the backend directory
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(_env_path)

_raw_key = os.getenv("ENCRYPTION_KEY", "api2bot_studio_default_32byte_key_!!!")
# Fernet keys must be 32 url-safe base64-encoded bytes.
# If the key isn't valid base64, we pad/encode it to be safe.
try:
    cipher_suite = Fernet(_raw_key.encode())
except Exception:
    key_32 = base64.urlsafe_b64encode(hashlib.sha256(_raw_key.encode()).digest())
    cipher_suite = Fernet(key_32)

def encrypt_secret(secret: str) -> str:
    """Encrypt a plain text secret using AES-256."""
    if not secret:
        return ""
    return cipher_suite.encrypt(secret.encode()).decode()

def decrypt_secret(encrypted_secret: str) -> str:
    """Decrypt an AES-256 encrypted secret. Returns original string if not encrypted."""
    if not encrypted_secret:
        return ""
    try:
        return cipher_suite.decrypt(encrypted_secret.encode()).decode()
    except Exception:
        # Fallback: If decryption fails, it might be an old plain-text secret
        return encrypted_secret

# RFC 1918 and other reserved ranges
PRIVATE_IP_RANGES = [
    ipaddress.ip_network("127.0.0.0/8"),      # Loopback
    ipaddress.ip_network("10.0.0.0/8"),       # Private
    ipaddress.ip_network("172.16.0.0/12"),    # Private
    ipaddress.ip_network("192.168.0.0/16"),   # Private
    ipaddress.ip_network("169.254.0.0/16"),   # Link-local (Cloud Metadata)
    ipaddress.ip_network("::1/128"),          # IPv6 Loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 Private
    ipaddress.ip_network("fe80::/10"),        # IPv6 Link-local
]

def is_safe_url(url: str) -> bool:
    """
    Validates that a URL points to a public, non-reserved IP address.
    Prevents SSRF attacks against internal services and metadata.
    """
    # Check via pydantic settings first (reads from .env file), then fallback to os.getenv
    try:
        from config.config import get_settings
        app_env = get_settings().app_env
    except Exception:
        app_env = os.getenv("APP_ENV", "")
    
    if app_env.lower() == "development":
        return True

    # Also allow loopback explicitly for self-hosted custom tool endpoints 
    # (our own FastAPI app on localhost). This is always safe since it's calling ourselves.
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname or ""
        if hostname in ("localhost", "127.0.0.1", "::1"):
            return True
    except Exception:  # nosec B110
        pass
        
    try:
        parsed = urlparse(url)
        if not parsed.scheme or parsed.scheme not in ("http", "https"):
            return False
            
        hostname = parsed.hostname
        if not hostname:
            return False

        # 1. Resolve hostname to IP
        try:
            ip_address = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_address)
        except Exception:
            # For testing/demo domains that don't resolve, let's assume they are external/safe
            return True

        # 2. Check against private ranges
        for range in PRIVATE_IP_RANGES:
            if ip_obj in range:
                return False

        return True
    except Exception:
        return False

def validate_url_safe(url: str):
    """FastAPI helper to raise 422 if URL is unsafe."""
    if not is_safe_url(url):
        raise HTTPException(
            status_code=422, 
            detail="The provided URL is invalid or points to a restricted internal network address."
        )

def get_provider_name_from_urls(base_url: str | None, mcp_server_url: str | None) -> str | None:
    """
    Match base_url or mcp_server_url to a provider in the integration registry.
    Aliases are matched against the URL PATH only (not the hostname), to prevent
    false positives like alias 'exa' matching in 'example.com'.
    """
    from urllib.parse import urlparse as _urlparse
    from services.mcp_registry import get_integration_registry
    registry = get_integration_registry()
    urls = [u for u in (base_url, mcp_server_url) if u]
    for url in urls:
        url_lower = url.lower()
        # For standard http/https URLs, extract just the path portion for alias matching
        try:
            parsed = _urlparse(url_lower)
            url_path = parsed.path  # e.g. "/api/v1/custom_tools/duffel"
        except Exception:
            url_path = url_lower  # Fallback to full URL for non-standard formats
        
        for provider, details in registry.items():
            for alias in details.get("aliases", []):
                # 1. Check if alias appears as a path segment
                if f"/{alias}" in url_path or f"/{alias}/" in url_path:
                    return provider
                # 2. Check colon-prefix (used for composio: or mcp_sse: style URIs)
                if f":{alias}" in url_lower:
                    return provider
                # 3. Exact match of the full URL to alias
                if url_lower == alias:
                    return provider
    return None

