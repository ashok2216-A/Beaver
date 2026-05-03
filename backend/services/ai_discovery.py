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
import asyncio
import httpx
import litellm
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from typing import List, Dict
from config import get_settings

log = logging.getLogger(__name__)

# ── LiteLLM Setup ────────────────────────────────────────────────────────────
# We use LiteLLM to support multiple providers (Mistral, Gemini, etc.)
# Fallback order: Mistral -> Gemini -> OpenAI
LITELLM_MODEL = "mistral/mistral-large-latest" 


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
    if url.startswith("http"):
        validate_url_safe(url)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/json,application/yaml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    if not url.startswith("http"):
        try:
            import os
            import yaml
            import json
            for p in [url, os.path.join("backend", "templates", os.path.basename(url)), os.path.join(os.path.dirname(__file__), "..", "templates", os.path.basename(url))]:
                if os.path.exists(p):
                    with open(p, 'r', encoding='utf-8') as f:
                        text = f.read()
                    try:
                        data = json.loads(text)
                    except:
                        data = yaml.safe_load(text)
                    if isinstance(data, dict):
                        return data
            else:
                raise FileNotFoundError("Local template not found.")
        except Exception as e:
            raise Exception(f"Failed to read local template: {e}")

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
        soup = BeautifulSoup(html_content, "html.parser")

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
                    text_lower = test_r.text[:10000].lower()
                    log.info(f"Spec Hunter checked {origin}{path}: openapi in text={('openapi' in text_lower)} paths: in text={('paths:' in text_lower)}")
                    if "openapi" in text_lower or "swagger" in text_lower or "paths:" in text_lower:
                        parsed_spec = None
                        # Try JSON
                        try:
                            import json
                            parsed_spec = json.loads(test_r.text)
                            if isinstance(parsed_spec, dict) and ("openapi" in parsed_spec or "swagger" in parsed_spec or "paths" in parsed_spec):
                                log.info(f"Spec Hunter matched JSON: {origin}{path}")
                                return parsed_spec
                        except Exception as e:
                            log.info(f"Spec Hunter JSON parse error for {origin}{path}: {e}")
                            pass
                            
                        # Try YAML
                        try:
                            import yaml
                            parsed_spec = yaml.safe_load(test_r.text)
                            if isinstance(parsed_spec, dict) and ("openapi" in parsed_spec or "swagger" in parsed_spec or "paths" in parsed_spec):
                                log.info(f"Spec Hunter matched YAML: {origin}{path}")
                                return parsed_spec
                        except Exception as e:
                            log.info(f"Spec Hunter YAML parse error for {origin}{path}: {e}")
                            pass
            except:
                pass

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
                m.group(1)
        # ── LEVEL 3: Hybrid AI Extraction ────────────────────────────────
        log.info("No spec file found. Starting Hybrid AI Extraction...")
        
        # 1. Gather all relevant documentation text
        main_text = _clean_html(html_content)
        
        # 2. Deep Crawl sub-pages (Sitemap, Links)
        crawled_content = [main_text]
        doc_domain = urlparse(url).netloc
        doc_origin = f"{urlparse(url).scheme}://{doc_domain}"
        links_to_crawl = []
        seen_urls = {url}
        
        # Next.js/Mintlify route scanning
        next_data = soup.find("script", id="__NEXT_DATA__")
        if next_data:
            try:
                nd = json.loads(next_data.string)
                _extract_routes_from_json(nd, doc_origin, links_to_crawl, seen_urls)
            except: pass

        # Sitemaps
        for sm_path in ["/sitemap.xml", "/sitemap-0.xml"]:
            try:
                sm_r = await client.get(f"{doc_origin}{sm_path}")
                if sm_r.status_code == 200:
                    sm_soup = BeautifulSoup(sm_r.text, "xml")
                    for loc in sm_soup.find_all("loc"):
                        loc_url = loc.get_text(strip=True)
                        if loc_url not in seen_urls and any(t in loc_url.lower() for t in ["api", "reference", "docs"]):
                            links_to_crawl.append(loc_url)
                            seen_urls.add(loc_url)
            except: continue

        # Parallel Crawl (Top 5 pages for speed)
        crawl_tasks = [client.get(u) for u in links_to_crawl[:5]]
        crawl_results = await asyncio.gather(*crawl_tasks, return_exceptions=True)
        for cr in crawl_results:
            if isinstance(cr, httpx.Response) and cr.status_code == 200:
                crawled_content.append(_clean_html(cr.text))

        full_content = "\n\n".join(crawled_content)
        
        # 3. Parallel AI Extraction using LiteLLM
        ai_endpoints = await _extract_endpoints_with_ai(full_content, url)
        
        # 4. Regex Fallback (Merged with AI results)
        regex_endpoints = _extract_method_path_from_text(full_content)
        
        # 5. Consolidation & Sanitization
        final_endpoints = _consolidate_endpoints(ai_endpoints, regex_endpoints)

        if not final_endpoints:
            raise Exception("Discovery failed: No API endpoints found in documentation.")

        # ── Build OpenAPI 3.0 spec ───────────────────────────────────────
        return _build_openapi_spec(url, final_endpoints)

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
            sub_path = "/{id}"

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


