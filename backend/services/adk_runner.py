"""
services/adk_runner.py — Google ADK-powered agent runner.

Architecture
────────────
For each chat request we:
  1. Dynamically build an ADK Agent whose tools are the agent's API endpoints.
  2. Run it through an ADK Runner with InMemorySessionService.
  3. Capture the final text response AND every tool call made (path, method,
     status code, latency) via a shared mutable log list.

The single tool `call_api_endpoint(path, method, params)` is universal —
the agent's instruction lists every available endpoint so Gemini knows
exactly which path/method to pass.

Every request uses a fresh session UUID so there is no cross-request state
leak (stateless REST behaviour). For multi-turn conversations, pass a stable
session_id from the frontend.
"""
from __future__ import annotations
import asyncio
import json
import logging
import time
import uuid
from typing import Any

import os
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.models.lite_llm import LiteLlm
from google.genai import types as genai_types

from config import get_settings
from services.executor import call_api

log = logging.getLogger(__name__)

# One shared in-process session store (per-process lifetime)
_session_service = InMemorySessionService()
APP_NAME = "api2bot-studio"


# ─── Agent factory ────────────────────────────────────────────────────────────

def _build_agent(
    agent_name: str,
    model: str,
    system_prompt: str,
    endpoints: list[dict],
    base_url: str,
    auth_type: str,
    auth_secret: str,
    auth_header: str | None,
    tool_log: list[dict],
) -> Agent:
    """
    Construct an ADK Agent with one universal API-call tool.

    The tool log is mutated during execution so the caller can inspect
    which endpoints were actually called after `run_async` completes.
    """

    # ── Single universal tool ────────────────────────────────────────
    async def call_api_endpoint(path: str, method: str, params: str = "{}") -> str:
        """
        Call a live API endpoint and return the JSON response.

        Args:
            path:   Exact API path from the endpoint list, e.g. /v1/customers
                    or /v1/customers/{id}.  Replace path-param placeholders
                    with real values extracted from the user's message.
            method: HTTP method — one of GET, POST, PUT, PATCH, DELETE.
            params: JSON-encoded string of all parameters (path params, query
                    params, or request body fields). Example:
                    '{"id": "cus_123", "limit": 10}'

        Returns:
            JSON string containing keys "data" (API response) and
            "status_code" (HTTP status).
        """
        try:
            params_dict: dict = json.loads(params) if params else {}
        except json.JSONDecodeError:
            params_dict = {}

        # Find the matching endpoint definition so executor can route params
        ep_def = next(
            (e for e in endpoints
             if e["path"] == path and e["method"].upper() == method.upper()),
            {},
        )

        data, status, latency = await call_api(
            base_url=base_url,
            path=path,
            method=method,
            endpoint_params=ep_def.get("parameters", []),
            extracted_params=params_dict,
            auth_type=auth_type,
            auth_secret=auth_secret,
            auth_header=auth_header,
        )

        tool_log.append({
            "path":        path,
            "method":      method.upper(),
            "status_code": status,
            "latency_ms":  latency,
            "response":    data,
        })

        try:
            return json.dumps({"data": data, "status_code": status}, default=str)
        except Exception:
            return json.dumps({"data": str(data), "status_code": status})

    # ── Endpoint catalogue for the instruction ───────────────────────
    # We avoid { } because ADK 1.31.0 aggressively tries to resolve them as context variables.
    # We use :placeholder style which Gemini understands natively.
    ep_catalogue = "\n".join(
        f"  [{ep['method']}] {ep['path'].replace('{', ':').replace('}', '')}  —  {ep.get('summary') or ep.get('description', '')}"
        for ep in endpoints
    )

    base_instruction = (
        "You are an expert API Assistant. Use the `call_api_endpoint` tool to fulfill user requests.\n\n"
        "RESPONSE STRUCTURE RULES:\n"
        "- ALWAYS use Markdown for formatting.\n"
        "- Use bullet points (*) or numbered lists for all lists of items.\n"
        "- Use bold headings (e.g., **#### Agent Details**) to categorize your response.\n"
        "- Summarize API data clearly before showing values.\n\n"
        "Available endpoints:\n"
        f"{ep_catalogue}\n\n"
        "RULES:\n"
        "- Use the exact path and method listed above.\n"
        "- Replace :placeholders in paths with real values.\n"
        "- For destructive operations (DELETE, refund, cancel) always confirm the action."
    )

    instruction = (
        f"{system_prompt}\n\n{base_instruction}"
        if system_prompt
        else base_instruction
    )

    safe_name = "".join(
        c if c.isalnum() or c == "_" else "_"
        for c in agent_name.lower().replace(" ", "_")
    )[:50] or "api_agent"

    model_name = model or "gemini/gemini-2.0-flash-lite"
    adk_model = LiteLlm(model=model_name, num_retries=3)

    return Agent(
        name=safe_name,
        model=adk_model,
        instruction=instruction,
        description=f"AI API agent — {agent_name}",
        tools=[call_api_endpoint],
    )


