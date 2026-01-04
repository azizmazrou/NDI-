"""Dashboard router - راوتر لوحة التحكم."""
from typing import Optional, List, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.assessment import Assessment, AssessmentResponse
from app.models.ndi import NDIDomain, NDIQuestion
from app.models.task import Task
from app.models.evidence import Evidence
from app.services.score_service import ScoreService
from app.schemas.score import DashboardStats, MaturityScoreResult, ComplianceScoreResult

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    assessment_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get dashboard statistics."""
    # Get the most recent or specified assessment
    if assessment_id:
        result = await db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one_or_none()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
    else:
        result = await db.execute(
            select(Assessment)
            .order_by(desc(Assessment.created_at))
            .limit(1)
        )
        assessment = result.scalar_one_or_none()

    if not assessment:
        # Return empty stats if no assessment exists
        return {
            "maturity": {
                "overall_score": 0,
                "overall_level": 0,
                "overall_level_name_en": "No Assessment",
                "overall_level_name_ar": "لا يوجد تقييم",
                "overall_percentage": 0,
                "domain_scores": [],
                "answered_count": 0,
                "total_questions": 42,
            },
            "compliance": {
                "compliant_count": 0,
                "partial_count": 0,
                "non_compliant_count": 0,
                "total_specifications": 0,
                "compliance_percentage": 0,
                "is_compliant": False,
            },
            "progress": {
                "answered_questions": 0,
                "total_questions": 42,
                "questions_with_evidence": 0,
            },
        }

    # Calculate scores
    service = ScoreService(db)
    maturity = await service.calculate_maturity_score(assessment.id)
    compliance = await service.calculate_compliance_score(assessment.id)

    # Get progress data
    total_questions_result = await db.execute(select(func.count(NDIQuestion.id)))
    total_questions = total_questions_result.scalar() or 42

    answered_result = await db.execute(
        select(func.count(AssessmentResponse.id))
        .where(AssessmentResponse.assessment_id == assessment.id)
        .where(AssessmentResponse.selected_level.isnot(None))
    )
    answered_questions = answered_result.scalar() or 0

    with_evidence_result = await db.execute(
        select(func.count(func.distinct(AssessmentResponse.id)))
        .select_from(AssessmentResponse)
        .join(Evidence, Evidence.response_id == AssessmentResponse.id)
        .where(AssessmentResponse.assessment_id == assessment.id)
    )
    questions_with_evidence = with_evidence_result.scalar() or 0

    return {
        "assessment_id": str(assessment.id),
        "assessment_name": assessment.name,
        "assessment_status": assessment.status,
        "maturity": maturity.model_dump(),
        "compliance": compliance.model_dump(),
        "progress": {
            "answered_questions": answered_questions,
            "total_questions": total_questions,
            "questions_with_evidence": questions_with_evidence,
            "progress_percentage": round((answered_questions / total_questions) * 100, 1) if total_questions > 0 else 0,
        },
    }


@router.get("/overview")
async def get_overview(
    db: AsyncSession = Depends(get_db),
):
    """Get system overview - counts and basic stats."""
    # Assessment counts
    total_assessments = await db.scalar(select(func.count(Assessment.id))) or 0
    completed_assessments = await db.scalar(
        select(func.count(Assessment.id)).where(Assessment.status == "completed")
    ) or 0
    in_progress_assessments = await db.scalar(
        select(func.count(Assessment.id)).where(Assessment.status == "in_progress")
    ) or 0

    # Task counts
    total_tasks = await db.scalar(select(func.count(Task.id))) or 0
    pending_tasks = await db.scalar(
        select(func.count(Task.id)).where(Task.status == "pending")
    ) or 0
    completed_tasks = await db.scalar(
        select(func.count(Task.id)).where(Task.status == "completed")
    ) or 0

    # Evidence counts
    total_evidence = await db.scalar(select(func.count(Evidence.id))) or 0

    # Domain counts
    total_domains = await db.scalar(select(func.count(NDIDomain.id))) or 0
    total_questions = await db.scalar(select(func.count(NDIQuestion.id))) or 0

    return {
        "assessments": {
            "total": total_assessments,
            "completed": completed_assessments,
            "in_progress": in_progress_assessments,
            "draft": total_assessments - completed_assessments - in_progress_assessments,
        },
        "tasks": {
            "total": total_tasks,
            "pending": pending_tasks,
            "completed": completed_tasks,
        },
        "evidence": {
            "total": total_evidence,
        },
        "ndi": {
            "domains": total_domains,
            "questions": total_questions,
        },
    }


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Get recent activity across the system."""
    activities: List[Dict[str, Any]] = []

    # Recent assessments
    assessments_result = await db.execute(
        select(Assessment)
        .order_by(desc(Assessment.updated_at))
        .limit(limit)
    )
    assessments = assessments_result.scalars().all()

    for a in assessments:
        activities.append({
            "type": "assessment",
            "action": "updated" if a.updated_at != a.created_at else "created",
            "id": str(a.id),
            "name": a.name or f"Assessment {str(a.id)[:8]}",
            "status": a.status,
            "timestamp": a.updated_at.isoformat(),
        })

    # Recent tasks
    tasks_result = await db.execute(
        select(Task)
        .order_by(desc(Task.updated_at))
        .limit(limit)
    )
    tasks = tasks_result.scalars().all()

    for t in tasks:
        activities.append({
            "type": "task",
            "action": "completed" if t.status == "completed" else "updated",
            "id": str(t.id),
            "name": t.title_en,
            "status": t.status,
            "timestamp": t.updated_at.isoformat(),
        })

    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:limit]


@router.get("/domain-summary")
async def get_domain_summary(
    assessment_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get summary by domain."""
    # Get the most recent or specified assessment
    if assessment_id:
        result = await db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one_or_none()
    else:
        result = await db.execute(
            select(Assessment)
            .order_by(desc(Assessment.created_at))
            .limit(1)
        )
        assessment = result.scalar_one_or_none()

    if not assessment:
        return {"domains": []}

    service = ScoreService(db)
    maturity = await service.calculate_maturity_score(assessment.id)

    return {
        "assessment_id": str(assessment.id),
        "domains": [ds.model_dump() for ds in maturity.domain_scores],
    }
