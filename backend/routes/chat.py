"""
routes/chat.py — Chat and log endpoints (fully async).

Endpoints
─────────
POST GET  /chat/{agent_id}                 Send message, get answer
GET  /chat/{agent_id}/logs                 Paginated log list
GET  /chat/{agent_id}/logs/{log_id}        Single log entry
GET  /chat/{agent_id}/logs/export/ndjson   Stream all logs as NDJSON
"""
from __future__ import annotations
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Agent, Endpoint, Log, User
from schemas import ChatRequest, ChatResponse, LogOut, PaginatedLogs
from services.agent import run_agent
from utils.auth import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(tags=["Chat & Logs"])


# ─── Helper ───────────────────────────────────────────────────────────────────

def _get_agent_or_404(agent_id: int, user: User, db: Session) -> Agent:
    obj = db.get(Agent, agent_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Strict Ownership Check: Agent must have an owner, and it must be the current user
    if obj.owner_id is None:
        log.warning(f"Attempt to access orphaned agent {agent_id} in chat/logs")
        raise HTTPException(status_code=403, detail="This agent is orphaned and must be claimed.")
    
    if obj.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this agent")
    
    return obj


# ─── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/chat/{agent_id}", response_model=ChatResponse)
async def chat(
    agent_id: int,
    req: ChatRequest,
    session_id: Optional[str] = Query(None, description="Optional session ID for multi-turn conversations"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a natural-language message to an ADK-powered agent.

    The agent will:
      1. Understand the intent and select the right API endpoint.
      2. Extract parameters from the message.
      3. Call the real API via the `call_api_endpoint` tool.
      4. Return a human-readable answer + raw API response.

    Pass `session_id` to maintain conversation context across turns.
    Omit it for a stateless single-turn request.
    """
    agent = _get_agent_or_404(agent_id, user, db)

    # Only fetch endpoints that are NOT locked
    endpoints = db.query(Endpoint).filter(
        Endpoint.agent_id == agent_id,
        Endpoint.is_locked == False
    ).all()
    if not endpoints:
        raise HTTPException(
            status_code=422,
            detail="This agent has no parsed endpoints. Upload a valid OpenAPI spec first.",
        )

    endpoint_list = [
        {
            "path":         ep.path,
            "method":       ep.method.value if hasattr(ep.method, "value") else ep.method,
            "summary":      ep.summary,
            "description":  ep.description,
            "parameters":   ep.parameters or [],
            "request_body": ep.request_body or {},
        }
        for ep in endpoints
    ]

    # Run the ADK agent (async — no blocking)
    result = await run_agent(
        user_input=req.message,
        endpoints=endpoint_list,
        base_url=agent.base_url,
        system_prompt=agent.system_prompt,
        auth_type=agent.auth_type,
        auth_header=agent.auth_header,
        auth_secret=agent.auth_secret,
        agent_name=agent.name,
        model=agent.model_id,
        session_id=session_id,
    )

    # Persist log entry
    matched = result.get("endpoint") or {}
    log_entry = Log(
        agent_id=agent_id,
        user_input=req.message,
        matched_path=matched.get("path", ""),
        method=matched.get("method", ""),
        status_code=result.get("status_code", 0),
        latency_ms=result.get("latency_ms", 0),
        api_response=json.dumps(result.get("api_response"), default=str)[:4096],
        llm_thought=result.get("llm_thought", ""),
        error=result.get("error", ""),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    return ChatResponse(
        answer=result["answer"],
        endpoint=matched or None,
        api_response=result.get("api_response"),
        latency_ms=result.get("latency_ms", 0),
        log_id=log_entry.id,
    )


@router.get("/chat/logs/all", response_model=PaginatedLogs)
def get_all_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unified log list across all agents owned by the user."""
    log.info(f"Fetching all logs for user={user.id}")
    
    # Query joined logs and agents
    base_q = (
        db.query(Log, Agent.name.label("agent_name"))
          .join(Agent, Log.agent_id == Agent.id)
          .filter(Agent.owner_id == user.id)
    )
    
    total = base_q.count()
    items = (
        base_q.order_by(Log.created_at.desc())
              .offset((page - 1) * per_page)
              .limit(per_page)
              .all()
    )
    
    # Map results to schema, including the agent_name from the join
    out_items = []
    for l, agent_name in items:
        obj = LogOut.model_validate(l)
        obj.agent_name = agent_name
        out_items.append(obj)

    return PaginatedLogs(
        total=total,
        page=page,
        per_page=per_page,
        items=out_items,
    )


# ─── Logs ─────────────────────────────────────────────────────────────────────

@router.get("/chat/{agent_id}/logs", response_model=PaginatedLogs)
def get_logs(
    agent_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Paginated log list for an agent (newest first)."""
    _get_agent_or_404(agent_id, user, db)
    
    log.info(f"Fetching logs for agent_id={agent_id} by user={user.id}")
    base_q = db.query(Log).filter(Log.agent_id == agent_id)
    total  = base_q.count()
    
    log.info(f"Found {total} total logs for agent_id={agent_id}")
    
    items  = (
        base_q.order_by(Log.created_at.desc())
              .offset((page - 1) * per_page)
              .limit(per_page)
              .all()
    )
    return PaginatedLogs(
        total=total,
        page=page,
        per_page=per_page,
        items=[LogOut.model_validate(l) for l in items],
    )


@router.get("/chat/{agent_id}/logs/{log_id}", response_model=LogOut)
def get_log(
    agent_id: int, 
    log_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Return a single log entry."""
    _get_agent_or_404(agent_id, user, db)
    entry = (
        db.query(Log)
          .filter(Log.id == log_id, Log.agent_id == agent_id)
          .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return LogOut.model_validate(entry)


@router.get("/chat/logs/export/all/ndjson")
def export_all_logs(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Stream all logs across all of user's agents as NDJSON."""
    logs = (
        db.query(Log, Agent.name.label("agent_name"))
          .join(Agent, Log.agent_id == Agent.id)
          .filter(Agent.owner_id == user.id)
          .order_by(Log.created_at)
          .all()
    )

    def _stream():
        for l, agent_name in logs:
            row = LogOut.model_validate(l)
            row.agent_name = agent_name
            yield row.model_dump_json() + "\n"

    return StreamingResponse(
        _stream(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": 'attachment; filename="all_logs.ndjson"'
        },
    )


@router.get("/chat/{agent_id}/logs/export/ndjson")
def export_logs(
    agent_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Stream all logs for an agent as NDJSON (one JSON object per line)."""
    _get_agent_or_404(agent_id, user, db)
    logs = (
        db.query(Log)
          .filter(Log.agent_id == agent_id)
          .order_by(Log.created_at)
          .all()
    )

    def _stream():
        for entry in logs:
            row = LogOut.model_validate(entry)
            yield row.model_dump_json() + "\n"

    return StreamingResponse(
        _stream(),
        media_type="application/x-ndjson",
        headers={
            "Content-Disposition": f'attachment; filename="logs_agent_{agent_id}.ndjson"'
        },
    )
