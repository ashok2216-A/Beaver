"""
routes/agents.py — CRUD + spec ingestion for agents.
"""
from __future__ import annotations
import json
import logging

import httpx
import yaml
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form, status, Query
from sqlalchemy.orm import Session, defer
from sqlalchemy import func, case, distinct, or_

from database import get_db
from models import Agent, Endpoint, AgentStatus, User, Log, ToolSource
from schemas import (
    AgentCreate, AgentOut, AgentDetail, AgentUpdate,
    EndpointOut, EndpointCreate, EndpointUpdate, MessageOut,
    StatsOut, PaginatedEndpoints, HealthStatsOut, VelocityOut,
    BulkDeleteRequest
)
from services.parser import parse_openapi
from utils.auth import get_current_user
from utils.security import validate_url_safe, encrypt_secret, decrypt_secret
from slowapi import Limiter

from slowapi.util import get_remote_address
from fastapi import Request

def encrypt_dict(d: dict | None) -> dict:
    if not d: 
        return {}
    return {k: encrypt_secret(str(v)) for k, v in d.items()}

def decrypt_dict(d: dict | None) -> dict:
    if not d: 
        return {}
    return {k: decrypt_secret(str(v)) for k, v in d.items()}

log = logging.getLogger(__name__)
router = APIRouter(prefix="/agents", tags=["Agents"])
limiter = Limiter(key_func=get_remote_address)


# ─── Templates ────────────────────────────────────────────────────────────────

@router.get("/templates")
def list_templates():
    """Return the list of available discovery templates from manifest.json."""
    import os
    
    # Strategy 1: Absolute path from this file
    current_dir = os.path.dirname(os.path.abspath(__file__))
    path1 = os.path.join(current_dir, "..", "templates", "manifest.json")
    
    # Strategy 2: Relative to current working directory
    path2 = os.path.join(os.getcwd(), "templates", "manifest.json")
    path3 = os.path.join(os.getcwd(), "backend", "templates", "manifest.json")

    manifest_path = None
    for p in [path1, path2, path3]:
        if os.path.exists(p):
            manifest_path = p
            break

    if not manifest_path:
        log.error(f"MANIFEST NOT FOUND. Tried: {path1}, {path2}, {path3}")
        return {"templates": []}
        
    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            log.info(f"Successfully loaded {len(data.get('templates', []))} templates from {manifest_path}")
            return data
    except Exception:
        log.exception(f"Error loading manifest at {manifest_path}")
        return {"templates": []}


@router.get("/templates/{template_id}")
def get_template(template_id: str):
    """Return template details from its file, or fallback to manifest metadata."""
    import os
    template_path = os.path.join(os.path.dirname(__file__), "..", "templates", f"{template_id}.json")
    
    # Try loading from file first (for complex templates with custom logic)
    if os.path.exists(template_path):
        with open(template_path, "r") as f:
            return json.load(f)
    
    # Fallback: Look it up in the manifest
    manifest_path = os.path.join(os.path.dirname(__file__), "..", "templates", "manifest.json")
    try:
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
            template = next((t for t in manifest.get("templates", []) if t["id"] == template_id), None)
            if template:
                return template
    except Exception as e:
        log.debug(f"Template fallback failed: {e}")
        
    raise HTTPException(status_code=404, detail="Template not found")


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
    if isinstance(spec, str):
        # Try JSON
        try:
            spec = json.loads(spec)
        except Exception:
            # Try YAML
            try:
                spec = yaml.safe_load(spec)
            except Exception:
                raise HTTPException(status_code=422, detail="Invalid JSON or YAML format for API Spec")

    if isinstance(spec, dict):
        raw = json.dumps(spec, default=str)
    else:
        raw = str(spec)

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
    
    try:
        import litellm
        eps_summary = ", ".join([f"{ep['method']} {ep['path']} ({ep.get('summary', '')})" for ep in endpoints[:15]])
        prompt = f"Write a single, highly concise 2-sentence description summarizing the core purpose of this API based on its endpoints: {eps_summary}. Return ONLY the plain text description. Do not include quotes or formatting."
        
        res = litellm.completion(
            model="mistral/mistral-small-latest",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            temperature=0.1
        )
        agent.description = res.choices[0].message.content.strip().replace('"', '')
        db.add(agent)
    except Exception as e:
        log.warning(f"Failed to auto-enrich agent description: {e}")
            
    db.commit()
    db.refresh(agent)
    return agent


