"""
services/llm.py — Gemini-powered agent brain using the google-genai SDK.

Responsibilities:
  1. Select the correct API endpoint for a user request (intent routing).
  2. Extract parameters from natural language.
  3. Synthesise a human-readable answer from the API response.

Falls back to basic keyword matching if Gemini is unavailable.
"""
from __future__ import annotations
import json
import logging
from typing import Any

from config import get_settings

log = logging.getLogger(__name__)
settings = get_settings()

# Lazy-initialise Gemini client only when needed
_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client

    if not settings.gemini_api_key:
        return None

    try:
        from google import genai  # google-genai >= 1.0
        _client = genai.Client(api_key=settings.gemini_api_key)
        return _client
    except Exception as exc:
        log.warning("Could not initialise Gemini client: %s", exc)
        return None


def _generate(prompt: str) -> str:
    """Call Gemini and return the text response."""
    client = _get_client()
    if client is None:
        raise RuntimeError("Gemini not available")

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
    )
    return response.text.strip()


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _endpoint_list_text(endpoints: list[dict]) -> str:
    """Format endpoints as a compact text block for the prompt."""
    lines = []
    for i, ep in enumerate(endpoints, 1):
        lines.append(
            f"{i}. [{ep['method']}] {ep['path']} -- {ep.get('summary') or ep.get('description', '')}"
        )
    return "\n".join(lines)


def _keyword_fallback(user_input: str, endpoints: list[dict]) -> dict:
    """Simple keyword matching when Gemini is unavailable."""
    lowered = user_input.lower()
    for ep in endpoints:
        path_parts = [p.strip("/") for p in ep["path"].split("/") if p.strip("/")]
        if any(part in lowered for part in path_parts):
            return ep
    return endpoints[0]


# ─── Public API ───────────────────────────────────────────────────────────────

def route_intent(
    user_input: str,
    endpoints: list[dict],
    system_prompt: str = "",
) -> tuple[dict, str]:
    """
    Select the best matching endpoint and extract API parameters.

    Returns:
        (endpoint_dict, llm_thought)
        endpoint_dict includes optional 'extracted_params': {param_name: value}
    """
    if not endpoints:
        raise ValueError("Agent has no endpoints to route to.")

    if _get_client() is None:
        ep = _keyword_fallback(user_input, endpoints)
        return {**ep, "extracted_params": {}}, "keyword-fallback"

    ep_text = _endpoint_list_text(endpoints)
    system_context = system_prompt or "You are a helpful API assistant."

    prompt = f"""{system_context}

Available API endpoints:
{ep_text}

User request: "{user_input}"

Your task:
1. Pick the single best endpoint number from the list above.
2. Extract any parameters the endpoint needs from the user message.
3. Return ONLY valid JSON with this exact shape:
{{
  "endpoint_index": <1-based integer>,
  "extracted_params": {{<name>: <value>}},
  "thought": "<one sentence explaining your choice>"
}}
"""
    try:
        raw = _generate(prompt)
        # Strip markdown code fences Gemini sometimes adds
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)
        idx  = int(data.get("endpoint_index", 1)) - 1
        idx  = max(0, min(idx, len(endpoints) - 1))
        thought = data.get("thought", "")
        extracted = data.get("extracted_params", {})
        return {**endpoints[idx], "extracted_params": extracted}, thought
    except Exception as exc:
        log.warning("Gemini routing failed (%s) -- falling back to keyword match.", exc)
        ep = _keyword_fallback(user_input, endpoints)
        return {**ep, "extracted_params": {}}, f"fallback: {exc}"


def synthesise_answer(
    user_input: str,
    endpoint: dict,
    api_response: Any,
    system_prompt: str = "",
) -> str:
    """
    Turn a raw API response into a natural-language answer for the user.
    Falls back to a formatted JSON dump if Gemini is unavailable.
    """
    if _get_client() is None:
        try:
            return (
                f"Here's what I got from `{endpoint['method']} {endpoint['path']}`:\n"
                f"```json\n{json.dumps(api_response, indent=2)}\n```"
            )
        except Exception:
            return str(api_response)

    system_context = system_prompt or "You are a helpful API assistant."
    prompt = f"""{system_context}

The user asked: "{user_input}"
I called [{endpoint['method']}] {endpoint['path']} and received:
{json.dumps(api_response, indent=2)[:3000]}

Write a clear, concise reply to the user based on this data.
Be friendly and format lists/tables in markdown where helpful.
Do NOT expose raw JSON arrays unless explicitly asked.
"""
    try:
        return _generate(prompt)
    except Exception as exc:
        log.warning("Gemini synthesis failed: %s", exc)
        return str(api_response)
