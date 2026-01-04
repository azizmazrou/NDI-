"""NDI data router."""
from typing import Optional, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.ndi import NDIDomain, NDIQuestion, NDIMaturityLevel, NDIAcceptanceEvidence
from app.schemas.ndi import (
    NDIDomainResponse,
    NDIDomainList,
    NDIQuestionResponse,
    NDIQuestionWithLevels,
    NDIMaturityLevelResponse,
    NDIAcceptanceEvidenceResponse,
    NDIDomainWithQuestions,
)


def maturity_level_to_response(ml: NDIMaturityLevel) -> NDIMaturityLevelResponse:
    """Convert maturity level model to response with acceptance evidence."""
    return NDIMaturityLevelResponse(
        id=ml.id,
        question_id=ml.question_id,
        level=ml.level,
        name_en=ml.name_en,
        name_ar=ml.name_ar,
        description_en=ml.description_en,
        description_ar=ml.description_ar,
        acceptance_evidence=[
            NDIAcceptanceEvidenceResponse(
                id=ev.id,
                maturity_level_id=ev.maturity_level_id,
                evidence_id=ev.evidence_id,
                text_en=ev.text_en,
                text_ar=ev.text_ar,
                inherits_from_level=ev.inherits_from_level,
                specification_code=ev.specification_code,
                sort_order=ev.sort_order,
            )
            for ev in sorted(ml.acceptance_evidence, key=lambda x: x.sort_order)
        ] if ml.acceptance_evidence else None,
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
    """Get domain with questions."""
    result = await db.execute(
        select(NDIDomain)
        .options(
            selectinload(NDIDomain.questions)
            .selectinload(NDIQuestion.maturity_levels)
            .selectinload(NDIMaturityLevel.acceptance_evidence),
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
        is_oe_domain=domain.is_oe_domain,
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
                    maturity_level_to_response(ml)
                    for ml in sorted(q.maturity_levels, key=lambda x: x.level)
                ],
            )
            for q in sorted(domain.questions, key=lambda x: x.sort_order)
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

    # Get questions with levels and acceptance evidence
    result = await db.execute(
        select(NDIQuestion)
        .options(
            selectinload(NDIQuestion.maturity_levels)
            .selectinload(NDIMaturityLevel.acceptance_evidence)
        )
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
                maturity_level_to_response(ml)
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
            selectinload(NDIQuestion.maturity_levels)
            .selectinload(NDIMaturityLevel.acceptance_evidence),
            selectinload(NDIQuestion.domain),
        )
        .where(NDIQuestion.code == code)
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
            maturity_level_to_response(ml)
            for ml in sorted(question.maturity_levels, key=lambda x: x.level)
        ],
        domain=NDIDomainResponse.model_validate(question.domain) if question.domain else None,
    )


@router.get("/questions/{code}/levels", response_model=list[NDIMaturityLevelResponse])
async def get_question_levels(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get maturity levels for a question with acceptance evidence."""
    # Get the question first
    question_result = await db.execute(
        select(NDIQuestion).where(NDIQuestion.code == code)
    )
    question = question_result.scalar_one_or_none()

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    result = await db.execute(
        select(NDIMaturityLevel)
        .options(selectinload(NDIMaturityLevel.acceptance_evidence))
        .where(NDIMaturityLevel.question_id == question.id)
        .order_by(NDIMaturityLevel.level)
    )
    levels = result.scalars().all()

    return [maturity_level_to_response(ml) for ml in levels]


@router.get("/specifications")
async def list_specifications(
    domain_code: Optional[str] = None,
    maturity_level: Optional[int] = Query(None, ge=0, le=5),
    db: AsyncSession = Depends(get_db),
):
    """
    List specification codes from evidence data.
    Since specifications are now embedded in evidence, this returns unique spec codes.
    """
    from sqlalchemy import text

    query = """
        SELECT DISTINCT ae.specification_code, d.code as domain_code, ml.level
        FROM ndi_acceptance_evidence ae
        JOIN ndi_maturity_levels ml ON ae.maturity_level_id = ml.id
        JOIN ndi_questions q ON ml.question_id = q.id
        JOIN ndi_domains d ON q.domain_id = d.id
        WHERE ae.specification_code IS NOT NULL
    """

    params = {}
    if domain_code:
        query += " AND d.code = :domain_code"
        params["domain_code"] = domain_code.upper()

    if maturity_level is not None:
        query += " AND ml.level = :level"
        params["level"] = maturity_level

    query += " ORDER BY ae.specification_code"

    result = await db.execute(text(query), params)
    rows = result.fetchall()

    return {
        "items": [
            {
                "specification_code": row[0],
                "domain_code": row[1],
                "maturity_level": row[2],
            }
            for row in rows
        ],
        "total": len(rows),
    }
