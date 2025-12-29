"""Organization schemas."""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class OrganizationBase(BaseModel):
    """Base organization schema."""

    name_en: str = Field(..., min_length=1, max_length=255)
    name_ar: str = Field(..., min_length=1, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)
    description_en: Optional[str] = Field(None, max_length=1000)
    description_ar: Optional[str] = Field(None, max_length=1000)
    logo_url: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=255)


class OrganizationCreate(OrganizationBase):
    """Schema for creating an organization."""

    pass


class OrganizationUpdate(BaseModel):
    """Schema for updating an organization."""

    name_en: Optional[str] = Field(None, min_length=1, max_length=255)
    name_ar: Optional[str] = Field(None, min_length=1, max_length=255)
    sector: Optional[str] = Field(None, max_length=100)
    description_en: Optional[str] = Field(None, max_length=1000)
    description_ar: Optional[str] = Field(None, max_length=1000)
    logo_url: Optional[str] = Field(None, max_length=500)
    website: Optional[str] = Field(None, max_length=255)


class OrganizationResponse(OrganizationBase):
    """Schema for organization response."""

    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrganizationList(BaseModel):
    """Schema for list of organizations."""

    items: list[OrganizationResponse]
    total: int
    page: int
    page_size: int
