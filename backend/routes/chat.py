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
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
import uuid

from database.database import get_db
from models.models import Agent, Endpoint, Log, User, Conversation, ChatMessage
from schemas.schemas import ChatRequest, ChatResponse, LogOut, PaginatedLogs, ConversationOut, ConversationListOut
from utils.auth import get_current_user
from utils.security import encrypt_secret, decrypt_secret

log = logging.getLogger(__name__)
router = APIRouter(tags=["Chat & Logs"])
limiter = Limiter(key_func=get_remote_address)


def _sanitize_input(text: str) -> str:
    """Strip null bytes, control characters, and excessive whitespace."""
    text = text.replace("\x00", "")  # null bytes
    text = re.sub(r"[\x01-\x08\x0b\x0c\x0e-\x1f]", "", text)  # control chars
    return text.strip()


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


# ─── Conversations ────────────────────────────────────────────────────────────

@router.get("/chat/conversations", response_model=list[ConversationListOut])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List historical conversation sessions."""
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@router.get("/chat/conversations/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full message sequences for a session."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.post("/chat/conversations", response_model=ConversationListOut)
def create_conversation(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Initialize conversation bounds."""
    conv = Conversation(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title="New Operational Context"
    )
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return conv


@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a historical conversation thread."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conv)
    db.commit()
    return {"message": "Conversation deleted successfully"}


