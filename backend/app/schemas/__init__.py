"""Pydantic schemas."""
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationList,
)
from app.schemas.ndi import (
    NDIDomainResponse,
    NDIQuestionResponse,
    NDIMaturityLevelResponse,
    NDISpecificationResponse,
    NDIDomainList,
    NDIQuestionWithLevels,
)
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentList,
    AssessmentResponseCreate,
    AssessmentResponseUpdate,
    AssessmentResponseDetail,
    AssessmentReport,
)
from app.schemas.evidence import (
    EvidenceCreate,
    EvidenceResponse,
    EvidenceAnalysis,
)
from app.schemas.ai import (
    EvidenceAnalyzeRequest,
    EvidenceAnalyzeResponse,
    GapAnalysisRequest,
    GapAnalysisResponse,
    RecommendationRequest,
    RecommendationResponse,
    ChatRequest,
    ChatResponse,
)

__all__ = [
    # Organization
    "OrganizationCreate",
    "OrganizationUpdate",
    "OrganizationResponse",
    "OrganizationList",
    # NDI
    "NDIDomainResponse",
    "NDIQuestionResponse",
    "NDIMaturityLevelResponse",
    "NDISpecificationResponse",
    "NDIDomainList",
    "NDIQuestionWithLevels",
    # Assessment
    "AssessmentCreate",
    "AssessmentUpdate",
    "AssessmentResponse",
    "AssessmentList",
    "AssessmentResponseCreate",
    "AssessmentResponseUpdate",
    "AssessmentResponseDetail",
    "AssessmentReport",
    # Evidence
    "EvidenceCreate",
    "EvidenceResponse",
    "EvidenceAnalysis",
    # AI
    "EvidenceAnalyzeRequest",
    "EvidenceAnalyzeResponse",
    "GapAnalysisRequest",
    "GapAnalysisResponse",
    "RecommendationRequest",
    "RecommendationResponse",
    "ChatRequest",
    "ChatResponse",
]
