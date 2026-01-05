"""
Settings Model - نموذج الإعدادات
Stores application settings including API keys (encrypted)
"""

import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.database import Base


class SettingCategory(str, enum.Enum):
    """Setting categories"""
    AI_PROVIDER = "ai_provider"
    STORAGE = "storage"
    NOTIFICATION = "notification"
    GENERAL = "general"


class OrganizationSettings(Base):
    """
    Organization Settings - إعدادات الجهة الواحدة
    Single organization model (replaces multi-organization)
    """
    __tablename__ = "organization_settings"

    id: int = Column(Integer, primary_key=True, default=1)
    name_en: str = Column(String(255), nullable=False, default="Organization")
    name_ar: str = Column(String(255), nullable=False, default="الجهة")
    sector_en: str = Column(String(100), nullable=True)
    sector_ar: str = Column(String(100), nullable=True)
    description_en: str = Column(String(1000), nullable=True)
    description_ar: str = Column(String(1000), nullable=True)
    logo_url: str = Column(String(500), nullable=True)
    website: str = Column(String(255), nullable=True)
    address_en: str = Column(String(500), nullable=True)
    address_ar: str = Column(String(500), nullable=True)
    contact_email: str = Column(String(255), nullable=True)
    contact_phone: str = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<OrganizationSettings {self.name_en}>"


class Setting(Base):
    """
    Application Settings Model
    نموذج إعدادات التطبيق
    """
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)
    category = Column(SQLEnum(SettingCategory), default=SettingCategory.GENERAL)
    is_secret = Column(Boolean, default=False)  # If true, value is encrypted
    description_en = Column(String(500), nullable=True)
    description_ar = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Setting {self.key}>"


class AIProviderConfig(Base):
    """
    AI Provider Configuration
    إعدادات مزود الذكاء الاصطناعي
    """
    __tablename__ = "ai_provider_configs"

    id = Column(String(50), primary_key=True)  # e.g., "openai", "claude", "gemini", "azure"
    name_en = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=False)
    api_key = Column(Text, nullable=True)  # Encrypted
    api_endpoint = Column(String(500), nullable=True)  # For Azure or custom endpoints
    model_name = Column(String(100), nullable=True)  # e.g., "gpt-4", "claude-3-opus", "gemini-pro"
    is_enabled = Column(Boolean, default=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AIProviderConfig {self.id}>"


class SystemPrompt(Base):
    """
    System Prompts Configuration
    إعدادات نصوص الأوامر النظامية للذكاء الاصطناعي
    """
    __tablename__ = "system_prompts"

    id = Column(String(50), primary_key=True)  # e.g., "evidence_analysis", "chat", "evidence_structure"
    name_en = Column(String(100), nullable=False)
    name_ar = Column(String(100), nullable=False)
    description_en = Column(String(500), nullable=True)
    description_ar = Column(String(500), nullable=True)
    prompt_template = Column(Text, nullable=False)  # The actual prompt with placeholders
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<SystemPrompt {self.id}>"
