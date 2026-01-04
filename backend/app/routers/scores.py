"""Scores router - راوتر الدرجات."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.assessment import Assessment
from app.schemas.score import (
    MaturityScoreResult,
    ComplianceScoreResult,
    CombinedAssessmentResult,
)
from app.services.score_service import ScoreService

router = APIRouter()


@router.get("/assessments/{assessment_id}/maturity-score", response_model=MaturityScoreResult)
async def get_maturity_score(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """حساب درجة النضج للتقييم."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = ScoreService(db)
    return await service.calculate_maturity_score(assessment_id)


@router.get("/assessments/{assessment_id}/compliance-score", response_model=ComplianceScoreResult)
async def get_compliance_score(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """حساب درجة الامتثال للتقييم."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = ScoreService(db)
    return await service.calculate_compliance_score(assessment_id)


@router.get("/assessments/{assessment_id}/combined", response_model=CombinedAssessmentResult)
async def get_combined_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """الحصول على التقييم المجمع (النضج + الامتثال)."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = ScoreService(db)
    return await service.get_combined_assessment(assessment_id)


@router.post("/assessments/{assessment_id}/recalculate")
async def recalculate_scores(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """إعادة حساب وتحديث الدرجات."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = ScoreService(db)
    await service.update_assessment_scores(assessment_id)

    return {"status": "success", "message": "Scores recalculated"}
