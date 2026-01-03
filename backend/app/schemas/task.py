"""Task schemas - مخططات المهام."""
from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field


class TaskBase(BaseModel):
    """Base task schema."""
    title_en: str = Field(..., min_length=1, max_length=500)
    title_ar: str = Field(..., min_length=1, max_length=500)
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    priority: str = Field(default="medium")
    due_date: Optional[datetime] = None
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    """Task creation schema."""
    assessment_id: UUID
    question_id: Optional[UUID] = None
    assigned_to: UUID


class TaskUpdate(BaseModel):
    """Task update schema."""
    title_en: Optional[str] = Field(None, min_length=1, max_length=500)
    title_ar: Optional[str] = Field(None, min_length=1, max_length=500)
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class TaskStatusUpdate(BaseModel):
    """Task status update schema."""
    status: str = Field(..., pattern="^(pending|in_progress|completed|overdue)$")


class UserBrief(BaseModel):
    """Brief user info for task display."""
    id: UUID
    email: str
    name_en: Optional[str] = None
    name_ar: Optional[str] = None

    class Config:
        from_attributes = True


class QuestionBrief(BaseModel):
    """Brief question info for task display."""
    id: UUID
    code: str
    question_en: str
    question_ar: str

    class Config:
        from_attributes = True


class AssessmentBrief(BaseModel):
    """Brief assessment info for task display."""
    id: UUID
    name: Optional[str] = None
    assessment_type: str

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    """Task response schema."""
    id: UUID
    assessment_id: UUID
    question_id: Optional[UUID] = None
    assigned_to: UUID
    assigned_by: UUID
    title_en: str
    title_ar: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    # Related objects
    assignee: Optional[UserBrief] = None
    assigner: Optional[UserBrief] = None
    question: Optional[QuestionBrief] = None
    assessment: Optional[AssessmentBrief] = None

    class Config:
        from_attributes = True


class TaskList(BaseModel):
    """Task list with pagination."""
    items: List[TaskResponse]
    total: int
    page: int
    page_size: int


class TaskStats(BaseModel):
    """Task statistics."""
    total: int
    pending: int
    in_progress: int
    completed: int
    overdue: int
