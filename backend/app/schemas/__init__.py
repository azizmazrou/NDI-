"""Pydantic schemas."""
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
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskStatusUpdate,
    TaskResponse,
    TaskList,
    TaskStats,
)
from app.schemas.score import (
    MaturityScoreResult,
    ComplianceScoreResult,
    CombinedAssessmentResult,
    DomainScore,
    DashboardStats,
)

__all__ = [
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
    # Tasks
    "TaskCreate",
    "TaskUpdate",
    "TaskStatusUpdate",
    "TaskResponse",
    "TaskList",
    "TaskStats",
    # Scores
    "MaturityScoreResult",
    "ComplianceScoreResult",
    "CombinedAssessmentResult",
    "DomainScore",
    "DashboardStats",
]
