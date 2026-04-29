from database import engine
from sqlalchemy.orm import Session
from models import Agent, Endpoint

with Session(engine) as session:
    agents = session.query(Agent).all()
    print("--- LIVE DATABASE AGENT INVENTORY (WITH ENDPOINT DESCRIPTIONS) ---")
    for a in agents:
        print(f"\n[ID {a.id}] {a.name}")
        
        endpoints = session.query(Endpoint).filter(Endpoint.agent_id == a.id).limit(2).all()
        if endpoints:
            for ep in endpoints:
                method = ep.method.value if hasattr(ep.method, 'value') else ep.method
                print(f"  - [{method} {ep.path}]")
                print(f"    Summary: {ep.summary}")
                print(f"    Description: {ep.description or 'None'}")
        else:
            print("  - Tools: None")