def _agent_out(agent: Agent, ep_count: int | None = None) -> AgentOut:
    has_secret = False
    if agent.auth_secret:
        try:
            from utils.security import decrypt_secret
            plain = decrypt_secret(agent.auth_secret)
            if plain and len(plain.strip()) > 0 and plain.strip() not in ["string", "none"]:
                has_secret = True
        except Exception:
            has_secret = False

    source_type = "rest"
    mcp_url = None
    if getattr(agent, "endpoints", None):
        for ep in agent.endpoints:
            if hasattr(ep, "source_type") and getattr(ep, "source_type") == ToolSource.mcp_sse:
                source_type = "mcp_sse"
                mcp_url = ep.mcp_server_url
                break

    if source_type == "mcp_sse" and mcp_url:
        url_lower = mcp_url.lower()
        provider = None
        from services.mcp_service import MCP_PROVIDER_MAP
        for key, val in MCP_PROVIDER_MAP.items():
            if key in url_lower:
                provider = val
                break
        if provider:
            from database import SessionLocal
            from models import UserIntegration
            try:
                with SessionLocal() as db_session:
                    integration = db_session.query(UserIntegration).filter(
                        UserIntegration.user_id == str(agent.owner_id),
                        UserIntegration.provider == provider.lower()
                    ).first()
                    if integration:
                        has_secret = True
            except Exception as e:
                log.warning(f"Error checking OAuth status for agent {agent.id}: {e}")
        else:
            has_secret = True

    return AgentOut(
        id=agent.id,
        owner_id=agent.owner_id,
        name=agent.name,
        description=agent.description,
        base_url=agent.base_url,
        status=agent.status.value,
        model_id=agent.model_id,
        is_authorized=has_secret,
        system_prompt=agent.system_prompt,
        auth_type=agent.auth_type,
        auth_header=agent.auth_header,
        endpoint_count=ep_count if ep_count is not None else len(agent.endpoints),
        custom_headers=decrypt_dict(agent.custom_headers),
        source_type=source_type,
        mcp_server_url=mcp_url,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
    )


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_agent(
    request: Request,
    data: AgentCreate, 
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # SEC-MON: Enforce plan limits
    if user.plan_type == "free":
        count = db.query(Agent).filter(Agent.owner_id == user.id).count()
        if count >= 1:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free plan limit reached (1 agent). Please upgrade to Pro for unlimited agents."
            )

    agent = Agent(
        owner_id=user.id,
        name=data.name,
        description=data.description,
        base_url=data.base_url,
        system_prompt=data.system_prompt,
        auth_type=data.auth_type,
        auth_secret=encrypt_secret(data.auth_secret),
        auth_header=data.auth_header,
        model_id=data.model_id,
        custom_headers=encrypt_dict(data.custom_headers),
        status=AgentStatus.draft,
        api_spec=data.api_spec if data.api_spec else "",
    )
    if data.api_spec:
        agent = _ingest_spec(agent, data.api_spec, db)
    elif data.source_type == "mcp_sse":
        db.add(agent)
        db.commit()
        db.refresh(agent)
        from services.mcp_service import discover_mcp_tools_sync
        mcp_url = data.mcp_server_url or data.base_url
        tools = discover_mcp_tools_sync(mcp_url, user_id=user.id)
        for t in tools:
            ep = Endpoint(
                agent_id=agent.id,
                method="POST",
                path=f"/mcp/tools/{t['name']}",
                summary=t['name'],
                description=t['description'],
                parameters=t.get("parameters", []),
                source_type=ToolSource.mcp_sse,
                mcp_server_url=mcp_url,
                is_locked=False
            )
            db.add(ep)
        db.commit()
        db.refresh(agent)
    else:
        db.add(agent)
        db.commit()
        db.refresh(agent)
        
    return _agent_out(agent)


