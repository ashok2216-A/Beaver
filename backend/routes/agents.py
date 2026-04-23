"""
routes/agents.py — CRUD + spec ingestion for agents.
"""
from __future__ import annotations
import json
import logging

import httpx
import yaml
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Query
from sqlalchemy.orm import Session, defer
from sqlalchemy import func, case, distinct, or_

from database import get_db
from models import Agent, Endpoint, AgentStatus, User, Log
from schemas import (
    AgentCreate, AgentOut, AgentDetail, AgentUpdate,
    EndpointOut, IngestUrlRequest, MessageOut,
    IngestPreviewRequest, IngestPreviewOut, StatsOut,
    PaginatedEndpoints,
)
from services.parser import parse_openapi
from utils.auth import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_agent_or_404(agent_id: int, user: User, db: Session) -> Agent:
    obj = db.get(Agent, agent_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    if obj.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this agent")
    
    return obj


def _ingest_spec(agent: Agent, spec: dict | str, db: Session) -> Agent:
    """Parse spec, persist endpoints using bulk insert, attach to agent."""
    if isinstance(spec, dict):
        raw = json.dumps(spec)
    else:
        raw = spec

    agent.api_spec = raw
    db.add(agent)
    db.flush()

    parsed = parse_openapi(spec)
    if not parsed:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail="No valid endpoints found in the provided spec."
        )

    # Use bulk_insert_mappings for GitHub-scale APIs (1000+ endpoints)
    endpoints = []
    for ep in parsed:
        endpoints.append({
            "agent_id": agent.id,
            "path": ep["path"],
            "method": ep["method"],
            "summary": ep.get("summary", ""),
            "description": ep.get("description", ""),
            "parameters": ep.get("parameters", []),
            "request_body": ep.get("request_body", {}),
        })
    
    db.bulk_insert_mappings(Endpoint, endpoints)
    db.commit()
    db.refresh(agent)
    return agent


