"""
services/agent.py — Proxy to the ADK Agent Runner.
"""
from .adk_runner import run_agent_stream, run_agent_async as run_agent

__all__ = ["run_agent_stream", "run_agent"]
