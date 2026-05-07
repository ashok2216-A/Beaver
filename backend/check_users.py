from sqlalchemy import create_engine, text
from config import get_settings

def check_users():
    settings = get_settings()
    db_url = settings.database_url
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, email FROM users"))
        users = result.fetchall()
        if not users:
            print("No users found in database.")
        else:
            print("User ID | Email")
            print("-" * 50)
            for user in users:
                print(f"{user[0]} | {user[1]}")

if __name__ == "__main__":
    check_users()
