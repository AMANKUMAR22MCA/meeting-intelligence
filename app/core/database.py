from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession
)

from sqlalchemy.orm import (
    sessionmaker,
    declarative_base
)
from app.core.config import settings

# Convert normal PostgreSQL URL → async URL
DATABASE_URL = settings.DATABASE_URL.replace(
    "postgresql://",
    "postgresql+asyncpg://"
)

# 1. Engine — database connection
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DEBUG
)

# 2. Session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# 3. Base class for models
Base = declarative_base()

# 4. Dependency for DB session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session