# ─── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/chat/orchestrate")
@limiter.limit("10/minute")
async def chat_orchestrate(
    request: Request,
    req: ChatRequest,
    session_id: Optional[str] = Query(None, description="Chat session ID"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Intelligently routes requests across the entire active agent ecosystem.
    """
    if session_id:
        conv = db.query(Conversation).filter(Conversation.id == session_id, Conversation.user_id == user.id).first()
        if not conv:
            conv = Conversation(id=session_id, user_id=user.id, title=req.message[:30])
            db.add(conv)
        elif conv.title in ["New Operational Context", "New Chat", "New Conversation"]:
            conv.title = req.message[:30]
            
        user_msg = ChatMessage(conversation_id=session_id, role="user", content=req.message)
        db.add(user_msg)
        db.commit()

    agents = db.query(Agent).filter(Agent.owner_id == user.id).all()
    if not agents:
        raise HTTPException(status_code=422, detail="No agents created yet.")

    agent_map = {a.id: a for a in agents}
    agent_ids = list(agent_map.keys())
    
    all_metadata = db.query(
        Endpoint.id, Endpoint.path, Endpoint.method, Endpoint.summary, Endpoint.agent_id, Endpoint.description
    ).filter(
        Endpoint.agent_id.in_(agent_ids),
        Endpoint.is_locked.is_(False)
    ).all()
    
    if not all_metadata:
        best_agent_id = agent_ids[0]
        agent = agent_map[best_agent_id]
        endpoint_list = []
    else:
        try:
            import litellm
            from config.config import get_settings
            settings = get_settings()
            
            agents_context = []
            for a in agents:
                eps = [ep for ep in all_metadata if ep.agent_id == a.id]
                tools_str = ", ".join([f"[{ep.method} {ep.path} - {ep.summary or 'Tool'}]" for ep in eps[:3]])
                desc = a.description or "Generic Task Agent"
                agents_context.append(f"ID {a.id} ({a.name}) | Desc: {desc} | Tools: {tools_str}")
            context_str = "\n".join(agents_context)
            
            history_str = ""
            if session_id:
                history_msgs = db.query(ChatMessage).filter(
                    ChatMessage.conversation_id == session_id
                ).order_by(ChatMessage.created_at.desc()).limit(6).all()
                history_msgs.reverse()
                history_str = "\n".join([f"{m.role.upper()}: {m.content}" for m in history_msgs])
            else:
                history_str = f"USER: {req.message}"
            
            prompt = f"""Select the best Agent IDs for the last request (you can select multiple if coordination is needed). Respond ONLY with a comma-separated list of integer IDs.
            
Agents:
{context_str}

Conversation:
{history_str}"""
            
            response = await litellm.acompletion(
                model=settings.default_llm_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=1.0,
                max_tokens=20,
                timeout=15.0
            )
            
            raw_ids = response.choices[0].message.content.strip()
            cleaned_ids = [int("".join([c for c in token if c.isdigit()])) for token in raw_ids.split(",") if any(c.isdigit() for c in token)]
            valid_ids = [i for i in cleaned_ids if i in agent_map]
            
            if valid_ids:
                log.info(f"LLM ROUTER successfully selected Agent IDs: {valid_ids}")
                
                # Context-aware endpoint ranking
                user_input = _sanitize_input(req.message).lower()
                context_text = user_input
                if session_id:
                    for m in history_msgs:
                        if m.content:
                            context_text += " " + m.content.lower()
                keywords = [w for w in re.findall(r'\w+', context_text) if len(w) > 2]
                
                valid_metadata = [ep for ep in all_metadata if ep.agent_id in valid_ids]
                
                # Group and score endpoints by agent to avoid starvation of any selected agent's tools
                agent_endpoints = {aid: [] for aid in valid_ids}
                best_agent_id = valid_ids[0]
                max_score = -1
                
                for ep in valid_metadata:
                    score = 0
                    path_lower = ep.path.lower()
                    summary_lower = (ep.summary or "").lower()
                    desc_lower = (ep.description or "").lower()
                    for kw in keywords:
                        if kw in path_lower:
                            score += 10
                        if kw in summary_lower:
                            score += 5
                        if kw in desc_lower:
                            score += 3
                    score += max(0, 5 - (ep.path.count('/') * 0.5))
                    
                    if score > max_score:
                        max_score = score
                        best_agent_id = ep.agent_id
                    
                    if ep.agent_id in agent_endpoints:
                        agent_endpoints[ep.agent_id].append((score, ep.id))
                
                # Primary agent context is the one with the highest scoring endpoint
                agent = agent_map[best_agent_id]
                
                # Select the top relevant endpoints for each agent, distributing limits evenly
                top_ep_ids = []
                limit_per_agent = max(6, 18 // len(valid_ids))
                for aid, eps in agent_endpoints.items():
                    eps.sort(key=lambda x: x[0], reverse=True)
                    top_ep_ids.extend([item[1] for item in eps[:limit_per_agent]])

                endpoints = db.query(Endpoint).filter(
                    Endpoint.id.in_(top_ep_ids),
                    Endpoint.is_locked.is_(False)
                ).all()
                
                log.info(f"Passed {len(endpoints)} ranked tools to agent {agent.name}")
            else:
                raise ValueError("Invalid IDs received from LLM")
                
        except Exception as e:
            log.warning(f"LLM Router failed or timed out: {e}. Falling back to Keyword matching.")
            user_input = _sanitize_input(req.message).lower()
            context_text = user_input
            if session_id:
                for m in history_msgs:
                    if m.content:
                        context_text += " " + m.content.lower()
            keywords = [w for w in re.findall(r'\w+', context_text) if len(w) > 2]
            
            ranked_endpoints = []
            for ep in all_metadata:
                score = 0
                path_lower = ep.path.lower()
                summary_lower = (ep.summary or "").lower()
                
                agent_obj = agent_map.get(ep.agent_id)
                agent_name = (agent_obj.name or "").lower() if agent_obj else ""
                agent_desc = (agent_obj.description or "").lower() if agent_obj else ""
                
                for kw in keywords:
                    if kw in path_lower:
                        score += 10
                    if kw in summary_lower:
                        score += 5
                    if kw in agent_name:
                        score += 15
                    if kw in agent_desc:
                        score += 10
                    
                score += max(0, 5 - (ep.path.count('/') * 0.5))
                ranked_endpoints.append((score, ep.id, ep.agent_id))

            ranked_endpoints.sort(key=lambda x: x[0], reverse=True)
            best_match = ranked_endpoints[0]
            agent = agent_map[best_match[2]]
            
            top_ids = [item[1] for item in ranked_endpoints][:15]
            endpoints = db.query(Endpoint).filter(Endpoint.id.in_(top_ids)).all()

        endpoint_list = []
        for ep in endpoints:
            ep_agent = agent_map[ep.agent_id]
            endpoint_list.append({
                "path":         ep.path,
                "method":       ep.method.value if hasattr(ep.method, "value") else ep.method,
                "summary":      f"[{ep_agent.name}] {ep.summary}",
                "description":  ep.description,
                "parameters":   ep.parameters or [],
                "request_body": ep.request_body or {},
                "base_url":     ep_agent.base_url,
                "auth_type":    ep_agent.auth_type,
                "auth_header":  ep_agent.auth_header,
                "auth_secret":  ep_agent.auth_secret,
                "custom_headers": ep_agent.custom_headers,
                "source_type":  ep.source_type if hasattr(ep, "source_type") else "rest",
                "mcp_server_url": ep.mcp_server_url if hasattr(ep, "mcp_server_url") else None,
            })

    # Fetch history for multi-turn continuity
    history = []
    if session_id:
        db_msgs = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == session_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        for m in reversed(db_msgs):
            history.append({"role": m.role, "content": m.content})

    params = {
        "user_input": _sanitize_input(req.message),
        "endpoints": endpoint_list,
        "base_url": agent.base_url,
        "system_prompt": agent.system_prompt,
        "auth_type": agent.auth_type,
        "auth_header": agent.auth_header,
        "auth_secret": agent.auth_secret,
        "custom_headers": agent.custom_headers,
        "agent_name": "orchestrated_agent",
        "model": agent.model_id,
        "session_id": session_id,
        "history": history,
        "user_id": str(user.id),
    }

    from services.agent import run_agent
    result = await run_agent(**params)

    matched = result.get("endpoint") or {}
    log_entry = Log(
        agent_id=agent.id,
        user_input=req.message,
        matched_path=matched.get("path", ""),
        method=matched.get("method", ""),
        status_code=result.get("status_code", 0),
        latency_ms=result.get("latency_ms", 0),
        api_response=encrypt_secret(json.dumps(result.get("api_response"), default=str)[:4096]),
        llm_thought=f"Orchestrated match targeting operational domain: {agent.name}",
        error=result.get("error", ""),
        input_tokens=result.get("input_tokens", 0),
        output_tokens=result.get("output_tokens", 0),
    )
    db.add(log_entry)
    db.commit()

    if session_id:
        assistant_msg = ChatMessage(conversation_id=session_id, role="assistant", content=result.get("answer", ""))
        db.add(assistant_msg)
        db.commit()

    return {
        "answer": result.get("answer"),
        "chunks": result.get("chunks"),
        "endpoint": matched,
        "status_code": result.get("status_code", 0),
        "latency_ms": result.get("latency_ms"),
        "agent_name": agent.name,
        "conversation_id": session_id
    }


@router.post("/chat/{agent_id}")
@limiter.limit("10/minute")
async def chat(
    request: Request,
    agent_id: int,
    req: ChatRequest,
    stream: bool = Query(False, description="Enable character-by-character streaming response"),
    session_id: Optional[str] = Query(None, description="Optional session ID for multi-turn conversations"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Send a message to an agent. 
    Supports streaming if `stream=true` is passed.
    Rate limited to 10 requests/minute per IP.
    """
    agent = _get_agent_or_404(agent_id, user, db)

    if session_id:
        conv = db.query(Conversation).filter(Conversation.id == session_id, Conversation.user_id == user.id).first()
        if not conv:
            conv = Conversation(id=session_id, user_id=user.id, title=req.message[:30])
            db.add(conv)
        elif conv.title in ["New Operational Context", "New Chat", "New Conversation"]:
            conv.title = req.message[:30]
            
        user_msg = ChatMessage(conversation_id=session_id, role="user", content=req.message)
        db.add(user_msg)
        db.commit()

    # Step 1: Fetch all unlocked endpoint metadata (minimal columns) to avoid bloating memory
    all_metadata = db.query(
        Endpoint.id, Endpoint.path, Endpoint.method, Endpoint.summary
    ).filter(
        Endpoint.agent_id == agent_id,
        Endpoint.is_locked.is_(False)
    ).all()

    if not all_metadata:
        endpoint_list = []
    else:
        # Step 2: Rank endpoints by relevance to user input and recent history
        user_input = _sanitize_input(req.message).lower()
        context_text = user_input
        
        if session_id:
            recent_msgs = db.query(ChatMessage).filter(
                ChatMessage.conversation_id == session_id
            ).order_by(ChatMessage.created_at.desc()).limit(3).all()
            for m in recent_msgs:
                if m.content:
                    context_text += " " + m.content.lower()
                    
        keywords = [w for w in re.findall(r'\w+', context_text) if len(w) > 2]
        
        ranked_endpoints = []
        for ep in all_metadata:
            score = 0
            path_lower = ep.path.lower()
            summary_lower = (ep.summary or "").lower()
            
            # Exact keyword matches in path or summary get high priority
            for kw in keywords:
                if kw in path_lower:
                    score += 10
                if kw in summary_lower:
                    score += 5
                
            # Bonus for shorter paths (usually more root-level/common)
            score += max(0, 5 - (ep.path.count('/') * 0.5))
            
            ranked_endpoints.append((score, ep.id))

        # Sort by score and select endpoints
        # To avoid starving any toolkit (e.g. Gmail, YouTube) when many endpoints exist,
        # we group tools by service category and ensure fair representation.
        ranked_by_category = {}
        for score, ep_id in ranked_endpoints:
            ep_meta = next((e for e in all_metadata if e.id == ep_id), None)
            if ep_meta:
                path_upper = ep_meta.path.upper()
                if "/MCP/TOOLS/" in path_upper:
                    parts = path_upper.split("/MCP/TOOLS/")[-1].split("_")
                    category = parts[0] if parts else "DEFAULT"
                else:
                    segments = [s for s in ep_meta.path.split("/") if s]
                    category = segments[0].upper() if segments else "DEFAULT"
            else:
                category = "DEFAULT"
                
            if category not in ranked_by_category:
                ranked_by_category[category] = []
            ranked_by_category[category].append((score, ep_id))

        if len(ranked_endpoints) <= 60:
            top_ids = [item[1] for item in ranked_endpoints]
        else:
            top_ids = []
            MAX_TOTAL = 60
            MIN_PER_CATEGORY = 8

            # 1. Select the top N endpoints from each category to guarantee coverage
            for cat, items in ranked_by_category.items():
                items.sort(key=lambda x: x[0], reverse=True)
                for score, ep_id in items[:MIN_PER_CATEGORY]:
                    if ep_id not in top_ids:
                        top_ids.append(ep_id)

            # 2. Fill the remaining slots with globally highest-ranked remaining endpoints
            all_remaining = []
            for cat, items in ranked_by_category.items():
                all_remaining.extend(items[MIN_PER_CATEGORY:])
                
            all_remaining.sort(key=lambda x: x[0], reverse=True)
            for score, ep_id in all_remaining:
                if len(top_ids) >= MAX_TOTAL:
                    break
                if ep_id not in top_ids:
                    top_ids.append(ep_id)

        # Step 3: Fetch full details only for the most relevant endpoints
        endpoints = db.query(Endpoint).filter(Endpoint.id.in_(top_ids)).all()

        endpoint_list = [
            {
                "path":         ep.path,
                "method":       ep.method.value if hasattr(ep.method, "value") else ep.method,
                "summary":      ep.summary,
                "description":  ep.description,
                "parameters":   ep.parameters or [],
                "request_body": ep.request_body or {},
                "source_type":  ep.source_type if hasattr(ep, "source_type") else "rest",
                "mcp_server_url": ep.mcp_server_url if hasattr(ep, "mcp_server_url") else None,
            }
            for ep in endpoints
        ]

    # Fetch history for multi-turn continuity
    history = []
    if session_id:
        db_msgs = db.query(ChatMessage).filter(
            ChatMessage.conversation_id == session_id
        ).order_by(ChatMessage.created_at.desc()).limit(10).all()
        for m in reversed(db_msgs):
            history.append({"role": m.role, "content": m.content})

    params = {
        "user_input": _sanitize_input(req.message),
        "endpoints": endpoint_list,
        "base_url": agent.base_url,
        "system_prompt": agent.system_prompt,
        "auth_type": agent.auth_type,
        "auth_header": agent.auth_header,
        "auth_secret": agent.auth_secret,
        "custom_headers": agent.custom_headers,
        "agent_name": agent.name,
        "model": agent.model_id,
        "session_id": session_id,
        "history": history,
        "user_id": str(user.id),
        "agent_id": agent.id,
    }

    if stream:
        from services.agent import run_agent_stream
        
        async def event_generator():
            gen = run_agent_stream(**params)
            async for chunk_str in gen:
                yield chunk_str
                try:
                    # Persist log when we hit the final chunk
                    data = json.loads(chunk_str)
                    if data.get("type") == "final":
                        res = data["data"]
                        matched = res.get("endpoint") or {}
                        log_entry = Log(
                            agent_id=agent_id,
                            user_input=req.message,
                            matched_path=matched.get("path", ""),
                            method=matched.get("method", ""),
                            status_code=res.get("status_code", 0),
                            latency_ms=res.get("latency_ms", 0),
                            api_response=encrypt_secret(json.dumps(res.get("api_response"), default=str)[:4096]),
                            llm_thought=f"Auth: {agent.auth_type} | SecretLen: {len(agent.auth_secret)}",
                            error=res.get("error", ""),
                            input_tokens=res.get("input_tokens", 0),
                            output_tokens=res.get("output_tokens", 0),
                        )
                        db.add(log_entry)
                        db.commit()
                except Exception as e:
                    log.error(f"Failed to log streaming request: {e}")

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    # Non-streaming (Original)
    from services.agent import run_agent
    result = await run_agent(**params)

    # Persist log entry
    matched = result.get("endpoint") or {}
    log_entry = Log(
        agent_id=agent_id,
        user_input=req.message,
        matched_path=matched.get("path", ""),
        method=matched.get("method", ""),
        status_code=result.get("status_code", 0),
        latency_ms=result.get("latency_ms", 0),
        api_response=encrypt_secret(json.dumps(result.get("api_response"), default=str)[:4096]),
        llm_thought=f"Auth: {agent.auth_type} | SecretLen: {len(agent.auth_secret)}",
        error=result.get("error", ""),
        input_tokens=result.get("input_tokens", 0),
        output_tokens=result.get("output_tokens", 0),
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)

    if session_id:
        assistant_msg = ChatMessage(conversation_id=session_id, role="assistant", content=result.get("answer", ""))
        db.add(assistant_msg)
        db.commit()

    return ChatResponse(
        answer=result["answer"],
        chunks=result.get("chunks"),
        endpoint=matched or None,
        api_response=result.get("api_response"),
        status_code=result.get("status_code", 0),
        latency_ms=result.get("latency_ms", 0),
        log_id=log_entry.id,
        conversation_id=session_id
    )


@router.get("/chat/logs/all", response_model=PaginatedLogs)
def get_all_logs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Unified log list across all agents owned by the user."""
    log.debug("Fetching all logs for authenticated user")
    
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
    for log_entry, agent_name in items:
        # Decrypt api_response for UI
        log_entry.api_response = decrypt_secret(log_entry.api_response)
        obj = LogOut.model_validate(log_entry)
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
    
    log.debug(f"Fetching logs for agent_id={agent_id}")
    base_q = db.query(Log).filter(Log.agent_id == agent_id)
    total  = base_q.count()
    
    items  = (
        base_q.order_by(Log.created_at.desc())
              .offset((page - 1) * per_page)
              .limit(per_page)
              .all()
    )
    for log_row in items:
        log_row.api_response = decrypt_secret(log_row.api_response)
    
    return PaginatedLogs(
        total=total,
        page=page,
        per_page=per_page,
        items=[LogOut.model_validate(log_row) for log_row in items],
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
    
    entry.api_response = decrypt_secret(entry.api_response)
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
        for log_row, agent_name in logs:
            row = LogOut.model_validate(log_row)
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
