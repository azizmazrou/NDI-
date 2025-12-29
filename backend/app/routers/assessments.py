"""Assessment router."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.organization import Organization
from app.models.assessment import Assessment, AssessmentResponse as AssessmentResponseModel
from app.models.ndi import NDIDomain, NDIQuestion
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentList,
    AssessmentResponseCreate,
    AssessmentResponseUpdate,
    AssessmentResponseDetail,
    AssessmentReport,
    DomainScore,
)
from app.schemas.organization import OrganizationResponse
from app.schemas.ndi import NDIDomainResponse, NDIQuestionWithLevels, NDIMaturityLevelResponse
from app.services.assessment_service import AssessmentService

router = APIRouter()


def get_level_name(level: int, language: str = "en") -> str:
    """Get maturity level name."""
    levels = {
        0: ("Absence of Capabilities", "غياب القدرات"),
        1: ("Establishing", "التأسيس"),
        2: ("Defined", "التحديد"),
        3: ("Activated", "التفعيل"),
        4: ("Managed", "الإدارة"),
        5: ("Pioneer", "الريادة"),
    }
    return levels.get(level, ("Unknown", "غير معروف"))[0 if language == "en" else 1]


def score_to_level(score: float) -> int:
    """Convert score to maturity level."""
    if score < 0.25:
        return 0
    elif score < 1.25:
        return 1
    elif score < 2.5:
        return 2
    elif score < 4.0:
        return 3
    elif score < 4.75:
        return 4
    else:
        return 5


@router.get("", response_model=AssessmentList)
async def list_assessments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    organization_id: Optional[UUID] = None,
    assessment_type: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """List assessments with pagination and filtering."""
    query = select(Assessment).options(selectinload(Assessment.organization))

    if organization_id:
        query = query.where(Assessment.organization_id == organization_id)
    if assessment_type:
        query = query.where(Assessment.assessment_type == assessment_type)
    if status:
        query = query.where(Assessment.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Get total questions for progress calculation
    total_questions_result = await db.execute(select(func.count(NDIQuestion.id)))
    total_questions = total_questions_result.scalar() or 42

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Assessment.created_at.desc())

    result = await db.execute(query)
    assessments = result.scalars().all()

    items = []
    for a in assessments:
        # Get response count
        resp_count_result = await db.execute(
            select(func.count(AssessmentResponseModel.id))
            .where(AssessmentResponseModel.assessment_id == a.id)
            .where(AssessmentResponseModel.selected_level.isnot(None))
        )
        responses_count = resp_count_result.scalar() or 0

        items.append(
            AssessmentResponse(
                id=a.id,
                organization_id=a.organization_id,
                assessment_type=a.assessment_type,
                status=a.status,
                name=a.name,
                description=a.description,
                target_level=a.target_level,
                current_score=a.current_score,
                created_by=a.created_by,
                created_at=a.created_at,
                updated_at=a.updated_at,
                completed_at=a.completed_at,
                organization=OrganizationResponse.model_validate(a.organization)
                if a.organization
                else None,
                responses_count=responses_count,
                progress_percentage=(responses_count / total_questions) * 100
                if total_questions > 0
                else 0,
            )
        )

    return AssessmentList(
        items=items,
        total=total or 0,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=AssessmentResponse, status_code=201)
async def create_assessment(
    data: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new assessment."""
    # Verify organization exists
    org_result = await db.execute(
        select(Organization).where(Organization.id == data.organization_id)
    )
    if not org_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Organization not found")

    assessment = Assessment(**data.model_dump())
    db.add(assessment)
    await db.flush()
    await db.refresh(assessment)

    return AssessmentResponse(
        id=assessment.id,
        organization_id=assessment.organization_id,
        assessment_type=assessment.assessment_type,
        status=assessment.status,
        name=assessment.name,
        description=assessment.description,
        target_level=assessment.target_level,
        current_score=assessment.current_score,
        created_by=assessment.created_by,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
        completed_at=assessment.completed_at,
        responses_count=0,
        progress_percentage=0,
    )


@router.get("/{assessment_id}", response_model=AssessmentResponse)
async def get_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get assessment by ID."""
    result = await db.execute(
        select(Assessment)
        .options(selectinload(Assessment.organization))
        .where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Get total questions
    total_questions_result = await db.execute(select(func.count(NDIQuestion.id)))
    total_questions = total_questions_result.scalar() or 42

    # Get response count
    resp_count_result = await db.execute(
        select(func.count(AssessmentResponseModel.id))
        .where(AssessmentResponseModel.assessment_id == assessment.id)
        .where(AssessmentResponseModel.selected_level.isnot(None))
    )
    responses_count = resp_count_result.scalar() or 0

    return AssessmentResponse(
        id=assessment.id,
        organization_id=assessment.organization_id,
        assessment_type=assessment.assessment_type,
        status=assessment.status,
        name=assessment.name,
        description=assessment.description,
        target_level=assessment.target_level,
        current_score=assessment.current_score,
        created_by=assessment.created_by,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
        completed_at=assessment.completed_at,
        organization=OrganizationResponse.model_validate(assessment.organization)
        if assessment.organization
        else None,
        responses_count=responses_count,
        progress_percentage=(responses_count / total_questions) * 100
        if total_questions > 0
        else 0,
    )


@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: UUID,
    data: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an assessment."""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assessment, field, value)

    if data.status == "completed" and not assessment.completed_at:
        assessment.completed_at = datetime.utcnow()

    await db.flush()
    await db.refresh(assessment)

    return await get_assessment(assessment_id, db)


