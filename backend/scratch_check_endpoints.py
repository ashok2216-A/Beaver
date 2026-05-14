
import sys
import os

# Add the backend directory to sys.path so we can import config/database
sys.path.append(os.path.join(os.getcwd(), "backend"))

from config import get_settings
from database import SessionLocal
from models import Endpoint

# Manually override env if needed, though get_settings should find it in backend/
os.environ["ENV_FILE"] = "backend/.env"

def check_endpoints():
    db = SessionLocal()
    try:
        # Search for ElevenLabs endpoints
        # Usually they are on api.elevenlabs.io
        eps = db.query(Endpoint).filter(Endpoint.path.like("%knowledge-base%")).all()
        print(f"Found {len(eps)} knowledge-base endpoints:")
        for ep in eps:
            print(f"- [{ep.method}] {ep.path} (ID: {ep.id})")
            
        if not eps:
            # Check for ANY convai endpoints
            eps = db.query(Endpoint).filter(Endpoint.path.like("%convai%")).all()
            print(f"\nFound {len(eps)} total convai endpoints:")
            for ep in eps:
                print(f"- [{ep.method}] {ep.path}")
                
    finally:
        db.close()

if __name__ == "__main__":
    check_endpoints()
