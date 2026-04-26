import ipaddress
import socket
from urllib.parse import urlparse
from fastapi import HTTPException

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
            # If we can't resolve it, it might be a malformed hostname or 
            # something we shouldn't touch anyway.
            return False

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