@router.delete("/{assessment_id}", status_code=204)
async def delete_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an assessment."""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    await db.delete(assessment)


@router.post("/{assessment_id}/submit", response_model=AssessmentResponse)
async def submit_assessment(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Submit an assessment for completion."""
    result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    assessment = result.scalar_one_or_none()

    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Calculate score
    service = AssessmentService(db)
    score = await service.calculate_score(assessment_id)

    assessment.status = "completed"
    assessment.completed_at = datetime.utcnow()
    assessment.current_score = score

    await db.flush()
    await db.refresh(assessment)

    return await get_assessment(assessment_id, db)


@router.get("/{assessment_id}/responses", response_model=list[AssessmentResponseDetail])
async def get_assessment_responses(
    assessment_id: UUID,
    domain_code: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all responses for an assessment."""
    # Verify assessment exists
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not assessment_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    query = (
        select(AssessmentResponseModel)
        .options(
            selectinload(AssessmentResponseModel.question).selectinload(
                NDIQuestion.maturity_levels
            ),
            selectinload(AssessmentResponseModel.question).selectinload(
                NDIQuestion.domain
            ),
            selectinload(AssessmentResponseModel.evidence),
        )
        .where(AssessmentResponseModel.assessment_id == assessment_id)
    )

    if domain_code:
        domain_result = await db.execute(
            select(NDIDomain).where(NDIDomain.code == domain_code.upper())
        )
        domain = domain_result.scalar_one_or_none()
        if domain:
            query = query.join(NDIQuestion).where(NDIQuestion.domain_id == domain.id)

    result = await db.execute(query)
    responses = result.scalars().all()

    return [
        AssessmentResponseDetail(
            id=r.id,
            assessment_id=r.assessment_id,
            question_id=r.question_id,
            selected_level=r.selected_level,
            justification=r.justification,
            notes=r.notes,
            created_at=r.created_at,
            updated_at=r.updated_at,
            question=NDIQuestionWithLevels(
                id=r.question.id,
                domain_id=r.question.domain_id,
                code=r.question.code,
                question_en=r.question.question_en,
                question_ar=r.question.question_ar,
                sort_order=r.question.sort_order,
                maturity_levels=[
                    NDIMaturityLevelResponse.model_validate(ml)
                    for ml in sorted(r.question.maturity_levels, key=lambda x: x.level)
                ],
            )
            if r.question
            else None,
            evidence=[
                {
                    "id": e.id,
                    "file_name": e.file_name,
                    "file_type": e.file_type,
                    "analysis_status": e.analysis_status,
                    "supports_level": e.ai_analysis.get("supports_level")
                    if e.ai_analysis
                    else None,
                }
                for e in r.evidence
            ],
        )
        for r in responses
    ]


@router.post("/{assessment_id}/responses", response_model=AssessmentResponseDetail)
async def create_or_update_response(
    assessment_id: UUID,
    data: AssessmentResponseCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create or update an assessment response."""
    # Verify assessment exists
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id)
    )
    if not assessment_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Check if response already exists
    existing_result = await db.execute(
        select(AssessmentResponseModel)
        .where(AssessmentResponseModel.assessment_id == assessment_id)
        .where(AssessmentResponseModel.question_id == data.question_id)
    )
    response = existing_result.scalar_one_or_none()

    if response:
        # Update existing
        response.selected_level = data.selected_level
        response.justification = data.justification
        response.notes = data.notes
    else:
        # Create new
        response = AssessmentResponseModel(
            assessment_id=assessment_id,
            **data.model_dump(),
        )
        db.add(response)

    await db.flush()
    await db.refresh(response)

    # Reload with relationships
    result = await db.execute(
        select(AssessmentResponseModel)
        .options(
            selectinload(AssessmentResponseModel.question).selectinload(
                NDIQuestion.maturity_levels
            ),
            selectinload(AssessmentResponseModel.evidence),
        )
        .where(AssessmentResponseModel.id == response.id)
    )
    response = result.scalar_one()

    return AssessmentResponseDetail(
        id=response.id,
        assessment_id=response.assessment_id,
        question_id=response.question_id,
        selected_level=response.selected_level,
        justification=response.justification,
        notes=response.notes,
        created_at=response.created_at,
        updated_at=response.updated_at,
        question=NDIQuestionWithLevels(
            id=response.question.id,
            domain_id=response.question.domain_id,
            code=response.question.code,
            question_en=response.question.question_en,
            question_ar=response.question.question_ar,
            sort_order=response.question.sort_order,
            maturity_levels=[
                NDIMaturityLevelResponse.model_validate(ml)
                for ml in sorted(response.question.maturity_levels, key=lambda x: x.level)
            ],
        )
        if response.question
        else None,
        evidence=[],
    )


@router.get("/{assessment_id}/report", response_model=AssessmentReport)
async def get_assessment_report(
    assessment_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Generate assessment report."""
    service = AssessmentService(db)
    return await service.generate_report(assessment_id)