# ─── Async runner ─────────────────────────────────────────────────────────────

async def run_agent_async(
    agent_name: str,
    model: str,
    system_prompt: str,
    endpoints: list[dict],
    base_url: str,
    auth_type: str,
    auth_secret: str,
    auth_header: str | None,
    user_input: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    """
    Run an ADK agent turn and return a structured result dict.

    Returns keys: answer, endpoint, api_response, status_code,
                  latency_ms, llm_thought, error
    """
    tool_log: list[dict] = []
    session_id = session_id or str(uuid.uuid4())

    adk_agent = _build_agent(
        agent_name=agent_name,
        model=model,
        system_prompt=system_prompt,
        endpoints=endpoints,
        base_url=base_url,
        auth_type=auth_type,
        auth_secret=auth_secret,
        auth_header=auth_header,
        tool_log=tool_log,
    )

    runner = Runner(
        agent=adk_agent,
        app_name=APP_NAME,
        session_service=_session_service,
    )

    # Ensure the session exists (create if missing, ignore if exists)
    try:
        await _session_service.get_session(app_name=APP_NAME, session_id=session_id)
    except Exception:
        # Session doesn't exist, create it
        await _session_service.create_session(
            app_name=APP_NAME,
            user_id="user",
            session_id=session_id,
        )

    message = genai_types.Content(
        role="user",
        parts=[genai_types.Part(text=user_input)],
    )

    final_text = ""
    error_msg = ""

    settings = get_settings()
    # Propagate API keys to the environment for LiteLLM
    if settings.gemini_api_key:
        os.environ["GOOGLE_API_KEY"] = settings.gemini_api_key
    if settings.mistral_api_key:
        os.environ["MISTRAL_API_KEY"] = settings.mistral_api_key

    try:
        async for event in runner.run_async(
            user_id="user",
            session_id=session_id,
            new_message=message,
        ):
            if event.is_final_response():
                if event.content and event.content.parts:
                    final_text = "".join(
                        p.text for p in event.content.parts
                        if hasattr(p, "text") and p.text
                    )
    except Exception as exc:
        log.exception("ADK runner error for agent '%s'", agent_name)
        error_msg = str(exc)
        final_text = f"Sorry, an error occurred while processing your request: {error_msg}"

    last_call = tool_log[-1] if tool_log else {}

    return {
        "answer":       final_text,
        "endpoint":     {"path": last_call["path"], "method": last_call["method"]} if last_call else None,
        "api_response": last_call.get("response"),
        "status_code":  last_call.get("status_code", 0),
        "latency_ms":   last_call.get("latency_ms", 0),
        "llm_thought":  f"ADK agent — {len(tool_log)} tool call(s)",
        "error":        error_msg,
    }


# ─── Sync wrapper (for non-async callers) ────────────────────────────────────

def run_agent_sync(*args, **kwargs) -> dict[str, Any]:
    """Blocking wrapper around run_agent_async for synchronous contexts."""
    return asyncio.run(run_agent_async(*args, **kwargs))
