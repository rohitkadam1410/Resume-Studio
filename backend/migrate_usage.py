from sqlmodel import SQLModel, create_engine, Session, text
from models import UsageLog

# Connect to database
sqlite_url = "sqlite:///applications.db"
engine = create_engine(sqlite_url)

def migrate():
    # We can use SQLModel.metadata.create_all(engine) to create missing tables
    # But it won't migrate existing ones. Since UsageLog is new, create_all works fine.
    print("Creating UsageLog table if not exists...")
    SQLModel.metadata.create_all(engine)
    print("Migration complete. UsageLog table ready.")

if __name__ == "__main__":
    migrate()
