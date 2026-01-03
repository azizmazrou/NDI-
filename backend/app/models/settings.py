"""
Settings Model - نموذج الإعدادات
Stores application settings including API keys (encrypted)
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, Enum as SQLEnum
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
