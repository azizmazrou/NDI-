"""NDI data router."""
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.ndi import NDIDomain, NDIQuestion, NDIMaturityLevel, NDISpecification
from app.schemas.ndi import (
    NDIDomainResponse,
    NDIDomainList,
    NDIQuestionResponse,
    NDIQuestionWithLevels,
    NDIMaturityLevelResponse,
    NDISpecificationResponse,
    NDISpecificationList,
    NDIDomainWithQuestions,
)

router = APIRouter()


@router.get("/domains", response_model=NDIDomainList)
async def list_domains(
    db: AsyncSession = Depends(get_db),
):
    """List all NDI domains."""
    query = select(NDIDomain).order_by(NDIDomain.sort_order)

    result = await db.execute(query)
    domains = result.scalars().all()

    return NDIDomainList(
        items=[NDIDomainResponse.model_validate(d) for d in domains],
        total=len(domains),
    )


@router.get("/domains/{code}", response_model=NDIDomainWithQuestions)
async def get_domain(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get domain with questions and specifications."""
    result = await db.execute(
        select(NDIDomain)
        .options(
            selectinload(NDIDomain.questions).selectinload(NDIQuestion.maturity_levels),
            selectinload(NDIDomain.specifications),
        )
        .where(NDIDomain.code == code.upper())
    )
    domain = result.scalar_one_or_none()

    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    return NDIDomainWithQuestions(
        id=domain.id,
        code=domain.code,
        name_en=domain.name_en,
        name_ar=domain.name_ar,
        description_en=domain.description_en,
        description_ar=domain.description_ar,
        question_count=domain.question_count,
        icon=domain.icon,
        color=domain.color,
        sort_order=domain.sort_order,
        questions=[
            NDIQuestionWithLevels(
                id=q.id,
                domain_id=q.domain_id,
                code=q.code,
                question_en=q.question_en,
                question_ar=q.question_ar,
                sort_order=q.sort_order,
                maturity_levels=[
                    NDIMaturityLevelResponse.model_validate(ml)
                    for ml in sorted(q.maturity_levels, key=lambda x: x.level)
                ],
            )
            for q in sorted(domain.questions, key=lambda x: x.sort_order)
        ],
        specifications=[
            NDISpecificationResponse.model_validate(s)
            for s in sorted(domain.specifications, key=lambda x: x.sort_order)
        ],
    )


@router.get("/domains/{code}/questions", response_model=list[NDIQuestionWithLevels])
async def get_domain_questions(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get all questions for a domain with maturity levels."""
    # First get the domain
    domain_result = await db.execute(
        select(NDIDomain).where(NDIDomain.code == code.upper())
    )
    domain = domain_result.scalar_one_or_none()

    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")

    # Get questions with levels
    result = await db.execute(
        select(NDIQuestion)
        .options(selectinload(NDIQuestion.maturity_levels))
        .where(NDIQuestion.domain_id == domain.id)
        .order_by(NDIQuestion.sort_order)
    )
    questions = result.scalars().all()

    return [
        NDIQuestionWithLevels(
            id=q.id,
            domain_id=q.domain_id,
            code=q.code,
            question_en=q.question_en,
            question_ar=q.question_ar,
            sort_order=q.sort_order,
            maturity_levels=[
                NDIMaturityLevelResponse.model_validate(ml)
                for ml in sorted(q.maturity_levels, key=lambda x: x.level)
            ],
        )
        for q in questions
    ]


@router.get("/questions/{code}", response_model=NDIQuestionWithLevels)
async def get_question(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific question with maturity levels."""
    result = await db.execute(
        select(NDIQuestion)
        .options(
            selectinload(NDIQuestion.maturity_levels),
            selectinload(NDIQuestion.domain),
        )
        .where(NDIQuestion.code == code.upper())
    )
    question = result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    return NDIQuestionWithLevels(
        id=question.id,
        domain_id=question.domain_id,
        code=question.code,
        question_en=question.question_en,
        question_ar=question.question_ar,
        sort_order=question.sort_order,
        maturity_levels=[
            NDIMaturityLevelResponse.model_validate(ml)
            for ml in sorted(question.maturity_levels, key=lambda x: x.level)
        ],
        domain=NDIDomainResponse.model_validate(question.domain) if question.domain else None,
    )


@router.get("/questions/{code}/levels", response_model=list[NDIMaturityLevelResponse])
async def get_question_levels(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get maturity levels for a question."""
    # Get the question first
    question_result = await db.execute(
        select(NDIQuestion).where(NDIQuestion.code == code.upper())
    )
    question = question_result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    result = await db.execute(
        select(NDIMaturityLevel)
        .where(NDIMaturityLevel.question_id == question.id)
        .order_by(NDIMaturityLevel.level)
    )
    levels = result.scalars().all()

    return [NDIMaturityLevelResponse.model_validate(ml) for ml in levels]


@router.get("/specifications", response_model=NDISpecificationList)
async def list_specifications(
    domain_code: Optional[str] = None,
    maturity_level: Optional[int] = Query(None, ge=1, le=5),
    db: AsyncSession = Depends(get_db),
):
    """List all specifications with optional filtering."""
    query = select(NDISpecification)

    if domain_code:
        # Get domain ID
        domain_result = await db.execute(
            select(NDIDomain).where(NDIDomain.code == domain_code.upper())
        )
        domain = domain_result.scalar_one_or_none()
        if domain:
            query = query.where(NDISpecification.domain_id == domain.id)

    if maturity_level:
        query = query.where(NDISpecification.maturity_level == maturity_level)

    query = query.order_by(NDISpecification.sort_order)
    result = await db.execute(query)
    specifications = result.scalars().all()

    return NDISpecificationList(
        items=[NDISpecificationResponse.model_validate(s) for s in specifications],
        total=len(specifications),
    )


@router.get("/specifications/{code}", response_model=NDISpecificationResponse)
async def get_specification(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific specification."""
    result = await db.execute(
        select(NDISpecification).where(NDISpecification.code == code.upper())
    )
    specification = result.scalar_one_or_none()

    if not specification:
        raise HTTPException(status_code=404, detail="Specification not found")

    return NDISpecificationResponse.model_validate(specification)
