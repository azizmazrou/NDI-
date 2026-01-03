"""Database configuration and session management."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool

from app.config import settings

# Convert sync URL to async if needed
DATABASE_URL = settings.database_url
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

# Remove any ssl parameters from URL (we'll handle via connect_args)
for ssl_param in ["?ssl=disable", "&ssl=disable", "?sslmode=disable", "&sslmode=disable"]:
    DATABASE_URL = DATABASE_URL.replace(ssl_param, "")

# Create async engine with SSL disabled via connect_args (correct for asyncpg)
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.debug,
    poolclass=NullPool if settings.app_env == "testing" else None,
    pool_size=settings.database_pool_size if settings.app_env != "testing" else None,
    max_overflow=settings.database_max_overflow if settings.app_env != "testing" else None,
    connect_args={
        "ssl": False,  # Disable SSL for asyncpg
        "timeout": 30,  # Connection timeout in seconds
        "command_timeout": 60,  # Command timeout in seconds
    },
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for database sessions."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db() -> None:
    """Close database connections."""
    await engine.dispose()
