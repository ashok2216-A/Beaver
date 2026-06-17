import logging
import re
from typing import Dict, List, Any, Optional

log = logging.getLogger(__name__)

# Persistent cache for successful structural repairs (In-memory for now)
# Format: { "POST /v1/calls": { "to": "array_of_objects", "from": "object" } }
GLOBAL_PATTERN_CACHE: Dict[str, Any] = {}

class DynamicDiscoveryService:
    """
    Infers API requirements dynamically from error responses and documentation hints.
    This replaces the need for perfect pre-defined specs.
    """

    @staticmethod
    def save_successful_pattern(method: str, path: str, payload: Dict[str, Any]):
        """
        Extracts the 'shape' of a successful payload and saves it to the cache.
        """
        pattern_key = f"{method.upper()} {path}"
        
        def get_shape(obj):
            if isinstance(obj, list):
                return [get_shape(obj[0])] if obj else []
            if isinstance(obj, dict):
                return {k: get_shape(v) for k, v in obj.items()}
            return type(obj).__name__

        GLOBAL_PATTERN_CACHE[pattern_key] = get_shape(payload)
        log.info(f"PATTERN STORE: Saved successful structure for {pattern_key}")

    @staticmethod
    def get_pattern(method: str, path: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves a known successful structural pattern for an endpoint.
        """
        return GLOBAL_PATTERN_CACHE.get(f"{method.upper()} {path}")

    @staticmethod
    async def infer_field_metadata_with_ai(name: str, reason: str, agent_name: str, base_url: str) -> Dict[str, Any]:
        """
        AI Semantic Inference: Replaces all hardcoded heuristics with a 
        context-aware LLM call to determine the best UI component and data type.
        """
        import os
        from litellm import acompletion
        from config.config import get_settings
        
        settings = get_settings()
        api_key = settings.mistral_api_key or os.getenv("MISTRAL_API_KEY")
        if not api_key:
            return {"component": "textfield", "data_type": "string", "format": None, "multiline": False}

        prompt = f"""You are a UI Schema Expert.
Field Name: {name}
Error Context: {reason}
API: {agent_name} ({base_url})

Task: Determine the most appropriate UI component and data type for this field.
Available Components: textfield, number, choicepicker, checkbox, datetime, slider.
Available Data Types: string, number, boolean, datetime, object, array.
Specialized Formats: phone, email, url, voice, password.

Respond ONLY with a JSON object:
{{"component": "...", "data_type": "...", "format": "...", "multiline": bool}}"""

        try:
            from config.config import get_settings
            settings = get_settings()

            res = await acompletion(
                model=settings.default_llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=1.0,
            )
            import json
            return json.loads(res.choices[0].message.content)
        except Exception:
            return {"component": "textfield", "data_type": "string", "format": None, "multiline": False}

    @staticmethod
    async def adaptive_schema_probe(make_request_async, initial_error: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Multi-pass adaptive schema discovery (Intelligent Fuzzing).
        Sends intentionally typed payloads to force the API to reveal expected types.
        """
        discovered_fields = {}

        # 1. Seed with initial hints
        initial_hints = DynamicDiscoveryService.extract_schema_hints(initial_error)
        for f in initial_hints["fields"]:
            discovered_fields[f["name"]] = f

        # 2. Define Probes (Fuzzing payloads)
        probes = [
            # Probe A: Intentionally use numbers/booleans for everything
            {f["name"]: 123 for f in initial_hints["fields"]},
            # Probe B: Intentionally use arrays for everything
            {f["name"]: [] for f in initial_hints["fields"]},
        ]

        # 3. Execute Probes
        for payload in probes:
            try:
                # We expect this to fail with 422/400
                response_data = await make_request_async(payload)
                if isinstance(response_data, dict):
                    probe_hints = DynamicDiscoveryService.extract_schema_hints(response_data)
                    for f in probe_hints["fields"]:
                        name = f["name"]
                        # Upgrade "Weak" inferences (textfield -> specific types)
                        if name not in discovered_fields or discovered_fields[name]["type"] == "textfield":
                            discovered_fields[name] = f
            except Exception as e:
                log.debug(f"Adaptive probe failed: {e}")

        return list(discovered_fields.values())

    @staticmethod
    async def discover_enum_options_with_ai(agent_name: str, base_url: str, field_name: str) -> List[str]:
        """
        Generic Enum Discovery: Uses AI to brainstorm valid options for a field 
        based on the API's operational context.
        """
        import os
        from litellm import acompletion
        from config.config import get_settings
        
        settings = get_settings()
        api_key = settings.mistral_api_key or os.getenv("MISTRAL_API_KEY")
        if not api_key:
            return []

        prompt = f"""You are an API Expert.
API: {agent_name} ({base_url})
Field: {field_name}

Task: Brainstorm a list of 4-6 highly likely valid values for this field based on the provider.
If it is a voice/speaker field, provide common Voice IDs for this specific provider if known, or generic ones like 'male', 'female', 'en-US-Male-1'.
Respond ONLY with a JSON list of strings. No explanations."""

        try:
            res = await acompletion(
                model=settings.default_llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=1.0,
                api_key=api_key
            )
            import json
            text = res.choices[0].message.content
            data = json.loads(text)
            # The AI might return {"options": [...]} or just [...]
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                return list(data.values())[0] if data.values() else []
            return []
        except Exception as e:
            log.error(f"Enum discovery failed: {e}")
            return []

    @staticmethod
    def extract_schema_hints(error_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced Validation Extractor Engine.
        Mines an error response for structural and semantic hints.
        """
        hints = {
            "fields": [],
            "raw_schema": None
        }

        field_set = {}
        for key in ["errors", "invalid_parameters", "validation_errors", "detail"]:
            val = error_response.get(key)
            if isinstance(val, list):
                for err in val:
                    if isinstance(err, dict):
                        name = err.get("field") or err.get("name") or err.get("parameter")
                        reason = err.get("reason") or err.get("message") or err.get("detail") or ""
                        if name:
                            meta = DynamicDiscoveryService.infer_field_metadata(name, reason)
                            field_set[name] = {
                                "name": name,
                                "reason": reason,
                                "type": meta["component"],
                                "data_type": meta["data_type"],
                                "format": meta["format"],
                                "multiline": meta["multiline"]
                            }
            elif isinstance(val, dict):
                # Handle structured dict errors if needed
                pass

        # Detail string fallback
        detail = error_response.get("detail") or error_response.get("message") or ""
        if isinstance(detail, str) and detail and not field_set:
            matches = re.findall(r"['\"](\w+)['\"]", detail)
            for m in matches:
                meta = DynamicDiscoveryService.infer_field_metadata(m, detail)
                field_set[m] = {
                    "name": m,
                    "reason": detail,
                    "type": meta["component"],
                    "data_type": meta["data_type"],
                    "format": meta["format"],
                    "multiline": meta["multiline"]
                }

        hints["fields"] = list(field_set.values())
        return hints

    @staticmethod
    def schema_to_a2ui(hints: Dict[str, Any], endpoint_path: str) -> Dict[str, Any]:
        """
        Converts extracted semantic hints into a high-fidelity dynamic A2UI correction form.
        """
        a2ui = {
            "component": "form",
            "title": "Fix API Parameters",
            "subtitle": f"Validation issues detected at '{endpoint_path}'. Please correct the fields below:",
            "submit_label": "Retry Request",
            "children": []
        }

        for field in hints["fields"]:
            name = field["name"]
            comp_type = field["type"]
            reason = field["reason"]
            data_format = field.get("format")
            
            a2ui_field = {
                "component": comp_type,
                "key": name,
                "label": name.replace("_", " ").title(),
                "placeholder": reason if len(reason) < 100 else f"Enter {name}",
                "required": True,
                "multiline": field.get("multiline", False)
            }
            
            # Add metadata for specialized formatting
            if data_format:
                a2ui_field["label"] = f"{a2ui_field['label']} ({data_format.upper()})"
            
            if field.get("options"):
                a2ui_field["options"] = field["options"]

            a2ui["children"].append(a2ui_field)

        if not a2ui["children"]:
            a2ui["children"].append({
                "component": "textfield",
                "key": "user_correction",
                "label": "Manual Correction",
                "placeholder": "Describe the missing fields...",
                "required": True,
                "multiline": True
            })

        return {"a2ui": a2ui}

def get_dynamic_discovery():
    return DynamicDiscoveryService()
