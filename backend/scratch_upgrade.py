from database import engine
from sqlalchemy.orm import Session
from models import Endpoint

with Session(engine) as session:
    endpoints = session.query(Endpoint).filter(Endpoint.agent_id == 79, Endpoint.path.like("%email%")).all()
    print(f"Found {len(endpoints)} email endpoints.")
    for ep in endpoints:
        print(f"[{ep.id}] {ep.method} {ep.path} | Body: {ep.request_body}")
