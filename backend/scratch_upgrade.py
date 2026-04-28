from database import engine
from sqlalchemy.orm import Session
from models import User

with Session(engine) as session:
    users = session.query(User).all()
    print(f"Found {len(users)} users.")
    for u in users:
        print(f"Updating user: {u.email} ({u.id})")
        u.plan_type = "pro"
        u.subscription_status = "active"
    session.commit()
    print("Done upgrading users!")
