"""Evidence router."""
import os
import uuid as uuid_lib
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.evidence import Evidence
from app.models.assessment import AssessmentResponse
from app.schemas.evidence import EvidenceResponse, EvidenceAnalysis
from app.services.evidence_service import EvidenceService

router = APIRouter()

# Allowed file types
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".pptx", ".ppt", ".txt", ".png", ".jpg", ".jpeg"}


@router.post("/upload", response_model=EvidenceResponse)
async def upload_evidence(
    response_id: UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload evidence file."""
    # Verify response exists
    result = await db.execute(
        select(AssessmentResponse).where(AssessmentResponse.id == response_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment response not found")

    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Check file size
    content = await file.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size / (1024 * 1024)}MB",
        )

    # Create upload directory
    upload_dir = Path(settings.upload_dir) / str(response_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_uuid = uuid_lib.uuid4()
    file_path = upload_dir / f"{file_uuid}{file_ext}"

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Create evidence record
    evidence = Evidence(
        response_id=response_id,
        file_name=file.filename,
        file_path=str(file_path),
        file_type=file_ext.lstrip("."),
        file_size=len(content),
        mime_type=file.content_type,
        analysis_status="pending",
    )
    db.add(evidence)
    await db.flush()
    await db.refresh(evidence)

    # Extract text asynchronously (could be done in background)
    service = EvidenceService(db)
    await service.extract_text(evidence)

    return EvidenceResponse.model_validate(evidence)


@router.get("/{evidence_id}", response_model=EvidenceResponse)
async def get_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get evidence by ID."""
    result = await db.execute(
        select(Evidence).where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    return EvidenceResponse.model_validate(evidence)


@router.delete("/{evidence_id}", status_code=204)
async def delete_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete evidence."""
    result = await db.execute(
        select(Evidence).where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    # Delete file
    if os.path.exists(evidence.file_path):
        os.remove(evidence.file_path)

    await db.delete(evidence)


@router.post("/{evidence_id}/analyze", response_model=EvidenceAnalysis)
async def analyze_evidence(
    evidence_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Analyze evidence using AI."""
    result = await db.execute(
        select(Evidence).where(Evidence.id == evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    service = EvidenceService(db)
    analysis = await service.analyze_evidence(evidence_id)

    return analysis
