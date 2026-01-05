"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.config import settings as app_settings
from app.database import init_db, close_db, async_session_maker

# IMPORTANT: Import ALL models to ensure tables are created by init_db()
# This must be done BEFORE init_db() is called in the lifespan handler
from app.models import (
    NDIDomain, NDIQuestion, NDIMaturityLevel, NDIAcceptanceEvidence,
    Assessment, AssessmentResponse, Evidence, User, Task, Embedding,
    Setting, AIProviderConfig, OrganizationSettings
)

from app.routers import assessments, ndi, evidence, ai, tasks, scores, dashboard, reports, admin
from app.routers import settings as settings_router

# Ensure uploads directory exists
os.makedirs(app_settings.upload_dir, exist_ok=True)


async def init_default_ai_providers() -> None:
    """Initialize default AI providers if none exist."""
    try:
        async with async_session_maker() as session:
            result = await session.execute(select(AIProviderConfig))
            existing = result.scalars().all()

            if not existing:
                print("Initializing default AI providers...")
                default_providers = [
                    AIProviderConfig(
                        id="openai",
                        name_en="OpenAI",
                        name_ar="OpenAI",
                        model_name="gpt-4",
                        is_enabled=False,
                        is_default=False,
                    ),
                    AIProviderConfig(
                        id="claude",
                        name_en="Claude (Anthropic)",
                        name_ar="كلود (Anthropic)",
                        model_name="claude-3-opus-20240229",
                        is_enabled=False,
                        is_default=False,
                    ),
                    AIProviderConfig(
                        id="gemini",
                        name_en="Google Gemini",
                        name_ar="جوجل جيميني",
                        model_name="gemini-pro",
                        is_enabled=False,
                        is_default=False,
                    ),
                    AIProviderConfig(
                        id="azure",
                        name_en="Azure OpenAI",
                        name_ar="Azure OpenAI",
                        model_name="gpt-4",
                        is_enabled=False,
                        is_default=False,
                    ),
                ]
                for provider in default_providers:
                    session.add(provider)
                await session.commit()
                print(f"Created {len(default_providers)} default AI providers.")
            else:
                print(f"AI providers already exist ({len(existing)} found).")
    except Exception as e:
        print(f"Warning: Could not initialize AI providers: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    await init_db()
    await init_default_ai_providers()
    yield
    # Shutdown
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=app_settings.app_name,
    version=app_settings.app_version,
    description="نظام الامتثال لمؤشر البيانات الوطني (NDI) - National Data Index Compliance System",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=app_settings.upload_dir), name="uploads")

# Include routers
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(ndi.router, prefix="/api/v1/ndi", tags=["NDI Data"])
app.include_router(assessments.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(scores.router, prefix="/api/v1/scores", tags=["Scores"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(evidence.router, prefix="/api/v1/evidence", tags=["Evidence"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": app_settings.app_name,
        "name_ar": "نظام الامتثال لمؤشر البيانات الوطني",
        "version": app_settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
