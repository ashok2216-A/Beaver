
import logging
import json
import re
import httpx
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

async def smart_ingest_url(url: str) -> dict:
    """
    100% Programmatic Ingestion (No AI):
    Hunts for hidden OpenAPI/Swagger JSON or YAML files on the page or in common paths.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/yaml, */*",
    }
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
        # Step 1: Check if the URL itself is already a JSON/YAML file
        try:
            r = await client.get(url)
            if r.status_code == 200:
                if "application/json" in r.headers.get("Content-Type", "") or url.endswith(".json"):
                    return r.json()
                if "yaml" in r.headers.get("Content-Type", "") or url.endswith(".yaml") or url.endswith(".yml"):
                    import yaml
                    return yaml.safe_load(r.text)
                html_content = r.text
            else:
                raise Exception(f"URL returned status {r.status_code}")
        except Exception as e:
            raise Exception(f"Could not reach the URL: {e}")

        # Step 2: The Spec Hunter (Deterministic Path Searching)
        # Check common subpaths relative to the base URL
        base_url_match = re.match(r"(https?://[^/]+)", url)
        if base_url_match:
            origin = base_url_match.group(1)
            common_paths = [
                "/openapi.json", "/swagger.json", "/v1/openapi.json", 
                "/api/openapi.json", "/docs/openapi.json", "/swagger/v1/swagger.json",
                "/openapi.yaml", "/openapi.yml", "/swagger.yaml"
            ]
            for path in common_paths:
                try:
                    test_r = await client.get(f"{origin}{path}")
                    if test_r.status_code == 200:
                        content_lower = test_r.text.lower()
                        if '"openapi":' in content_lower or '"swagger":' in content_lower or "openapi:" in content_lower:
                            log.info(f"Spec Hunter found hidden spec at: {origin}{path}")
                            if path.endswith(".json"):
                                return test_r.json()
                            else:
                                import yaml
                                return yaml.safe_load(test_r.text)
                except:
                    continue

        # Step 3: Scan HTML for spec URLs (Redoc/SwaggerUI patterns)
        patterns = [
            r'url\s*:\s*["\']([^"\']+\.json)["\']',
            r'url\s*:\s*["\']([^"\']+\.yaml)["\']',
            r'spec-url\s*=\s*["\']([^"\']+)["\']',
            r'["\'](https?://[^"\']+/openapi\.json)["\']',
            r'["\'](https?://[^"\']+/swagger\.json)["\']'
        ]
        for pattern in patterns:
            match = re.search(pattern, html_content)
            if match:
                potential_url = match.group(1)
                if not potential_url.startswith("http"):
                    potential_url = str(httpx.URL(url).join(potential_url))
                
                try:
                    test_r = await client.get(potential_url)
                    if test_r.status_code == 200:
                        if potential_url.endswith(".json"):
                            return test_r.json()
                        else:
                            import yaml
                            return yaml.safe_load(test_r.text)
                except:
                    continue

    raise Exception("No automated API specification (JSON/YAML) found at this URL. Please upload the spec file manually.")
