from database import engine
from sqlalchemy.orm import Session
from models import Agent
from utils.security import decrypt_secret

with Session(engine) as session:
    agents = session.query(Agent).filter(Agent.id == 76).all()
    for a in agents:
        try:
            plain_secret = decrypt_secret(a.auth_secret) if a.auth_secret else "EMPTY"
        except:
            plain_secret = "FAILED_DECRYPT"
        print(f"[{a.id}] {a.name}: Key = {plain_secret}")