@router.post("/ingest/file", response_model=AgentOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def ingest_file(
    request: Request,
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    base_url: str = Form(""),
    auth_type: str = Form("bearer"),
    auth_header: str = Form(""),
    auth_secret: str = Form(""),
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # SEC-MON: Enforce plan limits
    if user.plan_type == "free":
        count = db.query(Agent).filter(Agent.owner_id == user.id).count()
        if count >= 1:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Free plan limit reached (1 agent). Please upgrade to Pro for unlimited agents."
            )

    """Parse an uploaded spec file and create an agent."""
    content = await file.read()
    try:
        spec = yaml.safe_load(content)
    except Exception:
        try:
            spec = json.loads(content)
        except Exception:
            raise HTTPException(status_code=422, detail="Could not parse uploaded file (must be JSON or YAML).")

    final_base_url = base_url or spec.get("servers", [{}])[0].get("url", "")
    if final_base_url:
        validate_url_safe(final_base_url)
        
    agent = Agent(
        owner_id=user.id,
        name=name,
        description=description,
        base_url=final_base_url,
        system_prompt="",
        auth_type=auth_type,
        auth_header=auth_header,
        auth_secret=encrypt_secret(auth_secret or ""),
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
        if prev == 0:
            return "+100%" if curr > 0 else "+0%"
        change = ((curr - prev) / prev) * 100
        return f"{'+' if change >= 0 else ''}{int(change)}%"

    message_trend = pct_change(msg_this_week, msg_prev_week)
    agent_trend = f"+{agent_new} this week"
    
    latency_diff = avg_latency - int(latency_prev)
    latency_trend = f"{'+' if latency_diff > 0 else ''}{latency_diff}ms"
    if latency_prev == 0:
        latency_trend = "-0ms"

    return StatsOut(
        agent_count=agent_count,
        message_count=total_messages,
        total_latency_ms=0,
        avg_latency_ms=avg_latency,
        agent_trend=agent_trend,
        message_trend=message_trend,
        latency_trend=latency_trend
    )


@router.get("/stats/health", response_model=HealthStatsOut)
def get_health_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Calculate availability, success, and latency for display."""
    total_logs = db.query(Log).join(Agent).filter(Agent.owner_id == user.id).count()
    
    if total_logs == 0:
        return HealthStatsOut(
            api_availability="100%",
            llm_success="100%",
            latency_ms="0ms",
            upgrade_percentage=0,
            plan_type=user.plan_type
        )
        
    success_logs = db.query(Log).join(Agent).filter(
        Agent.owner_id == user.id, 
        Log.status_code >= 200, 
        Log.status_code < 400
    ).count()
    
    # Check both empty error strings and None
    no_error_logs = db.query(Log).join(Agent).filter(
        Agent.owner_id == user.id,
        (Log.error.is_(None)) | (Log.error == "")
    ).count()
    
    latency_avg = db.query(func.avg(Log.latency_ms)).join(Agent).filter(Agent.owner_id == user.id).scalar() or 0
    
    api_availability = f"{min(100.0, (success_logs / total_logs) * 100):.1f}%"
    llm_success = f"{min(100.0, (no_error_logs / total_logs) * 100):.1f}%"
    latency_ms = f"{int(latency_avg)}ms"
    
    # Upgrade percentage - based on free-tier 100 queries limit
    upgrade_percentage = min(int((total_logs / 100.0) * 100), 100)
    
    return HealthStatsOut(
        api_availability=api_availability,
        llm_success=llm_success,
        latency_ms=latency_ms,
        upgrade_percentage=upgrade_percentage,
        plan_type=user.plan_type
    )


@router.get("/stats/velocity", response_model=VelocityOut)
def get_request_velocity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Return day-by-day tool usage logs for the last 30 days."""
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    logs = db.query(Log.created_at).join(Agent).filter(
        Agent.owner_id == user.id,
        Log.created_at >= start_date
    ).all()
    
    daily_counts = {}
    for i in range(30):
        day = start_date + timedelta(days=i)
        day_str = day.strftime("%b %d")
        daily_counts[day_str] = 0
        
    for log in logs:
        log_day_str = log.created_at.strftime("%b %d")
        if log_day_str in daily_counts:
            daily_counts[log_day_str] += 1
            
    items = [{"date": k, "requests": v} for k, v in daily_counts.items()]
    return VelocityOut(items=items)


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
            if value == "":
                continue
            log.info(f"Updating auth_secret for agent {agent_id}, length={len(value)}")
            setattr(agent, field, encrypt_secret(value.strip()))
        elif field == "custom_headers":
            setattr(agent, field, encrypt_dict(value))
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


@router.post("/bulk-delete", response_model=MessageOut)
def bulk_delete_agents(
    body: BulkDeleteRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete multiple agents belonging to the current user."""
    from sqlalchemy import delete
    
    # Only delete agents that belong to the user
    stmt = delete(Agent).where(
        Agent.id.in_(body.ids),
        Agent.owner_id == user.id
    )
    result = db.execute(stmt)
    db.commit()
    
    return MessageOut(message=f"Successfully deleted {result.rowcount} agents.")


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


@router.post("/{agent_id}/endpoints", response_model=EndpointOut)
def add_custom_endpoint(
    agent_id: int,
    body: EndpointCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a custom API endpoint manually."""
    _get_agent_or_404(agent_id, user, db)
    
    path = body.path.strip()
    if not path.startswith("/"):
        path = "/" + path
        
    ep = Endpoint(
        agent_id=agent_id,
        method=body.method.strip().upper(),
        path=path,
        summary=body.summary.strip() if body.summary else f"{body.method.upper()} {path}",
        description=body.description.strip() if body.description else "",
        parameters=body.parameters or [],
        request_body=body.request_body or {},
        is_locked=False
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return EndpointOut.model_validate(ep)


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


@router.patch("/{agent_id}/endpoints/{endpoint_id}", response_model=EndpointOut)
def update_endpoint(
    agent_id: int,
    endpoint_id: int,
    body: EndpointUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing endpoint."""
    _get_agent_or_404(agent_id, user, db)
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.agent_id == agent_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(endpoint, field, value)

    db.commit()
    db.refresh(endpoint)
    return EndpointOut.model_validate(endpoint)


@router.delete("/{agent_id}/endpoints/{endpoint_id}", response_model=MessageOut)
def delete_endpoint(
    agent_id: int,
    endpoint_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an endpoint."""
    _get_agent_or_404(agent_id, user, db)
    endpoint = db.query(Endpoint).filter(Endpoint.id == endpoint_id, Endpoint.agent_id == agent_id).first()
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    db.delete(endpoint)
    db.commit()
    return MessageOut(message=f"Endpoint {endpoint_id} deleted.")
