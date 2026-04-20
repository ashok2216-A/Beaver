"""
routes/agents.py — CRUD + spec ingestion for agents.

Endpoints
─────────
POST   /agents                Create agent from JSON body (api_spec dict)
POST   /agents/ingest/file    Create agent from uploaded .json / .yaml file
POST   /agents/ingest/url     Create agent from a public spec URL
GET    /agents                List all agents
GET    /agents/{agent_id}     Get agent detail (with endpoints)
PATCH  /agents/{agent_id}     Update agent settings
DELETE /agents/{agent_id}     Delete agent
GET    /agents/{agent_id}/endpoints  List parsed endpoints
"""
from __future__ import annotations
import json
import logging

import httpx
import yaml
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from models import Agent, Endpoint, AgentStatus, User
from schemas import (
    AgentCreate, AgentOut, AgentDetail, AgentUpdate,
    EndpointOut, IngestUrlRequest, MessageOut,
    IngestPreviewRequest, IngestPreviewOut, StatsOut,
)
from services.parser import parse_openapi
from sqlalchemy import func
from utils.auth import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])


# ─── Helper ───────────────────────────────────────────────────────────────────

def _get_agent_or_404(agent_id: int, user: User, db: Session) -> Agent:
    obj = db.get(Agent, agent_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Strict Ownership Check: Agent must have an owner, and it must be the current user
    if obj.owner_id is None:
        log.warning(f"Attempt to access orphaned agent {agent_id}")
        raise HTTPException(status_code=403, detail="This agent is orphaned and must be claimed.")
    
    if obj.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You do not own this agent")
    
    return obj


def _ingest_spec(agent: Agent, spec: dict | str, db: Session) -> Agent:
    """Parse spec, persist endpoints, attach to agent."""
    if isinstance(spec, dict):
        raw = json.dumps(spec)
    else:
        raw = spec

    agent.api_spec = raw
    db.add(agent)
    db.flush()   # get agent.id without committing

    parsed = parse_openapi(spec)
    if not parsed:
        db.rollback()
        raise HTTPException(
            status_code=422,
            detail="No valid endpoints found in the provided spec. Please ensure you are using a valid OpenAPI 3.x or Swagger 2.x schema."
        )

    for ep in parsed:
        db.add(Endpoint(
            agent_id=agent.id,
            path=ep["path"],
            method=ep["method"],
            summary=ep["summary"],
            description=ep["description"],
            parameters=ep["parameters"],
            request_body=ep["request_body"],
        ))
    db.commit()
    db.refresh(agent)
    return agent


def _agent_out(agent: Agent) -> AgentOut:
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
        endpoint_count=len(agent.endpoints),
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
    """Create a new agent from an inline OpenAPI spec dict."""
    agent = Agent(
        owner_id=user.id,
        name=data.name,
        description=data.description,
        base_url=data.base_url,
        system_prompt=data.system_prompt,
        auth_type=data.auth_type,
        auth_secret=data.auth_secret,
        model_id=data.model_id,
        status=AgentStatus.draft,
        api_spec="",
    )
    agent = _ingest_spec(agent, data.api_spec, db)
    log.info("Created agent id=%s name=%s", agent.id, agent.name)
    return _agent_out(agent)


@router.post("/ingest/file", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def ingest_file(
    name: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a .json or .yaml OpenAPI spec file to create an agent."""
    content = await file.read()
    filename = file.filename or ""

    try:
        if filename.endswith((".yaml", ".yml")):
            spec = yaml.safe_load(content)
        else:
            spec = json.loads(content)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse spec file: {exc}")

    agent = Agent(
        owner_id=user.id,
        name=name,
        description="",
        base_url=spec.get("servers", [{}])[0].get("url", "") if "servers" in spec else "",
        system_prompt="",
        auth_type="bearer",
        auth_secret="",
        model_id="mistral/mistral-small-latest",
        status=AgentStatus.draft,
        api_spec="",
    )
    agent = _ingest_spec(agent, spec, db)
    log.info("Ingested file agent id=%s", agent.id)
    return _agent_out(agent)


@router.post("/ingest/preview", response_model=IngestPreviewOut)
async def ingest_preview(body: IngestPreviewRequest):
    """Fetch an OpenAPI spec URL and return its metadata without creating an agent."""
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
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not parse fetched spec: {exc}")

    # Extract metadata
    info = spec.get("info", {})
    name = info.get("title", "New Agent from URL")
    description = info.get("description", "")
    
    # Extract Base URL
    base_url = ""
    if "servers" in spec and spec["servers"] and spec["servers"][0].get("url"):
        base_url = spec["servers"][0]["url"]
        # If server URL is relative, combine with source domain
        if base_url.startswith("/"):
            from urllib.parse import urljoin
            base_url = urljoin(body.url, base_url)
    else:
        # Fallback to the domain of the spec source
        from urllib.parse import urlparse
        p = urlparse(body.url)
        base_url = f"{p.scheme}://{p.netloc}"

    return IngestPreviewOut(
        name=name,
        description=description,
        base_url=base_url
    )


@router.post("/ingest/url", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
async def ingest_url(
    body: IngestUrlRequest, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Fetch a public OpenAPI spec URL and create an agent."""
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
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not parse fetched spec: {exc}")

    # Derive base_url: body -> spec.servers -> source URL domain
    base_url = body.base_url
    if not base_url:
        if "servers" in spec and spec["servers"] and spec["servers"][0].get("url"):
            base_url = spec["servers"][0]["url"]
            # If server URL is relative (e.g. "/v1"), combine with source domain
            if base_url.startswith("/"):
                from urllib.parse import urljoin
                base_url = urljoin(body.url, base_url)
        else:
            # Fallback to the domain of the spec source (e.g. http://localhost:8000)
            from urllib.parse import urlparse
            p = urlparse(body.url)
            base_url = f"{p.scheme}://{p.netloc}"

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
    log.info("Ingested URL agent id=%s url=%s", agent.id, body.url)
    return _agent_out(agent)


@router.get("/stats", response_model=StatsOut)
def get_global_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return statistics for the current user's agents."""
    from models import Agent, Log
    
    # Count only agents owned by this user
    agent_count = db.query(func.count(Agent.id)).filter(Agent.owner_id == user.id).scalar() or 0
    
    # Count only logs belonging to this user's agents
    message_count = db.query(func.count(Log.id))\
        .join(Agent, Log.agent_id == Agent.id)\
        .filter(Agent.owner_id == user.id)\
        .scalar() or 0
    
    # Calculate performance metrics for user's agents
    metrics = db.query(
        func.sum(Log.latency_ms),
        func.avg(Log.latency_ms)
    ).join(Agent, Log.agent_id == Agent.id)\
     .filter(Agent.owner_id == user.id).first()
    
    total_latency = metrics[0] or 0
    avg_latency = metrics[1] or 0
    
    return StatsOut(
        agent_count=agent_count,
        message_count=message_count,
        total_latency_ms=int(total_latency),
        avg_latency_ms=int(avg_latency)
    )


@router.get("", response_model=list[AgentOut])
def list_agents(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return all agents owned by the user, ordered by creation date."""
    agents = db.query(Agent).filter(Agent.owner_id == user.id).order_by(Agent.created_at.desc()).all()
    return [_agent_out(a) for a in agents]


@router.get("/{agent_id}", response_model=AgentDetail)
def get_agent(agent_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return full agent detail including parsed endpoints."""
    agent = _get_agent_or_404(agent_id, user, db)
    base = _agent_out(agent)
    endpoints = [EndpointOut.model_validate(ep) for ep in agent.endpoints]
    return AgentDetail(**base.model_dump(), endpoints=endpoints)


@router.patch("/{agent_id}", response_model=AgentOut)
def update_agent(agent_id: int, data: AgentUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Partially update agent settings (name, prompt, auth, status…)."""
    agent = _get_agent_or_404(agent_id, user, db)
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        if field == "status":
            setattr(agent, field, AgentStatus(value))
        else:
            setattr(agent, field, value)
    db.commit()
    db.refresh(agent)
    return _agent_out(agent)


@router.delete("/{agent_id}", response_model=MessageOut)
def delete_agent(agent_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Permanently delete an agent and all its data."""
    agent = _get_agent_or_404(agent_id, user, db)
    db.delete(agent)
    db.commit()
    return MessageOut(message=f"Agent {agent_id} deleted.")


@router.get("/{agent_id}/endpoints", response_model=list[EndpointOut])
def get_endpoints(agent_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return the parsed endpoints for an agent."""
    agent = _get_agent_or_404(agent_id, user, db)
    eps = db.query(Endpoint).filter(Endpoint.agent_id == agent_id).all()
    return [EndpointOut.model_validate(ep) for ep in eps]


@router.patch("/{agent_id}/endpoints/{endpoint_id}/toggle-lock", response_model=EndpointOut)
def toggle_endpoint_lock(
    agent_id: int, 
    endpoint_id: int, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Toggle the locked status of a specific endpoint."""
    _get_agent_or_404(agent_id, user, db)
    
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.agent_id == agent_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found for this agent")
        
    endpoint.is_locked = not endpoint.is_locked
    db.commit()
    db.refresh(endpoint)
    return EndpointOut.model_validate(endpoint)