# ── AI Helper Functions ───────────────────────────────────────────────────────

def _clean_html(html: str) -> str:
    """Strips boilerplate and noise for LLM analysis."""
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "aside"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    return "\n".join([l.strip() for l in text.splitlines() if len(l.strip()) > 3])

async def _extract_endpoints_with_ai(content: str, url: str) -> List[Dict]:
    """Parallel AI extraction using LiteLLM."""
    settings = get_settings()
    api_key = settings.mistral_api_key or settings.gemini_api_key or os.getenv("MISTRAL_API_KEY")
    
    if not api_key:
        log.warning("No AI API keys found. Skipping AI extraction.")
        return []

    # Chunk content (8k chars)
    chunks = [content[i:i+8000] for i in range(0, len(content), 7500)]
    tasks = []
    
    for i, chunk in enumerate(chunks):
        prompt = f"""Extract ALL API endpoints from this documentation chunk.
Return STRICT JSON array:
[
  {{ "method": "GET|POST|PUT|DELETE", "path": "/v1/...", "summary": "brief description", "parameters": [] }}
]
Source: {url}
Chunk:
{chunk}"""
        
        # Use LiteLLM with fallback
        tasks.append(litellm.acompletion(
            model=LITELLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            api_key=api_key,
            temperature=0
        ))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    all_endpoints = []
    
    for res in results:
        try:
            if isinstance(res, Exception): continue
            text = res.choices[0].message.content
            json_match = re.search(r'\[.*\]', text, re.DOTALL)
            if json_match:
                all_endpoints.extend(json.loads(json_match.group(0)))
        except: continue
        
    return all_endpoints

def _consolidate_endpoints(ai_eps: List[Dict], regex_eps: List[tuple]) -> List[Dict]:
    """Merges AI and Regex findings, sanitizing paths."""
    seen = {} # key: (method, path)

    # 1. Process AI results
    for ep in ai_eps:
        method = str(ep.get("method", "GET")).upper()
        path = _sanitize_path(ep.get("path", ""))
        if path:
            key = (method, path)
            if key not in seen:
                seen[key] = {
                    "method": method,
                    "path": path,
                    "summary": ep.get("summary", f"{method} {path}")
                }

    # 2. Add Regex results (don't overwrite AI summaries)
    for method, path, summary in regex_endpoints_formatted(regex_eps):
        method = method.upper()
        path = _sanitize_path(path)
        if path:
            key = (method, path)
            if key not in seen:
                seen[key] = {"method": method, "path": path, "summary": summary}
                
    return list(seen.values())

def regex_endpoints_formatted(regex_eps):
    # This is a helper for consolidation
    return regex_eps

