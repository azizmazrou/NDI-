"""AI router."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.assessment import Assessment, AssessmentResponse as AssessmentResponseModel
from app.models.evidence import Evidence
from app.schemas.ai import (
    EvidenceAnalyzeRequest,
    EvidenceAnalyzeResponse,
    GapAnalysisRequest,
    GapAnalysisResponse,
    RecommendationRequest,
    RecommendationResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.ai_service import AIService
from app.services.evidence_service import EvidenceService
from app.services.ai_evidence_service import AIEvidenceService

router = APIRouter()


# New request models
class SuggestStructureRequest(BaseModel):
    question_code: str
    target_level: int
    language: str = "ar"


class QuickCheckRequest(BaseModel):
    content: str
    question_code: str
    target_level: int


@router.post("/analyze-evidence", response_model=EvidenceAnalyzeResponse)
async def analyze_evidence(
    data: EvidenceAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze evidence document against NDI criteria."""
    # Verify evidence exists
    result = await db.execute(
        select(Evidence).where(Evidence.id == data.evidence_id)
    )
    evidence = result.scalar_one_or_none()

    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")

    service = EvidenceService(db)
    analysis = await service.analyze_evidence_against_criteria(
        evidence_id=data.evidence_id,
        question_code=data.question_code,
        selected_level=data.selected_level,
        language=data.language,
    )

    return EvidenceAnalyzeResponse(
        evidence_id=data.evidence_id,
        supports_level=analysis.supports_level,
        covered_criteria=analysis.covered_criteria,
        missing_criteria=analysis.missing_criteria,
        confidence_score=analysis.confidence_score,
        recommendations=analysis.recommendations,
        summary=analysis.summary_ar if data.language == "ar" else analysis.summary_en or "",
    )


@router.post("/gap-analysis", response_model=GapAnalysisResponse)
async def gap_analysis(
    data: GapAnalysisRequest,
    db: AsyncSession = Depends(get_db),
):
    """Perform gap analysis on an assessment."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == data.assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = AIService(db)
    return await service.gap_analysis(
        assessment_id=data.assessment_id,
        target_level=data.target_level,
        domain_code=data.domain_code,
        language=data.language,
    )


@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    data: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get AI-generated recommendations for improvement."""
    # Verify assessment exists
    result = await db.execute(
        select(Assessment).where(Assessment.id == data.assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    service = AIService(db)
    return await service.get_recommendations(
        assessment_id=data.assessment_id,
        focus_areas=data.focus_areas,
        language=data.language,
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    data: ChatRequest,
    db: AsyncSession = Depends(get_db),
):
    """Chat with AI about NDI topics using RAG."""
    service = AIService(db)
    return await service.chat(
        messages=data.messages,
        context=data.context,
        language=data.language,
    )


@router.post("/evidence/analyze-response")
async def analyze_response_evidence(
    response_id: UUID,
    language: str = Query("ar"),
    db: AsyncSession = Depends(get_db),
):
    """تحليل شواهد إجابة محددة."""
    # Verify response exists
    result = await db.execute(
        select(AssessmentResponseModel).where(AssessmentResponseModel.id == response_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Response not found")

    service = AIEvidenceService(db)
    return await service.analyze_evidence(response_id, language)


@router.post("/evidence/suggest-structure")
async def suggest_evidence_structure(
    data: SuggestStructureRequest,
    db: AsyncSession = Depends(get_db),
):
    """اقتراح هيكل الدليل المطلوب."""
    service = AIEvidenceService(db)
    return await service.suggest_evidence_structure(
        question_code=data.question_code,
        target_level=data.target_level,
        language=data.language,
    )


@router.post("/evidence/quick-check")
async def quick_check_evidence(
    data: QuickCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """فحص سريع للدليل."""
    service = AIEvidenceService(db)
    return await service.quick_check(
        content=data.content,
        question_code=data.question_code,
        target_level=data.target_level,
    )
