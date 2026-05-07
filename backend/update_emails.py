from sqlalchemy import create_engine, text
from config import get_settings

def update_emails():
    settings = get_settings()
    db_url = settings.database_url
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        conn.execute(text("UPDATE users SET email = 'ashoksiva2216@gmail.com'"))
        conn.commit()
        print("Successfully updated all users with email: ashoksiva2216@gmail.com")

if __name__ == "__main__":
    update_emails()
