from sqlalchemy import create_engine, text
from config.config import get_settings



def migrate():
    settings = get_settings()
    db_url = settings.database_url
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(db_url)
    
    with engine.connect() as conn:
        print("Checking for missing columns in 'users' table...")
        
        # Check if email_notifications exists
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE NOT NULL"))
            print("Added 'email_notifications' column.")
        except Exception as e:
            if "already exists" in str(e):
                print("'email_notifications' column already exists.")
            else:
                print(f"Error adding 'email_notifications': {e}")
                
        # Check if weekly_reports exists
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN weekly_reports BOOLEAN DEFAULT FALSE NOT NULL"))
            print("Added 'weekly_reports' column.")
        except Exception as e:
            if "already exists" in str(e):
                print("'weekly_reports' column already exists.")
            else:
                print(f"Error adding 'weekly_reports': {e}")
        
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
