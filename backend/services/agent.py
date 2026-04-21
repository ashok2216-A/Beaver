"""
services/agent.py — Thin orchestration shim.

All intelligence lives in adk_runner.py.
This module exists so routes/chat.py never imports
adk_runner directly (keeps the layer boundary clean).
"""
from __future__ import annotations
from typing import Any

from services.adk_runner import run_agent_async


async def run_agent(
    user_input: str,
    endpoints: list[dict],
    base_url: str,
    system_prompt: str = "",
    auth_type: str = "bearer",
    auth_header: str | None = None,
    auth_secret: str = "",
    agent_name: str = "agent",
    model: str = "gemini-2.0-flash",
    session_id: str | None = None,
) -> dict[str, Any]:
    """
    Async entry point for the chat route.

    Returns a dict with:
        answer, endpoint, api_response, status_code, latency_ms,
        llm_thought, error
    """
    return await run_agent_async(
        agent_name=agent_name,
        model=model,
        system_prompt=system_prompt,
        endpoints=endpoints,
        base_url=base_url,
        auth_type=auth_type,
        auth_header=auth_header,
        auth_secret=auth_secret,
        user_input=user_input,
        session_id=session_id,
    )
