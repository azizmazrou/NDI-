"""Task router - راوتر المهام."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.task import Task, TaskStatus
from app.models.assessment import Assessment
from app.models.ndi import NDIQuestion
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse,
    TaskList,
    TaskStats,
    UserBrief,
    QuestionBrief,
    AssessmentBrief,
)

router = APIRouter()


def task_to_response(task: Task) -> TaskResponse:
    """Convert Task model to TaskResponse schema."""
    return TaskResponse(
        id=task.id,
        assessment_id=task.assessment_id,
        question_id=task.question_id,
        assigned_to=task.assigned_to,
        assigned_by=task.assigned_by,
        title_en=task.title_en,
        title_ar=task.title_ar,
        description_en=task.description_en,
        description_ar=task.description_ar,
        status=task.status,
        priority=task.priority,
        due_date=task.due_date,
        notes=task.notes,
        created_at=task.created_at,
        updated_at=task.updated_at,
        completed_at=task.completed_at,
        assignee=UserBrief(
            id=task.assignee.id,
            email=task.assignee.email,
            name_en=task.assignee.name_en,
            name_ar=task.assignee.name_ar,
        ) if task.assignee else None,
        assigner=UserBrief(
            id=task.assigner.id,
            email=task.assigner.email,
            name_en=task.assigner.name_en,
            name_ar=task.assigner.name_ar,
        ) if task.assigner else None,
        question=QuestionBrief(
            id=task.question.id,
            code=task.question.code,
            question_en=task.question.question_en,
            question_ar=task.question.question_ar,
        ) if task.question else None,
        assessment=AssessmentBrief(
            id=task.assessment.id,
            name=task.assessment.name,
            assessment_type=task.assessment.assessment_type,
        ) if task.assessment else None,
    )


@router.get("", response_model=TaskList)
async def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[UUID] = None,
    assigned_by: Optional[UUID] = None,
    assessment_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """List tasks with pagination and filtering."""
    query = select(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.assigner),
        selectinload(Task.question),
        selectinload(Task.assessment),
    )

    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)
    if assigned_to:
        query = query.where(Task.assigned_to == assigned_to)
    if assigned_by:
        query = query.where(Task.assigned_by == assigned_by)
    if assessment_id:
        query = query.where(Task.assessment_id == assessment_id)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply pagination and ordering
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskList(
        items=[task_to_response(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/my-tasks", response_model=TaskList)
async def get_my_tasks(
    user_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get tasks assigned to a user."""
    query = select(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.assigner),
        selectinload(Task.question),
        selectinload(Task.assessment),
    ).where(Task.assigned_to == user_id)

    if status:
        query = query.where(Task.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskList(
        items=[task_to_response(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/assigned-by-me", response_model=TaskList)
async def get_assigned_tasks(
    user_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get tasks assigned by a user."""
    query = select(Task).options(
        selectinload(Task.assignee),
        selectinload(Task.assigner),
        selectinload(Task.question),
        selectinload(Task.assessment),
    ).where(Task.assigned_by == user_id)

    if status:
        query = query.where(Task.status == status)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply pagination
    query = query.offset((page - 1) * page_size).limit(page_size)
    query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    return TaskList(
        items=[task_to_response(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/stats", response_model=TaskStats)
async def get_task_stats(
    user_id: Optional[UUID] = None,
    assessment_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get task statistics."""
    base_query = select(Task)

    if user_id:
        base_query = base_query.where(
            or_(Task.assigned_to == user_id, Task.assigned_by == user_id)
        )
    if assessment_id:
        base_query = base_query.where(Task.assessment_id == assessment_id)

    # Total count
    total_result = await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )
    total = total_result.scalar() or 0

    # Status counts
    status_counts = {}
    for status in ["pending", "in_progress", "completed", "overdue"]:
        count_result = await db.execute(
            select(func.count()).select_from(
                base_query.where(Task.status == status).subquery()
            )
        )
        status_counts[status] = count_result.scalar() or 0

    return TaskStats(
        total=total,
        pending=status_counts["pending"],
        in_progress=status_counts["in_progress"],
        completed=status_counts["completed"],
        overdue=status_counts["overdue"],
    )


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(
    data: TaskCreate,
    assigned_by: UUID,  # In production, get from auth
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    # Verify assessment exists
    assessment_result = await db.execute(
        select(Assessment).where(Assessment.id == data.assessment_id)
    )
    if not assessment_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Verify assigned user exists
    user_result = await db.execute(
        select(User).where(User.id == data.assigned_to)
    )
    if not user_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Assigned user not found")

    # Verify question exists if provided
    if data.question_id:
        question_result = await db.execute(
            select(NDIQuestion).where(NDIQuestion.id == data.question_id)
        )
        if not question_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Question not found")

    task = Task(
        **data.model_dump(),
        assigned_by=assigned_by,
        status=TaskStatus.PENDING.value,
    )
    db.add(task)
    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.assigner),
            selectinload(Task.question),
            selectinload(Task.assessment),
        )
        .where(Task.id == task.id)
    )
    task = result.scalar_one()

    return task_to_response(task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get task by ID."""
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.assigner),
            selectinload(Task.question),
            selectinload(Task.assessment),
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task_to_response(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    # Update completed_at if status changed to completed
    if data.status == TaskStatus.COMPLETED.value and not task.completed_at:
        task.completed_at = datetime.utcnow()

    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.assigner),
            selectinload(Task.question),
            selectinload(Task.assessment),
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one()

    return task_to_response(task)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_task_status(
    task_id: UUID,
    data: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update task status."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.status = data.status

    if data.status == TaskStatus.COMPLETED.value:
        task.completed_at = datetime.utcnow()

    await db.flush()

    # Reload with relationships
    result = await db.execute(
        select(Task)
        .options(
            selectinload(Task.assignee),
            selectinload(Task.assigner),
            selectinload(Task.question),
            selectinload(Task.assessment),
        )
        .where(Task.id == task_id)
    )
    task = result.scalar_one()

    return task_to_response(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a task."""
    result = await db.execute(
        select(Task).where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
