"""Evidence schemas."""
from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field


class EvidenceCreate(BaseModel):
    """Schema for creating evidence."""

    response_id: UUID
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_type: Optional[str] = Field(None, max_length=50)
    file_size: Optional[int] = None
    mime_type: Optional[str] = Field(None, max_length=100)


class EvidenceResponse(BaseModel):
    """Schema for evidence response."""

    id: UUID
    response_id: UUID
    file_name: str
    file_path: str
    file_type: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    extracted_text: Optional[str] = None
    ai_analysis: Optional[dict[str, Any]] = None
    analysis_status: Optional[str] = None
    uploaded_at: datetime
    analyzed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvidenceAnalysis(BaseModel):
    """Schema for evidence analysis result."""

    supports_level: str = Field(..., pattern="^(yes|partial|no)$")
    covered_criteria: list[str] = []
    missing_criteria: list[str] = []
    confidence_score: float = Field(..., ge=0, le=1)
    recommendations: list[str] = []
    summary_en: Optional[str] = None
    summary_ar: Optional[str] = None
