from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import PendingAction, ActionStatus, User, Endpoint
from utils.auth import get_current_user
import logging

log = logging.getLogger(__name__)
router = APIRouter(tags=["HITL Actions"])

@router.post("/chat/actions/{action_id}/approve")
async def approve_action(
    action_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    # Optional: verify ownership via Agent
    
    if action.status != ActionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Action is not pending")
        
    action.status = ActionStatus.APPROVED
    db.commit()
    
    # We execute the action
    agent = action.agent
    ep_def = db.query(Endpoint).filter(
        Endpoint.agent_id == agent.id, 
        Endpoint.path == action.tool_path, 
        Endpoint.method == action.tool_method
    ).first()
    
    is_mcp = False
    if ep_def:
        is_mcp = (
            ep_def.source_type == "mcp_sse" or 
            (hasattr(ep_def.source_type, "value") and ep_def.source_type.value == "mcp_sse") or 
            "/mcp/" in (ep_def.path or "").lower()
        )
    else:
        # Fallback check
        is_mcp = "/mcp/" in action.tool_path.lower()
        
    data, status, latency = {}, 0, 0
    try:
        if is_mcp:
            from services.mcp_service import execute_mcp_tool
            mcp_url = ep_def.mcp_server_url if ep_def else agent.base_url
            ep_path = action.tool_path
            tool_name = ep_path.split("/")[-1] if "/mcp/tools/" in ep_path else (ep_def.summary if ep_def else action.tool_path.strip("/"))
            
            mcp_res, status, latency = await execute_mcp_tool(
                user_id=str(user.id),
                mcp_server_url=mcp_url,
                tool_name=tool_name,
                arguments=action.params,
            )
            if status < 400 and isinstance(mcp_res, dict) and "data" in mcp_res:
                data = mcp_res["data"]
            else:
                data = mcp_res
        else:
            from services.executor import call_api
            data, status, latency = await call_api(
                base_url=agent.base_url,
                path=action.tool_path,
                method=action.tool_method,
                endpoint_params=ep_def.parameters if ep_def else [],
                extracted_params=action.params,
                auth_type=agent.auth_type,
                auth_secret=agent.auth_secret,
                auth_header=agent.auth_header,
                custom_headers=agent.custom_headers,
            )
            
        return {
            "status": "approved",
            "data": data,
            "status_code": status,
            "latency": latency
        }
    except Exception as e:
        log.error(f"Error executing approved action: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

@router.post("/chat/actions/{action_id}/reject")
async def reject_action(
    action_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action = db.query(PendingAction).filter(PendingAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
        
    if action.status != ActionStatus.PENDING:
        raise HTTPException(status_code=400, detail="Action is not pending")
        
    action.status = ActionStatus.REJECTED
    db.commit()
    
    return {"status": "rejected"}