def _agent_out(agent: Agent, ep_count: int | None = None) -> AgentOut:
    return AgentOut(
        id=agent.id,
        owner_id=agent.owner_id,
        name=agent.name,
        description=agent.description,
        base_url=agent.base_url,
        status=agent.status.value,
        model_id=agent.model_id,
        system_prompt=agent.system_prompt,
        auth_type=agent.auth_type,
        auth_header=agent.auth_header,
        endpoint_count=ep_count if ep_count is not None else len(agent.endpoints),
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
def create_agent(
    data: AgentCreate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    agent = Agent(
        owner_id=user.id,
        name=data.name,
        description=data.description,
        base_url=data.base_url,
        system_prompt=data.system_prompt,
        auth_type=data.auth_type,
        auth_secret=data.auth_secret,
        auth_header=data.auth_header,
        model_id=data.model_id,
        status=AgentStatus.draft,
        api_spec="",
    )
    agent = _ingest_spec(agent, data.api_spec, db)
    return _agent_out(agent)


@router.post("/ingest/url", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def ingest_url(
    body: IngestUrlRequest, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            r = await client.get(body.url)
        r.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=422, detail=f"Failed to fetch spec: {exc}")

    try:
        spec = r.json()
    except Exception:
        try:
            spec = yaml.safe_load(r.text)
        except Exception:
            raise HTTPException(status_code=422, detail="Could not parse fetched spec.")

    base_url = body.base_url or spec.get("servers", [{}])[0].get("url", "")
    
    agent = Agent(
        owner_id=user.id,
        name=body.name,
        description=body.description,
        base_url=base_url,
        system_prompt="",
        auth_type="bearer",
        auth_secret="",
        model_id="mistral/mistral-small-latest",
        status=AgentStatus.draft,
        api_spec="",
    )
    agent = _ingest_spec(agent, spec, db)
    return _agent_out(agent)


@router.get("/stats", response_model=StatsOut)
def get_global_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return statistics for the current user's agents with weekly trends."""
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    
    stats = db.query(
        func.count(distinct(Agent.id)).label("agent_total"),
        func.count(distinct(case((Agent.created_at >= week_ago, Agent.id)))).label("agent_new"),
        func.count(Log.id).label("msg_total"),
        func.count(case((Log.created_at >= week_ago, Log.id))).label("msg_this_week"),
        func.count(case(((Log.created_at < week_ago) & (Log.created_at >= two_weeks_ago), Log.id))).label("msg_prev_week"),
        func.avg(Log.latency_ms).label("latency_avg"),
        func.avg(case(((Log.created_at < week_ago) & (Log.created_at >= two_weeks_ago), Log.latency_ms))).label("latency_avg_prev")
    ).outerjoin(Log, Agent.id == Log.agent_id)\
     .filter(Agent.owner_id == user.id).first()

    agent_count = stats.agent_total or 0
    agent_new = stats.agent_new or 0
    total_messages = stats.msg_total or 0
    msg_this_week = stats.msg_this_week or 0
    msg_prev_week = stats.msg_prev_week or 0
    avg_latency = int(stats.latency_avg or 0)
    latency_prev = stats.latency_avg_prev or 0
    
    def pct_change(curr, prev):
        if prev == 0: return "+100%" if curr > 0 else "+0%"
        change = ((curr - prev) / prev) * 100
        return f"{'+' if change >= 0 else ''}{int(change)}%"

    message_trend = pct_change(msg_this_week, msg_prev_week)
    agent_trend = f"+{agent_new} this week"
    
    latency_diff = avg_latency - int(latency_prev)
    latency_trend = f"{'+' if latency_diff > 0 else ''}{latency_diff}ms"
    if latency_prev == 0: latency_trend = "-0ms"

    return StatsOut(
        agent_count=agent_count,
        message_count=total_messages,
        total_latency_ms=0,
        avg_latency_ms=avg_latency,
        agent_trend=agent_trend,
        message_trend=message_trend,
        latency_trend=latency_trend
    )


@router.get("", response_model=list[AgentOut])
def list_agents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all agents owned by the user, ordered by creation date."""
    results = db.query(
        Agent, 
        func.count(Endpoint.id).label("ep_count")
    ).options(defer(Agent.api_spec))\
     .outerjoin(Agent.endpoints)\
     .filter(Agent.owner_id == user.id)\
     .group_by(Agent.id)\
     .order_by(Agent.created_at.desc())\
     .all()
    
    return [_agent_out(agent, ep_count=ep_count) for agent, ep_count in results]


@router.get("/{agent_id}", response_model=AgentDetail)
def get_agent(agent_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return full agent detail. NOTE: For performance, full endpoints are NOT returned here."""
    agent = _get_agent_or_404(agent_id, user, db)
    base = _agent_out(agent)
    # Return empty endpoints here; frontend should use /endpoints for paginated list
    return AgentDetail(**base.model_dump(), endpoints=[])


@router.patch("/{agent_id}", response_model=AgentOut)
def update_agent(agent_id: int, data: AgentUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = _get_agent_or_404(agent_id, user, db)
    update_data = data.model_dump(exclude_none=True)
    log.info(f"Updating agent {agent_id}: fields={list(update_data.keys())}")
    for field, value in update_data.items():
        if field == "status":
            setattr(agent, field, AgentStatus(value))
        elif field == "auth_secret":
            if value == "": continue
            log.info(f"Updating auth_secret for agent {agent_id}, length={len(value)}")
            setattr(agent, field, value.strip())
        else:
            setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return _agent_out(agent)


@router.delete("/{agent_id}", response_model=MessageOut)
def delete_agent(agent_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    agent = _get_agent_or_404(agent_id, user, db)
    db.delete(agent)
    db.commit()
    return MessageOut(message=f"Agent {agent_id} deleted.")


@router.get("/{agent_id}/endpoints", response_model=PaginatedEndpoints)
def get_endpoints(
    agent_id: int, 
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    q: str = Query(None),
    method: str = Query(None),
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Return paginated and searchable endpoints for an agent."""
    _get_agent_or_404(agent_id, user, db)
    
    query = db.query(Endpoint).filter(Endpoint.agent_id == agent_id)
    
    if q:
        search_filter = or_(
            Endpoint.path.ilike(f"%{q}%"),
            Endpoint.summary.ilike(f"%{q}%"),
        )
        query = query.filter(search_filter)
    
    if method and method.upper() != "ALL":
        query = query.filter(Endpoint.method == method.upper())
    
    total = query.count()
    items = query.order_by(Endpoint.path).offset((page - 1) * per_page).limit(per_page).all()
    
    return PaginatedEndpoints(
        total=total,
        page=page,
        per_page=per_page,
        items=[EndpointOut.model_validate(ep) for ep in items]
    )


@router.patch("/{agent_id}/endpoints/{endpoint_id}/toggle-lock", response_model=EndpointOut)
def toggle_endpoint_lock(
    agent_id: int, 
    endpoint_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    _get_agent_or_404(agent_id, user, db)
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.agent_id == agent_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")
        
    endpoint.is_locked = not endpoint.is_locked
    db.commit()
    db.refresh(endpoint)
    return EndpointOut.model_validate(endpoint)


@router.patch("/{agent_id}/endpoints/lock-all", response_model=MessageOut)
def lock_all_endpoints(
    agent_id: int, 
    method: str = Query(None),
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Lock endpoints for an agent, optionally filtered by method."""
    _get_agent_or_404(agent_id, user, db)
    query = db.query(Endpoint).filter(Endpoint.agent_id == agent_id)
    if method and method.upper() != "ALL":
        query = query.filter(Endpoint.method == method.upper())
    
    query.update({"is_locked": True}, synchronize_session=False)
    db.commit()
    return MessageOut(message="Endpoints locked")


@router.patch("/{agent_id}/endpoints/unlock-all", response_model=MessageOut)
def unlock_all_endpoints(
    agent_id: int, 
    method: str = Query(None),
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Unlock endpoints for an agent, optionally filtered by method."""
    _get_agent_or_404(agent_id, user, db)
    query = db.query(Endpoint).filter(Endpoint.agent_id == agent_id)
    if method and method.upper() != "ALL":
        query = query.filter(Endpoint.method == method.upper())
    
    query.update({"is_locked": False}, synchronize_session=False)
    db.commit()
    return MessageOut(message="Endpoints unlocked")
