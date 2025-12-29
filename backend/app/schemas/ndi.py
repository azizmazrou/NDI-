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
    is_oe_domain: bool = False
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


class NDIMaturityLevelResponse(BaseModel):
    """Schema for maturity level response."""

    id: UUID
    question_id: UUID
    level: int
    name_en: str
    name_ar: str
    description_en: str
    description_ar: str
    acceptance_evidence_en: Optional[list[str]] = None
    acceptance_evidence_ar: Optional[list[str]] = None
    related_specifications: Optional[list[str]] = None

    class Config:
        from_attributes = True


class NDIQuestionBase(BaseModel):
    """Base NDI question schema."""

    code: str = Field(..., max_length=20)
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


class NDISpecificationBase(BaseModel):
    """Base NDI specification schema."""

    code: str = Field(..., max_length=20)
    title_en: str = Field(..., max_length=500)
    title_ar: str = Field(..., max_length=500)
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
    maturity_level: Optional[int] = None
    sort_order: int = 0


class NDISpecificationResponse(NDISpecificationBase):
    """Schema for NDI specification response."""

    id: UUID
    domain_id: UUID

    class Config:
        from_attributes = True


class NDISpecificationList(BaseModel):
    """Schema for list of specifications."""

    items: list[NDISpecificationResponse]
    total: int


class NDIDomainWithQuestions(NDIDomainResponse):
    """Schema for domain with questions."""

    questions: list[NDIQuestionWithLevels] = []
    specifications: list[NDISpecificationResponse] = []
