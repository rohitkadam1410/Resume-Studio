from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

sqlite_file_name = "applications.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"
sqlite_async_url = f"sqlite+aiosqlite:///{sqlite_file_name}"

# Sync engine for initialization
engine = create_engine(sqlite_url)

# Async engine for runtime
async_engine = create_async_engine(sqlite_async_url, echo=True, future=True)

def init_db():
    SQLModel.metadata.create_all(engine)

async def get_session():
    async_session = sessionmaker(
        async_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
