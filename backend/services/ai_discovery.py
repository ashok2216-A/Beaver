"""
services/ai_discovery.py — Pure Programmatic API Discovery (Zero AI).

Uses 5 universal patterns found across ALL API documentation platforms:
1. Hidden spec files (openapi.json, swagger.json)
2. HTTP Method + Path patterns in text (GET /v1/users)
3. Sidebar link slug parsing (/reference/post-page → POST /pages)
4. Curl command extraction from code blocks
5. Method badge + path detection in HTML structure
"""

import logging
import json
import re
import os
import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse

log = logging.getLogger(__name__)

# ── Universal HTTP method detection ──────────────────────────────────────────
HTTP_METHODS = {"GET", "POST", "PUT", "PATCH", "DELETE", "DEL", "HEAD", "OPTIONS"}

# Method slugs used in sidebar URLs (e.g. /reference/post-page)
METHOD_SLUG_MAP = {
    "get": "GET", "post": "POST", "put": "PUT",
    "patch": "PATCH", "delete": "DELETE", "del": "DELETE",
    "create": "POST", "retrieve": "GET", "update": "PATCH",
    "list": "GET", "search": "POST", "query": "POST",
    "remove": "DELETE", "append": "PATCH", "introspect": "POST",
    "revoke": "POST", "refresh": "POST",
}


