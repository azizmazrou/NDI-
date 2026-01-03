"""Score schemas - مخططات الدرجات."""
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel, Field


class LevelInfo(BaseModel):
    """Maturity level information."""
    level: int
    name_en: str
    name_ar: str


class DomainScore(BaseModel):
    """Domain score details."""
    domain_code: str
    domain_name_en: str
    domain_name_ar: str
    score: float
    level: int
    level_name_en: str
    level_name_ar: str
    answered_count: int
    total_questions: int
    percentage: float


class MaturityScoreResult(BaseModel):
    """Maturity score calculation result."""
    overall_score: float = Field(..., ge=0, le=5)
    overall_level: int = Field(..., ge=0, le=5)
    overall_level_name_en: str
    overall_level_name_ar: str
    overall_percentage: float = Field(..., ge=0, le=100)
    domain_scores: List[DomainScore]
    answered_count: int
    total_questions: int


class SpecificationStatus(BaseModel):
    """Individual specification compliance status."""
    specification_code: str
    question_code: str
    evidence_id: int
    status: str  # compliant, non_compliant
    has_evidence: bool


class ComplianceScoreResult(BaseModel):
    """Compliance score calculation result."""
    compliant_count: int
    partial_count: int
    non_compliant_count: int
    total_specifications: int
    compliance_percentage: float = Field(..., ge=0, le=100)
    is_compliant: bool
    specifications_detail: Optional[List[SpecificationStatus]] = None


class QuestionDetail(BaseModel):
    """Question detail with scores."""
    question_code: str
    domain_code: str
    question_en: str
    question_ar: str
    selected_level: Optional[int] = None
    level_name_en: Optional[str] = None
    level_name_ar: Optional[str] = None
    required_evidence_count: int
    uploaded_evidence_count: int
    specifications_status: List[Dict[str, Any]]
    all_specs_compliant: bool


class CombinedAssessmentResult(BaseModel):
    """Combined maturity and compliance assessment result."""
    maturity: MaturityScoreResult
    compliance: ComplianceScoreResult
    question_details: Optional[List[QuestionDetail]] = None


class DashboardStats(BaseModel):
    """Dashboard statistics."""
    maturity: MaturityScoreResult
    compliance: ComplianceScoreResult
    progress: Dict[str, int]
    recent_activity: Optional[List[Dict[str, Any]]] = None


class AssessmentSummary(BaseModel):
    """Assessment summary for reports."""
    assessment_id: UUID
    generated_at: str
    language: str
    summary: Dict[str, Any]
    domain_details: List[DomainScore]
    compliance_details: Dict[str, int]
