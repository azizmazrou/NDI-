"""Assessment schemas."""
from datetime import datetime
from typing import Optional, Any, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.ndi import NDIQuestionWithLevels, NDIDomainResponse


class AssessmentCreate(BaseModel):
    """Schema for creating an assessment."""

    assessment_type: str = Field(default="maturity", pattern="^(maturity|compliance)$")
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    target_level: Optional[int] = Field(None, ge=0, le=5)
    created_by: Optional[UUID] = None


class AssessmentUpdate(BaseModel):
    """Schema for updating an assessment."""

    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|in_progress|completed|archived)$")
    target_level: Optional[int] = Field(None, ge=0, le=5)


class AssessmentResponseCreate(BaseModel):
    """Schema for creating an assessment response."""

    question_id: UUID
    selected_level: Optional[int] = Field(None, ge=0, le=5)
    justification: Optional[str] = None
    notes: Optional[str] = None


class AssessmentResponseUpdate(BaseModel):
    """Schema for updating an assessment response."""

    selected_level: Optional[int] = Field(None, ge=0, le=5)
    justification: Optional[str] = None
    notes: Optional[str] = None


class EvidenceSummary(BaseModel):
    """Summary of evidence attached to a response."""

    id: UUID
    file_name: str
    file_type: Optional[str] = None
    analysis_status: Optional[str] = None
    supports_level: Optional[str] = None

    class Config:
        from_attributes = True


class AssessmentResponseDetail(BaseModel):
    """Schema for assessment response detail."""

    id: UUID
    assessment_id: UUID
    question_id: UUID
    selected_level: Optional[int] = None
    justification: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    question: Optional[NDIQuestionWithLevels] = None
    evidence: list[EvidenceSummary] = []

    class Config:
        from_attributes = True


class AssessmentResponse(BaseModel):
    """Schema for assessment response."""

    id: UUID
    assessment_type: str
    status: str
    name: Optional[str] = None
    description: Optional[str] = None
    target_level: Optional[int] = None
    current_score: Optional[float] = None
    maturity_score: Optional[float] = None
    compliance_score: Optional[float] = None
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    responses_count: int = 0
    progress_percentage: float = 0.0

    class Config:
        from_attributes = True


class AssessmentList(BaseModel):
    """Schema for list of assessments."""

    items: list[AssessmentResponse]
    total: int
    page: int
    page_size: int


class DomainScore(BaseModel):
    """Schema for domain score in report."""

    domain: NDIDomainResponse
    average_score: float
    questions_answered: int
    total_questions: int
    level_name_en: str
    level_name_ar: str


class AssessmentReport(BaseModel):
    """Schema for assessment report."""

    assessment: AssessmentResponse
    overall_score: float
    overall_level: int
    overall_level_name_en: str
    overall_level_name_ar: str
    domain_scores: list[DomainScore]
    responses: list[AssessmentResponseDetail]
    gaps: list[dict[str, Any]] = []
    recommendations: list[dict[str, Any]] = []
    generated_at: datetime