async def smart_ingest_url(url: str) -> dict:
    """
    100% Programmatic API Discovery — No AI.
    Scrapes any documentation URL and extracts endpoints using universal patterns.
    Returns a valid OpenAPI 3.0.0 spec dict.
    """
    from utils.security import validate_url_safe
    validate_url_safe(url)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/json,application/yaml,*/*",
    }

    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:

        # ── LEVEL 1: Direct file check ───────────────────────────────────
        try:
            r = await client.get(url)
            r.raise_for_status()
        except Exception as e:
            raise Exception(f"Could not reach the URL: {e}")

        ct = r.headers.get("Content-Type", "")
        # If the URL itself is already a spec file
        if "application/json" in ct or url.endswith(".json"):
            try:
                data = r.json()
                if "openapi" in data or "swagger" in data or "paths" in data:
                    log.info("URL is already a spec file.")
                    return data
            except:
                pass
        if "yaml" in ct or url.endswith((".yaml", ".yml")):
            try:
                import yaml
                data = yaml.safe_load(r.text)
                if "openapi" in data or "swagger" in data or "paths" in data:
                    return data
            except:
                pass

        html_content = r.text

        # ── LEVEL 2: Hunt for hidden spec files ──────────────────────────
        origin = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
        common_paths = [
            "/openapi.json", "/swagger.json", "/v1/openapi.json",
            "/api/openapi.json", "/docs/openapi.json",
            "/swagger/v1/swagger.json", "/api-docs",
            "/openapi.yaml", "/openapi.yml", "/swagger.yaml",
        ]
        for path in common_paths:
            try:
                test_r = await client.get(f"{origin}{path}")
                if test_r.status_code == 200:
                    text_lower = test_r.text[:500].lower()
                    if '"openapi"' in text_lower or '"swagger"' in text_lower or "openapi:" in text_lower:
                        log.info(f"Spec Hunter found: {origin}{path}")
                        if path.endswith(".json") or "json" in test_r.headers.get("Content-Type", ""):
                            return test_r.json()
                        else:
                            import yaml
                            return yaml.safe_load(test_r.text)
            except:
                continue

        # Check for spec URLs embedded in the HTML (SwaggerUI/Redoc)
        embedded_patterns = [
            r'url\s*:\s*["\']([^"\']+(?:openapi|swagger)[^"\']*\.(?:json|yaml))["\']',
            r'spec-url\s*=\s*["\']([^"\']+)["\']',
            r'["\'](\S+/openapi\.json)["\']',
            r'["\'](\S+/swagger\.json)["\']',
        ]
        for pat in embedded_patterns:
            m = re.search(pat, html_content)
            if m:
                spec_url = m.group(1)
                if not spec_url.startswith("http"):
                    spec_url = str(httpx.URL(url).join(spec_url))
                try:
                    sr = await client.get(spec_url)
                    if sr.status_code == 200:
                        return sr.json()
                except:
                    continue

        # ── LEVEL 3: Pattern-Based Endpoint Extraction ───────────────────
        log.info("No spec file found. Falling back to pattern-based extraction...")
        soup = BeautifulSoup(html_content, "html.parser")
        endpoints = {}  # key: "METHOD /path" → prevents duplicates

        # --- Pattern A: Scan ALL text on the page for METHOD /path ---
        page_text = soup.get_text(" ", strip=True)
        found = _extract_method_path_from_text(page_text)
        for method, path, summary in found:
            key = f"{method} {path}"
            if key not in endpoints:
                endpoints[key] = {"method": method, "path": path, "summary": summary}

        # --- Pattern E: Mintlify/ReadMe sidebar links ---
        # These show as [POSTScrape](url) or [GETGet Status](url) — method concatenated
        sidebar_endpoints = {}  # url → {method, name}
        for a_tag in soup.find_all("a", href=True):
            link_text = a_tag.get_text(strip=True)
            # Check if text starts with a method name (concatenated, no space)
            for method_name in ["POST", "GET", "PUT", "PATCH", "DELETE", "DEL"]:
                if link_text.startswith(method_name) and len(link_text) > len(method_name):
                    endpoint_name = link_text[len(method_name):]
                    method = "DELETE" if method_name == "DEL" else method_name
                    href = a_tag["href"]
                    full_url = str(httpx.URL(url).join(href))
                    if full_url not in sidebar_endpoints:
                        sidebar_endpoints[full_url] = {
                            "method": method, 
                            "name": endpoint_name,
                        }
                    break
        
        log.info(f"Found {len(sidebar_endpoints)} endpoints in sidebar links")
        
        # Crawl each sidebar endpoint page to find the actual API path
        for ep_url, ep_info in sidebar_endpoints.items():
            try:
                pr = await client.get(ep_url)
                if pr.status_code != 200:
                    continue
                ep_text = pr.text
                ep_path = None
                
                # Strategy 1: Find ALL API URLs in the page (simple and universal)
                all_urls = re.findall(
                    r'https?://[a-zA-Z0-9._-]+(/v\d+/[\w/{}._-]+)',
                    ep_text
                )
                for api_path in all_urls:
                    path = _sanitize_path(api_path)
                    if path:
                        ep_path = path
                        break
                
                # Strategy 1b: Broader fallback — any URL with /api/ or 2+ path segments
                if not ep_path:
                    all_urls2 = re.findall(
                        r'https?://api\.[a-zA-Z0-9._-]+(/[\w/{}._-]+)',
                        ep_text
                    )
                    for api_path in all_urls2:
                        path = _sanitize_path(api_path)
                        if path:
                            ep_path = path
                            break

                # Strategy 2: Look for METHOD /path in code blocks
                if not ep_path:
                    ep_soup = BeautifulSoup(ep_text, "html.parser")
                    for code in ep_soup.find_all(["code", "pre"]):
                        code_text = code.get_text()
                        m = re.search(r'\b(GET|POST|PUT|PATCH|DELETE)\s+(/[\w/{}._-]+)', code_text)
                        if m:
                            path = _sanitize_path(m.group(2))
                            if path:
                                ep_path = path
                                break
                
                if ep_path:
                    key = f"{ep_info['method']} {ep_path}"
                    if key not in endpoints:
                        endpoints[key] = {
                            "method": ep_info["method"],
                            "path": ep_path,
                            "summary": ep_info["name"],
                        }
                        log.info(f"  → {key}: {ep_info['name']}")
            except:
                continue

        # --- Pattern B: Method badges anywhere in the HTML ---
        # Many docs show colored badges like [POST] [GET] [DEL] next to endpoint names.
        # We look for ANY element whose text is exactly a method name.
        all_elements = soup.find_all(True)  # All HTML elements
        for el in all_elements:
            el_text = el.get_text(strip=True).upper()
            if el_text in HTTP_METHODS or el_text == "DEL":
                method = "DELETE" if el_text == "DEL" else el_text
                # The endpoint name/path is usually in the next sibling or parent's text
                parent = el.parent
                if parent:
                    sibling_text = parent.get_text(" ", strip=True)
                    # Try to find a path in the sibling text
                    path_match = re.search(r'(/[\w/{}._:-]+)', sibling_text)
                    if path_match:
                        path = path_match.group(1)
                        if path.count("/") >= 2 and not path.endswith((".js", ".css", ".png")):
                            key = f"{method} {path}"
                            if key not in endpoints:
                                # Extract summary from the parent text (remove the path)
                                summary_text = sibling_text.replace(path, "").replace(el_text, "").strip()
                                endpoints[key] = {
                                    "method": method,
                                    "path": path,
                                    "summary": summary_text[:80] if summary_text else f"{method} {path}",
                                }

        # --- Pattern C: Curl commands in code blocks ---
        for code in soup.find_all(["code", "pre"]):
            code_text = code.get_text()
            curl_matches = re.findall(
                r'curl\s+(?:-X\s+)?(\w+)?\s+["\']?(https?://[^\s"\']+)',
                code_text, re.IGNORECASE
            )
            for method, curl_url in curl_matches:
                parsed = urlparse(curl_url)
                path = _sanitize_path(parsed.path)
                if path:
                    method = (method or "GET").upper()
                    if method in HTTP_METHODS:
                        key = f"{method} {path}"
                        if key not in endpoints:
                            endpoints[key] = {
                                "method": method,
                                "path": path,
                                "summary": f"From curl example",
                            }

        # --- Pattern D: Discover ALL pages via sitemap + link scanning ---
        doc_domain = urlparse(url).netloc
        doc_origin = f"{urlparse(url).scheme}://{doc_domain}"
        links_to_crawl = []
        seen_urls = {url}

        # Determine the "section prefix" from the user's URL
        # e.g. https://docs.firecrawl.dev/api-reference/endpoint/scrape
        #   → section_prefix = "/api-reference"
        url_parts = urlparse(url).path.strip("/").split("/")
        section_prefix = f"/{url_parts[0]}" if url_parts and url_parts[0] else ""
        log.info(f"Filtering pages to section: {section_prefix}")

        # D1: Try sitemap.xml first (most reliable for finding ALL pages)
        sitemap_urls = [
            f"{doc_origin}/sitemap.xml",
            f"{doc_origin}/sitemap-0.xml",
            f"{doc_origin}/sitemap_index.xml",
        ]
        for sitemap_url in sitemap_urls:
            try:
                sm = await client.get(sitemap_url)
                if sm.status_code == 200 and "<url>" in sm.text.lower():
                    sitemap_soup = BeautifulSoup(sm.text, "xml")
                    for loc in sitemap_soup.find_all("loc"):
                        page_url = loc.get_text(strip=True)
                        page_path = urlparse(page_url).path
                        # Only include pages from the same section
                        if (page_url not in seen_urls and 
                            doc_domain in page_url and
                            section_prefix and page_path.startswith(section_prefix)):
                            links_to_crawl.append(page_url)
                            seen_urls.add(page_url)
                    if links_to_crawl:
                        log.info(f"Sitemap found {len(links_to_crawl)} API reference pages!")
                        break
            except:
                continue

        # D2: Also check for __NEXT_DATA__ (Next.js/Mintlify docs)
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data:
            try:
                nd = json.loads(next_data.string)
                _extract_routes_from_json(nd, doc_origin, links_to_crawl, seen_urls, section_prefix)
            except:
                pass

        # D3: Fallback to scanning all links on the page (filtered by section)
        if len(links_to_crawl) < 5:
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                full = str(httpx.URL(url).join(href))
                parsed_href = urlparse(full)
                if (parsed_href.netloc == doc_domain and 
                    full not in seen_urls and
                    (not section_prefix or parsed_href.path.startswith(section_prefix)) and
                    not parsed_href.path.endswith((".png", ".jpg", ".svg", ".css", ".js")) and
                    len(links_to_crawl) < 60):
                    links_to_crawl.append(full)
                    seen_urls.add(full)

        log.info(f"Deep crawling {len(links_to_crawl)} pages...")
        for page_url in links_to_crawl:
            try:
                pr = await client.get(page_url)
                if pr.status_code != 200:
                    continue
                page_soup = BeautifulSoup(pr.text, "html.parser")
                page_text = page_soup.get_text(" ", strip=True)

                # Extract METHOD + PATH from each page
                found = _extract_method_path_from_text(page_text)
                for method, path, summary in found:
                    key = f"{method} {path}"
                    if key not in endpoints:
                        endpoints[key] = {
                            "method": method,
                            "path": path,
                            "summary": summary,
                        }

                # Also check for curl commands on sub-pages
                for code in page_soup.find_all(["code", "pre"]):
                    code_text = code.get_text()
                    curl_matches = re.findall(
                        r'curl\s+(?:-X\s+)?(\w+)?\s+["\']?(https?://[^\s"\']+)',
                        code_text, re.IGNORECASE
                    )
                    for method, curl_url in curl_matches:
                        parsed_curl = urlparse(curl_url)
                        path = _sanitize_path(parsed_curl.path)
                        if path:
                            method = (method or "GET").upper()
                            if method in HTTP_METHODS:
                                key = f"{method} {path}"
                                if key not in endpoints:
                                    endpoints[key] = {
                                        "method": method,
                                        "path": path,
                                        "summary": "From curl example",
                                    }
            except:
                continue

        if not endpoints:
            raise Exception(
                "No API endpoints found at this URL. "
                "Please upload a spec file or use Manual Setup."
            )

        # ── Build OpenAPI 3.0 spec from extracted endpoints ──────────────
        return _build_openapi_spec(url, endpoints)


def _extract_method_path_from_text(text: str) -> list[tuple[str, str, str]]:
    """
    Universal Pattern: Find 'METHOD /path' anywhere in text.
    """
    results = []
    pattern = re.compile(
        r'\b(GET|POST|PUT|PATCH|DELETE)\s+(/(?!/)[\w/{}._-]+)',
        re.IGNORECASE
    )
    for m in pattern.finditer(text):
        method = m.group(1).upper()
        path = _sanitize_path(m.group(2))
        if path:
            summary = f"{method} {path}"
            results.append((method, path, summary))
    return results


def _extract_routes_from_json(obj, origin: str, links: list, seen: set, section_prefix: str = ""):
    """Recursively walk a JSON tree to find page routes (e.g. from __NEXT_DATA__)."""
    if isinstance(obj, dict):
        for key, val in obj.items():
            if key in ("href", "path", "slug", "url", "route") and isinstance(val, str):
                if val.startswith("/") and (not section_prefix or val.startswith(section_prefix)):
                    full = f"{origin}{val}"
                    if full not in seen:
                        links.append(full)
                        seen.add(full)
            else:
                _extract_routes_from_json(val, origin, links, seen, section_prefix)
    elif isinstance(obj, list):
        for item in obj:
            _extract_routes_from_json(item, origin, links, seen, section_prefix)

def _sanitize_path(path: str) -> str | None:
    """
    Clean and normalize an API path:
    - Replace UUIDs and hex strings with {id}
    - Filter out junk paths (static files, too short, etc.)
    - Remove duplicate slashes
    """
    if not path or len(path) < 3:
        return None

    # Skip static files
    if path.endswith((".js", ".css", ".png", ".html", ".svg", ".ico")):
        return None

    # Reject paths that contain domain names (dots in early segments)
    first_segment = path.split("/")[1] if len(path.split("/")) > 1 else ""
    if "." in first_segment and not first_segment.startswith("{"):
        return None

    # Must have at least 2 segments (like /v1/something)
    if path.count("/") < 2:
        return None
    
    # Replace UUIDs (550e8400-e29b-41d4-...) with {id}
    path = re.sub(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '{id}', path, flags=re.IGNORECASE)
    
    # Replace long hex strings (12+ chars) with {id}
    path = re.sub(r'/[0-9a-f]{12,}', '/{id}', path, flags=re.IGNORECASE)
    
    # Replace pure numeric segments with {id}
    path = re.sub(r'/\d{3,}/', '/{id}/', path)
    path = re.sub(r'/\d{3,}$', '/{id}', path)
    
    # Clean up double slashes
    path = re.sub(r'/+', '/', path)
    
    # Remove trailing slashes
    path = path.rstrip('/')
    if not path.startswith('/'):
        path = '/' + path
    
    return path


def _slug_to_path(slug: str) -> str | None:
    """
    Convert a ReadMe-style URL slug to an API path.
    Examples:
        'post-page' → '/v1/pages'
        'retrieve-a-block' → '/v1/blocks/{id}'
        'get-block-children' → '/v1/blocks/{id}/children'
        'post-database-query' → '/v1/databases/{id}/query'
    """
    # Remove method prefix
    parts = slug.split("-")
    if not parts:
        return None

    # Check if first word is a method indicator
    first = parts[0].lower()
    if first not in METHOD_SLUG_MAP:
        return None

    # Rest is the resource name
    rest = parts[1:]
    # Remove filler words
    rest = [p for p in rest if p not in ("a", "an", "the", "all")]

    if not rest:
        return None

    # Build path: first noun is the resource, rest are sub-resources
    resource = rest[0] + "s" if not rest[0].endswith("s") else rest[0]
    sub_path = ""
    if len(rest) > 1:
        sub_resource = "-".join(rest[1:])
        # Common sub-resources
        if sub_resource in ("children", "query", "properties", "property", "item"):
            sub_path = f"/{{id}}/{sub_resource}"
        else:
            sub_path = f"/{{id}}"

    # For retrieve/update/delete, add {id}
    if first in ("retrieve", "get", "update", "patch", "delete", "del", "remove") and not sub_path:
        sub_path = "/{id}"

    return f"/v1/{resource}{sub_path}"


def _extract_brand_name(host: str) -> str:
    """Extract a clean brand name from a host string using manifest.json as a lookup."""
    brand_lower = host.lower()
    
    # Try to find a match in the manifest.json
    try:
        manifest_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "templates", "manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, "r") as f:
                manifest = json.load(f)
                for t in manifest.get("templates", []):
                    domain = t.get("domain", "").lower()
                    if domain and (domain in brand_lower or brand_lower in domain):
                        return f"{t['name']} Agent"
    except Exception as e:
        log.warning(f"Manifest lookup failed for branding: {e}")

    # Fallback: Manual extraction
    brand = brand_lower
    for prefix in ["docs.", "api.", "developers.", "developer.", "www."]:
        if brand.startswith(prefix):
            brand = brand[len(prefix):]
    
    brand = brand.split(".")[0]
    return f"{brand.capitalize()} Agent"


def _build_openapi_spec(source_url: str, endpoints: dict) -> dict:
    """Build a valid OpenAPI 3.0.0 spec from extracted endpoints."""
    parsed = urlparse(source_url)
    
    # Smart Host Translation: docs.example.com -> api.example.com
    host = parsed.netloc
    brand_name = _extract_brand_name(host)

    if host.startswith("docs."):
        host = host.replace("docs.", "api.", 1)
    elif host.startswith("developers."):
        host = host.replace("developers.", "api.", 1)
    elif host.startswith("developer."):
        host = host.replace("developer.", "api.", 1)
    
    # Fallback/Specific overrides
    if "firecrawl.dev" in host and not host.startswith("api."):
        host = "api.firecrawl.dev"
    if "notion.com" in host and not host.startswith("api."):
        host = "api.notion.com"

    paths = {}
    for key, ep in endpoints.items():
        path = ep["path"]
        method = ep["method"].lower()
        if path not in paths:
            paths[path] = {}

        operation = {
            "summary": ep.get("summary", ""),
            "responses": {
                "200": {"description": "Successful response"}
            },
        }

        # Add requestBody placeholder for write methods
        if method in ("post", "put", "patch"):
            operation["requestBody"] = {
                "required": True,
                "content": {
                    "application/json": {
                        "schema": {"type": "object"}
                    }
                }
            }

        # Add path parameters
        param_matches = re.findall(r'\{(\w+)\}', path)
        if param_matches:
            operation["parameters"] = [
                {
                    "name": p,
                    "in": "path",
                    "required": True,
                    "schema": {"type": "string"}
                }
                for p in param_matches
            ]

        paths[path][method] = operation

    return {
        "openapi": "3.0.0",
        "info": {
            "title": brand_name,
            "version": "1.0.0",
            "description": f"Auto-discovered from {source_url}",
        },
        "servers": [{"url": f"https://{host}"}],
        "paths": paths,
    }
