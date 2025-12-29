"""Assessment service."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import Assessment, AssessmentResponse as AssessmentResponseModel
from app.models.ndi import NDIDomain, NDIQuestion
from app.schemas.assessment import (
    AssessmentResponse,
    AssessmentResponseDetail,
    AssessmentReport,
    DomainScore,
)
from app.schemas.organization import OrganizationResponse
from app.schemas.ndi import NDIDomainResponse, NDIQuestionWithLevels, NDIMaturityLevelResponse


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


class AssessmentService:
    """Service for assessment operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_score(self, assessment_id: UUID) -> float:
        """Calculate overall assessment score."""
        result = await self.db.execute(
            select(func.avg(AssessmentResponseModel.selected_level))
            .where(AssessmentResponseModel.assessment_id == assessment_id)
            .where(AssessmentResponseModel.selected_level.isnot(None))
        )
        avg_score = result.scalar()
        return float(avg_score) if avg_score else 0.0

    async def calculate_domain_scores(
        self, assessment_id: UUID
    ) -> list[DomainScore]:
        """Calculate scores per domain."""
        # Get all domains
        domains_result = await self.db.execute(
            select(NDIDomain).order_by(NDIDomain.sort_order)
        )
        domains = domains_result.scalars().all()

        domain_scores = []
        for domain in domains:
            # Get questions for this domain
            questions_result = await self.db.execute(
                select(NDIQuestion).where(NDIQuestion.domain_id == domain.id)
            )
            questions = questions_result.scalars().all()
            total_questions = len(questions)

            if total_questions == 0:
                continue

            question_ids = [q.id for q in questions]

            # Get responses for these questions
            responses_result = await self.db.execute(
                select(AssessmentResponseModel)
                .where(AssessmentResponseModel.assessment_id == assessment_id)
                .where(AssessmentResponseModel.question_id.in_(question_ids))
                .where(AssessmentResponseModel.selected_level.isnot(None))
            )
            responses = responses_result.scalars().all()
            questions_answered = len(responses)

            # Calculate average
            if questions_answered > 0:
                avg_score = sum(r.selected_level for r in responses) / questions_answered
            else:
                avg_score = 0.0

            level = score_to_level(avg_score)

            domain_scores.append(
                DomainScore(
                    domain=NDIDomainResponse.model_validate(domain),
                    average_score=avg_score,
                    questions_answered=questions_answered,
                    total_questions=total_questions,
                    level_name_en=get_level_name(level, "en"),
                    level_name_ar=get_level_name(level, "ar"),
                )
            )

        return domain_scores

    async def generate_report(self, assessment_id: UUID) -> AssessmentReport:
        """Generate full assessment report."""
        # Get assessment with organization
        result = await self.db.execute(
            select(Assessment)
            .options(selectinload(Assessment.organization))
            .where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one_or_none()

        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        # Calculate scores
        overall_score = await self.calculate_score(assessment_id)
        overall_level = score_to_level(overall_score)
        domain_scores = await self.calculate_domain_scores(assessment_id)

        # Get responses with details
        responses_result = await self.db.execute(
            select(AssessmentResponseModel)
            .options(
                selectinload(AssessmentResponseModel.question).selectinload(
                    NDIQuestion.maturity_levels
                ),
                selectinload(AssessmentResponseModel.evidence),
            )
            .where(AssessmentResponseModel.assessment_id == assessment_id)
        )
        responses = responses_result.scalars().all()

        response_details = [
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

        # Get total questions count
        total_questions_result = await self.db.execute(select(func.count(NDIQuestion.id)))
        total_questions = total_questions_result.scalar() or 42

        # Get response count
        resp_count = len([r for r in responses if r.selected_level is not None])

        return AssessmentReport(
            assessment=AssessmentResponse(
                id=assessment.id,
                organization_id=assessment.organization_id,
                assessment_type=assessment.assessment_type,
                status=assessment.status,
                name=assessment.name,
                description=assessment.description,
                target_level=assessment.target_level,
                current_score=overall_score,
                created_by=assessment.created_by,
                created_at=assessment.created_at,
                updated_at=assessment.updated_at,
                completed_at=assessment.completed_at,
                organization=OrganizationResponse.model_validate(assessment.organization)
                if assessment.organization
                else None,
                responses_count=resp_count,
                progress_percentage=(resp_count / total_questions) * 100
                if total_questions > 0
                else 0,
            ),
            overall_score=overall_score,
            overall_level=overall_level,
            overall_level_name_en=get_level_name(overall_level, "en"),
            overall_level_name_ar=get_level_name(overall_level, "ar"),
            domain_scores=domain_scores,
            responses=response_details,
            gaps=[],  # TODO: Add gap analysis
            recommendations=[],  # TODO: Add recommendations
            generated_at=datetime.utcnow(),
        )
