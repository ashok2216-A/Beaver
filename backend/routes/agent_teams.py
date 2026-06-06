from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.database import get_db
from models.models import AgentTeam, AgentTeamMember, Agent, User
from utils.auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/agent-teams", tags=["agent-teams"])

class AgentTeamCreate(BaseModel):
    name: str
    description: str = ""
    category: str = "AI Workforce"
    price: str = "$0.00"
    agent_ids: List[int] = []

@router.get("")
def list_agent_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    teams = db.query(AgentTeam).filter(AgentTeam.owner_id == user_id).all()
    
    result = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "description": team.description,
            "category": team.category,
            "price": team.price,
            "modules": len(team.members),
            "created_at": team.created_at,
            "agents": []
        }
        for member in team.members:
            if member.agent:
                team_dict["agents"].append({
                    "id": member.agent.id,
                    "name": member.agent.name
                })
        result.append(team_dict)
        
    return result

@router.post("")
def create_agent_team(team_in: AgentTeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    new_team = AgentTeam(
        owner_id=user_id,
        name=team_in.name,
        description=team_in.description,
        category=team_in.category,
        price=team_in.price
    )
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    
    for agent_id in team_in.agent_ids:
        # Verify agent belongs to user
        agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == user_id).first()
        if agent:
            member = AgentTeamMember(team_id=new_team.id, agent_id=agent.id)
            db.add(member)
            
    db.commit()
    db.refresh(new_team)
    return {"status": "success", "id": new_team.id}

@router.delete("/{team_id}")
def delete_agent_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    team = db.query(AgentTeam).filter(AgentTeam.id == team_id, AgentTeam.owner_id == user_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    db.delete(team)
    db.commit()
    return {"status": "success"}

@router.put("/{team_id}")
def update_agent_team(team_id: int, team_in: AgentTeamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    team = db.query(AgentTeam).filter(AgentTeam.id == team_id, AgentTeam.owner_id == user_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    team.name = team_in.name
    team.description = team_in.description
    
    # Delete existing members
    db.query(AgentTeamMember).filter(AgentTeamMember.team_id == team.id).delete()
    
    # Add new members
    for agent_id in team_in.agent_ids:
        agent = db.query(Agent).filter(Agent.id == agent_id, Agent.owner_id == user_id).first()
        if agent:
            member = AgentTeamMember(team_id=team.id, agent_id=agent.id)
            db.add(member)
            
    db.commit()
    return {"status": "success"}
