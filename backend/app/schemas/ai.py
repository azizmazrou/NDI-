"""AI-related schemas."""
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field


class EvidenceAnalyzeRequest(BaseModel):
    """Request for analyzing evidence."""

    evidence_id: UUID
    question_code: str
    selected_level: int = Field(..., ge=0, le=5)
    language: str = Field(default="ar", pattern="^(ar|en)$")


class EvidenceAnalyzeResponse(BaseModel):
    """Response from evidence analysis."""

    evidence_id: UUID
    supports_level: str  # yes, partial, no
    covered_criteria: list[str]
    missing_criteria: list[str]
    confidence_score: float
    recommendations: list[str]
    summary: str
    analysis_details: Optional[dict[str, Any]] = None


class GapAnalysisRequest(BaseModel):
    """Request for gap analysis."""

    assessment_id: UUID
    target_level: int = Field(default=3, ge=1, le=5)
    domain_code: Optional[str] = None  # If None, analyze all domains
    language: str = Field(default="ar", pattern="^(ar|en)$")


class GapItem(BaseModel):
    """Single gap item."""

    domain_code: str
    domain_name: str
    question_code: str
    question: str
    current_level: int
    target_level: int
    gap: int
    actions_required: list[str] = []
    priority: str  # high, medium, low
    recommendation: str = ""  # Frontend expects this


class GapAnalysisResponse(BaseModel):
    """Response from gap analysis."""

    status: str = "success"  # Frontend expects this
    assessment_id: UUID
    target_level: int = 3  # Frontend expects this
    overall_gap: float
    total_gaps: int = 0  # Frontend expects this
    high_priority_gaps: int = 0  # Frontend expects this
    gaps: list[GapItem]
    summary: str
    quick_wins: list[str]
    critical_actions: list[str]


class RecommendationRequest(BaseModel):
    """Request for recommendations."""

    assessment_id: UUID
    focus_areas: Optional[list[str]] = None  # Domain codes
    language: str = Field(default="ar", pattern="^(ar|en)$")


class Recommendation(BaseModel):
    """Single recommendation."""

    id: str
    domain_code: str
    title: str
    description: str
    priority: str  # high, medium, low
    effort: str  # low, medium, high
    effort_level: str = ""  # Frontend expects this (duplicate of effort)
    impact: str  # low, medium, high
    expected_impact: str = ""  # Frontend expects this
    prerequisites: list[str] = []
    expected_outcome: str
    steps: list[str] = []  # Frontend expects this


class RecommendationResponse(BaseModel):
    """Response with recommendations."""

    status: str = "success"  # Frontend expects this
    assessment_id: UUID
    total_recommendations: int = 0  # Frontend expects this
    recommendations: list[Recommendation]
    roadmap_summary: str


class ChatMessage(BaseModel):
    """Chat message."""

    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    """Request for AI chat."""

    messages: list[ChatMessage]
    context: Optional[dict[str, Any]] = None  # Assessment context
    language: str = Field(default="ar", pattern="^(ar|en)$")


class ChatResponse(BaseModel):
    """Response from AI chat."""

    message: str
    sources: list[dict[str, Any]] = []  # RAG sources used
    suggested_actions: list[str] = []
