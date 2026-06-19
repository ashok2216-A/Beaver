import json
import os
import re

def main():
    with open('apiverve_collection.json', 'r', encoding='utf-8') as f:
        collection = json.load(f)

    registry = []

    # Skip the first item which is usually "Getting Started"
    items = collection.get("item", [])
    for category in items:
        cat_name = category.get("name", "")
        if "Getting Started" in cat_name:
            continue
            
        apis = category.get("item", [])
        for api in apis:
            api_name = api.get("name", "")
            req = api.get("request", {})
            method = req.get("method", "GET").lower()
            
            url_obj = req.get("url", {})
            if isinstance(url_obj, str):
                continue
                
            path_parts = url_obj.get("path", [])
            path_str = "/" + "/".join(path_parts)
            
            # Extract description
            desc_md = req.get("description", "")
            short_desc = ""
            for line in desc_md.split("\n"):
                if "is a simple tool" in line or "returns" in line:
                    short_desc = line.strip()
                    break
            if not short_desc:
                short_desc = api_name
                
            # Build OpenAPI spec
            openapi = {
                "openapi": "3.1.0",
                "info": {
                    "title": api_name,
                    "version": "1.0.0",
                    "description": short_desc
                },
                "servers": [
                    {
                        "url": "https://api.apiverve.com"
                    }
                ],
                "paths": {
                    path_str: {
                        method: {
                            "summary": api_name,
                            "description": short_desc,
                            "operationId": api_name.replace(" ", "").lower(),
                            "parameters": [],
                            "responses": {
                                "200": {
                                    "description": "Successful response",
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "type": "object"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            # Add parameters
            queries = url_obj.get("query", [])
            for q in queries:
                openapi["paths"][path_str][method]["parameters"].append({
                    "name": q.get("key"),
                    "in": "query",
                    "description": q.get("description", ""),
                    "required": True,
                    "schema": {
                        "type": "string"
                    }
                })
                
            # Handle POST body if any
            body = req.get("body", {})
            if body and body.get("mode") == "raw":
                raw_body = body.get("raw", "{}")
                try:
                    body_json = json.loads(raw_body)
                    properties = {}
                    for k, v in body_json.items():
                        properties[k] = {"type": "string" if isinstance(v, str) else "number" if isinstance(v, (int, float)) else "boolean" if isinstance(v, bool) else "object"}
                    
                    openapi["paths"][path_str][method]["requestBody"] = {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": properties
                                }
                            }
                        }
                    }
                except:
                    pass

            template_id = "apiverve-" + api_name.lower().replace(" ", "-").replace("/", "")
            template_id = re.sub(r'[^a-z0-9-]', '', template_id)
            
            registry.append({
                "id": template_id,
                "name": api_name,
                "category": cat_name,
                "description": short_desc,
                "source_url": "https://apiverve.com",
                "auth_type": "custom",
                "auth_header": "x-api-key",
                "openapi_spec": openapi,
                "system_prompt": f"You are an expert {api_name} assistant. Use the provided tools to fulfill the user's request. Always format your responses beautifully using a2ui components like data_grid, preview, or markdown tables. AESTHETICS ARE CRITICAL."
            })

    os.makedirs('data', exist_ok=True)
    with open('data/apiverve_registry.json', 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2)

    print(f"Successfully processed {len(registry)} APIs!")

if __name__ == "__main__":
    main()
