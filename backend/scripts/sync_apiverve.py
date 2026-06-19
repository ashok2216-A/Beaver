import json
import os
import re

def main():
    registry_path = 'data/apiverve_registry.json'
    
    if not os.path.exists(registry_path):
        print(f"Error: {registry_path} not found.")
        return
        
    with open(registry_path, 'r', encoding='utf-8') as f:
        existing_registry = json.load(f)

    # Group by category
    categories = {}
    for entry in existing_registry:
        cat = entry.get("category", "Uncategorized")
        # Remove the count from the category name if it exists (e.g. "AI/Computer Vision (6)" -> "AI/Computer Vision")
        clean_cat = re.sub(r'\s*\(\d+\)$', '', cat)
        
        if clean_cat not in categories:
            categories[clean_cat] = []
        categories[clean_cat].append(entry)

    consolidated_registry = []

    for cat_name, entries in categories.items():
        cat_id = "apiverve-" + cat_name.lower().replace(" ", "-").replace("/", "-")
        cat_id = re.sub(r'[^a-z0-9-]', '', cat_id)
        
        openapi = {
            "openapi": "3.1.0",
            "info": {
                "title": f"APIVerve - {cat_name}",
                "version": "1.0.0",
                "description": f"Collection of APIVerve tools for {cat_name}."
            },
            "servers": [
                {
                    "url": "https://api.apiverve.com"
                }
            ],
            "paths": {}
        }
        
        for entry in entries:
            paths = entry.get("openapi_spec", {}).get("paths", {})
            for path, path_data in paths.items():
                openapi["paths"][path] = path_data
                
        consolidated_registry.append({
            "id": cat_id,
            "name": f"{cat_name} Agent",
            "category": cat_name,
            "description": f"Provides various tools and capabilities for {cat_name} operations via APIVerve.",
            "source_url": "https://apiverve.com",
            "auth_type": "custom",
            "auth_header": "x-api-key",
            "openapi_spec": openapi,
            "system_prompt": f"You are an expert {cat_name} assistant. Use the provided APIVerve tools to fulfill the user's request. Always format your responses beautifully using a2ui components like data_grid, preview, or markdown tables. AESTHETICS ARE CRITICAL."
        })

    with open(registry_path, 'w', encoding='utf-8') as f:
        json.dump(consolidated_registry, f, indent=2)

    print(f"Successfully consolidated down to {len(consolidated_registry)} Category Agents!")

if __name__ == "__main__":
    main()
