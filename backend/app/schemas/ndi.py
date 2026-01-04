"""NDI schemas."""
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NDIDomainBase(BaseModel):
    """Base NDI domain schema."""

    code: str = Field(..., max_length=10)
    name_en: str = Field(..., max_length=255)
    name_ar: str = Field(..., max_length=255)
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    question_count: Optional[int] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_oe_domain: bool = False  # Open Entity domain (OD, FOI)
    sort_order: int = 0


class NDIDomainResponse(NDIDomainBase):
    """Schema for NDI domain response."""

    id: UUID

    class Config:
        from_attributes = True


class NDIDomainList(BaseModel):
    """Schema for list of domains."""

    items: list[NDIDomainResponse]
    total: int


class NDIAcceptanceEvidenceResponse(BaseModel):
    """Schema for acceptance evidence response."""

    id: UUID
    maturity_level_id: UUID
    evidence_id: int
    text_en: str
    text_ar: str
    inherits_from_level: Optional[int] = None
    specification_code: Optional[str] = None  # e.g., DG.1.1 - links to compliance
    sort_order: int = 0

    class Config:
        from_attributes = True


class NDIMaturityLevelResponse(BaseModel):
    """Schema for maturity level response."""

    id: UUID
    question_id: UUID
    level: int
    name_en: str
    name_ar: str
    description_en: Optional[str] = ""
    description_ar: Optional[str] = ""
    acceptance_evidence: Optional[list[NDIAcceptanceEvidenceResponse]] = None

    class Config:
        from_attributes = True


class NDIQuestionBase(BaseModel):
    """Base NDI question schema."""

    code: str = Field(..., max_length=20)  # e.g., DG.MQ.1
    question_en: str
    question_ar: str
    sort_order: int = 0


class NDIQuestionResponse(NDIQuestionBase):
    """Schema for NDI question response."""

    id: UUID
    domain_id: UUID

    class Config:
        from_attributes = True


class NDIQuestionWithLevels(NDIQuestionResponse):
    """Schema for question with maturity levels."""

    maturity_levels: list[NDIMaturityLevelResponse] = []
    domain: Optional[NDIDomainResponse] = None


class NDIDomainWithQuestions(NDIDomainResponse):
    """Schema for domain with questions."""

    questions: list[NDIQuestionWithLevels] = []
