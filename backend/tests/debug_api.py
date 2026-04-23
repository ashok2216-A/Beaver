
import httpx
import json
import time
from database import SessionLocal
from models import Agent, User, Endpoint

def debug():
    db = SessionLocal()
    # 1. Find the agent (Agent 20)
    agent = db.get(Agent, 20)
    if not agent:
        print("Agent 20 not found")
        return
    
    print(f"Agent: {agent.name}")
    print(f"BaseURL: {agent.base_url}")
    print(f"AuthType: {agent.auth_type}")
    print(f"SecretLen: {len(agent.auth_secret)}")
    
    # 2. Mock the request to executor.call_api directly
    from services.executor import call_api
    import asyncio
    
    async def test():
        path = "/user/starred/ashok2216-A/ashok2216_myportfolio.github.io"
        method = "PUT"
        
        print(f"\n--- Testing directly via executor.call_api ---")
        data, status, latency = await call_api(
            base_url=agent.base_url,
            path=path,
            method=method,
            endpoint_params=[], # simple test
            extracted_params={},
            auth_type=agent.auth_type,
            auth_secret=agent.auth_secret,
            auth_header=agent.auth_header
        )
        print(f"Status: {status}")
        print(f"Response: {data}")
        
    asyncio.run(test())

if __name__ == "__main__":
    debug()
