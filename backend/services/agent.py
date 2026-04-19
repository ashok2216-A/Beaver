"""
services/agent.py — Orchestration layer.

Wires together:  LLM routing → API execution → LLM synthesis
and returns a structured result dict consumed by the chat router.
"""
from __future__ import annotations
import json
import logging
from typing import Any

from services.llm import route_intent, synthesise_answer
from services.executor import call_api

log = logging.getLogger(__name__)


def run_agent(
    user_input: str,
    endpoints: list[dict],
    base_url: str,
    system_prompt: str = "",
    auth_type: str = "bearer",
    auth_secret: str = "",
) -> dict[str, Any]:
    """
    Full agent pipeline:
      1. Route user intent to the best endpoint (+ extract params).
      2. Call the real API.
      3. Synthesise a friendly answer from the API response.

    Returns a dict with keys:
      answer, endpoint, api_response, status_code, latency_ms,
      llm_thought, error
    """
    result: dict[str, Any] = {
        "answer":       "",
        "endpoint":     None,
        "api_response": None,
        "status_code":  0,
        "latency_ms":   0,
        "llm_thought":  "",
        "error":        "",
    }

    # 1 — Intent routing + param extraction
    try:
        matched_ep, thought = route_intent(user_input, endpoints, system_prompt)
        result["endpoint"]    = matched_ep
        result["llm_thought"] = thought
    except Exception as exc:
        log.exception("Intent routing failed")
        result["error"]  = str(exc)
        result["answer"] = "Sorry, I couldn't determine which API to call. Please try rephrasing."
        return result

    # 2 — API execution
    extracted_params = matched_ep.pop("extracted_params", {})
    api_data, status, latency = call_api(
        base_url=base_url,
        path=matched_ep["path"],
        method=matched_ep["method"],
        endpoint_params=matched_ep.get("parameters", []),
        extracted_params=extracted_params,
        auth_type=auth_type,
        auth_secret=auth_secret,
    )
    result["api_response"] = api_data
    result["status_code"]  = status
    result["latency_ms"]   = latency

    if isinstance(api_data, dict) and "error" in api_data:
        result["error"]  = api_data.get("detail", api_data["error"])
        result["answer"] = f"The API returned an error: {result['error']}"
        return result

    # 3 — LLM synthesis
    try:
        result["answer"] = synthesise_answer(
            user_input, matched_ep, api_data, system_prompt
        )
    except Exception as exc:
        log.warning("Answer synthesis failed: %s", exc)
        result["answer"] = f"API responded with status {status}:\n```json\n{json.dumps(api_data, indent=2)[:1000]}\n```"

    return result
