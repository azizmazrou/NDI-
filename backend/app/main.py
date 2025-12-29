"""FastAPI application entry point."""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db, close_db
from app.routers import organizations, assessments, ndi, evidence, ai


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
    title=settings.app_name,
    version=settings.app_version,
    description="نظام الامتثال لمؤشر البيانات الوطني (NDI) - National Data Index Compliance System",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["Organizations"])
app.include_router(ndi.router, prefix="/api/v1/ndi", tags=["NDI Data"])
app.include_router(assessments.router, prefix="/api/v1/assessments", tags=["Assessments"])
app.include_router(evidence.router, prefix="/api/v1/evidence", tags=["Evidence"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["AI"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "name_ar": "نظام الامتثال لمؤشر البيانات الوطني",
        "version": settings.app_version,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
