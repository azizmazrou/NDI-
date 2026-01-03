"""
Settings Schemas - مخططات الإعدادات
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class SettingCategory(str, Enum):
    AI_PROVIDER = "ai_provider"
    STORAGE = "storage"
    NOTIFICATION = "notification"
    GENERAL = "general"


# =============================================================================
# Setting Schemas
# =============================================================================

class SettingBase(BaseModel):
    key: str
    value: Optional[str] = None
    category: SettingCategory = SettingCategory.GENERAL
    is_secret: bool = False
    description_en: Optional[str] = None
    description_ar: Optional[str] = None


class SettingCreate(SettingBase):
    pass


class SettingUpdate(BaseModel):
    value: Optional[str] = None
    description_en: Optional[str] = None
    description_ar: Optional[str] = None


class SettingResponse(SettingBase):
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# AI Provider Schemas
# =============================================================================

class AIProviderBase(BaseModel):
    id: str = Field(..., description="Provider ID (openai, claude, gemini, azure)")
    name_en: str
    name_ar: str
    api_endpoint: Optional[str] = None
    model_name: Optional[str] = None
    is_enabled: bool = False
    is_default: bool = False


class AIProviderCreate(AIProviderBase):
    api_key: Optional[str] = None


class AIProviderUpdate(BaseModel):
    api_key: Optional[str] = None
    api_endpoint: Optional[str] = None
    model_name: Optional[str] = None
    is_enabled: Optional[bool] = None
    is_default: Optional[bool] = None


class AIProviderResponse(AIProviderBase):
    has_api_key: bool = Field(..., description="Whether API key is configured")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIProviderListResponse(BaseModel):
    providers: List[AIProviderResponse]


# =============================================================================
# Settings Page Response
# =============================================================================

class SettingsPageResponse(BaseModel):
    ai_providers: List[AIProviderResponse]
    settings: List[SettingResponse]


# =============================================================================
# Test Connection Request/Response
# =============================================================================

class TestConnectionRequest(BaseModel):
    provider_id: str
    api_key: Optional[str] = None  # If not provided, use stored key


class TestConnectionResponse(BaseModel):
    success: bool
    message: str
    provider_id: str
