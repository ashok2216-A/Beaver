import logging
from sqlalchemy import text
from database import engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("migration")

def migrate():
    """Manually adds the auth_header column if it doesn't exist."""
    column_name = "auth_header"
    table_name = "agents"
    
    with engine.connect() as conn:
        dialect_name = engine.dialect.name
        logger.info(f"Detected dialect: {dialect_name}")
        logger.info(f"Checking for {column_name} in {table_name}...")
        
        col_exists = False
        
        if dialect_name == "postgresql":
            check_query = text(f"""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = '{table_name}' AND column_name = '{column_name}';
            """)
            col_exists = conn.execute(check_query).scalar() > 0
        elif dialect_name == "sqlite":
            # For SQLite, we use PRAGMA table_info
            check_query = text(f"PRAGMA table_info({table_name})")
            rows = conn.execute(check_query).fetchall()
            col_exists = any(row[1] == column_name for row in rows)
        else:
            # Generic fallback: just try to add it and catch the error
            logger.warning(f"Unknown dialect {dialect_name}. Attempting blind migration.")
            col_exists = False

        if not col_exists:
            logger.info(f"Adding column {column_name} to {table_name}...")
            try:
                # Add the column
                conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} VARCHAR(100);"))
                conn.commit()
                logger.info("✅ Migration successful!")
            except Exception as e:
                logger.error(f"❌ Migration failed: {e}")
                conn.rollback()
        else:
            logger.info(f"✅ Column {column_name} already exists. Skipping.")

if __name__ == "__main__":
    migrate()
