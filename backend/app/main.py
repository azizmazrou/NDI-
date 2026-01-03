"""FastAPI application entry point."""
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings as app_settings
from app.database import init_db, close_db
from app.routers import organizations, assessments, ndi, evidence, ai
from app.routers import settings as settings_router

# Ensure uploads directory exists
os.makedirs(app_settings.upload_dir, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler."""
    # Startup
    await init_db()
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
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["Organizations"])
app.include_router(ndi.router, prefix="/api/v1/ndi", tags=["NDI Data"])
app.include_router(assessments.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(evidence.router, prefix="/api/v1/evidence", tags=["Evidence"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])
app.include_router(settings_router.router, prefix="/api/v1/settings", tags=["Settings"])


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
