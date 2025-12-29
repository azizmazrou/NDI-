"""Assessment models."""
import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.ndi import NDIQuestion
    from app.models.evidence import Evidence
    from app.models.user import User


class AssessmentType(str, Enum):
    """Assessment type enum."""
    MATURITY = "maturity"
    COMPLIANCE = "compliance"
    OE = "oe"  # Operational Excellence


class AssessmentStatus(str, Enum):
    """Assessment status enum."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Assessment(Base):
    """Assessment / التقييم model."""

    __tablename__ = "assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    assessment_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AssessmentType.MATURITY.value
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AssessmentStatus.DRAFT.value
    )
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_score: Mapped[float | None] = mapped_column(Integer, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    organization: Mapped["Organization"] = relationship(
        "Organization", back_populates="assessments"
    )
    responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse", back_populates="assessment", cascade="all, delete-orphan"
    )
    creator: Mapped[Optional["User"]] = relationship("User", back_populates="assessments")

    def __repr__(self) -> str:
        return f"<Assessment(id={self.id}, type={self.assessment_type}, status={self.status})>"


class AssessmentResponse(Base):
    """Assessment Response / إجابة التقييم model."""

    __tablename__ = "assessment_responses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    assessment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessments.id"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_questions.id"), nullable=False
    )
    selected_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    justification: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    assessment: Mapped["Assessment"] = relationship(
        "Assessment", back_populates="responses"
    )
    question: Mapped["NDIQuestion"] = relationship(
        "NDIQuestion", back_populates="responses"
    )
    evidence: Mapped[List["Evidence"]] = relationship(
        "Evidence", back_populates="response", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AssessmentResponse(id={self.id}, level={self.selected_level})>"
