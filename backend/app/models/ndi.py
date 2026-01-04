"""NDI (National Data Index) models."""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.assessment import AssessmentResponse
    from app.models.task import Task


class NDIDomain(Base):
    """NDI Domain / مجال model."""

    __tablename__ = "ndi_domains"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name_en: Mapped[str] = mapped_column(String(255), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(255), nullable=False)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    question_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_oe_domain: Mapped[bool] = mapped_column(Boolean, default=False)  # Open Entity domain
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    questions: Mapped[List["NDIQuestion"]] = relationship(
        "NDIQuestion", back_populates="domain", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<NDIDomain(code={self.code}, name_en={self.name_en})>"


class NDIQuestion(Base):
    """NDI Question / سؤال النضج model."""

    __tablename__ = "ndi_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    domain_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_domains.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # e.g., DG.MQ.1
    question_en: Mapped[str] = mapped_column(Text, nullable=False)
    question_ar: Mapped[str] = mapped_column(Text, nullable=False)
    guidance_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    guidance_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    domain: Mapped["NDIDomain"] = relationship("NDIDomain", back_populates="questions")
    maturity_levels: Mapped[List["NDIMaturityLevel"]] = relationship(
        "NDIMaturityLevel", back_populates="question", cascade="all, delete-orphan",
        order_by="NDIMaturityLevel.level"
    )
    responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse", back_populates="question"
    )
    tasks: Mapped[List["Task"]] = relationship(
        "Task", back_populates="question"
    )

    def __repr__(self) -> str:
        return f"<NDIQuestion(code={self.code})>"


class NDIMaturityLevel(Base):
    """NDI Maturity Level / مستوى النضج model."""

    __tablename__ = "ndi_maturity_levels"
    __table_args__ = (
        UniqueConstraint("question_id", "level", name="uq_question_level"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_questions.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-5
    name_en: Mapped[str] = mapped_column(String(50), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(50), nullable=False)
    description_en: Mapped[str] = mapped_column(Text, nullable=False)
    description_ar: Mapped[str] = mapped_column(Text, nullable=False)

    # Relationships
    question: Mapped["NDIQuestion"] = relationship(
        "NDIQuestion", back_populates="maturity_levels"
    )
    acceptance_evidence: Mapped[List["NDIAcceptanceEvidence"]] = relationship(
        "NDIAcceptanceEvidence", back_populates="maturity_level",
        cascade="all, delete-orphan", order_by="NDIAcceptanceEvidence.evidence_id"
    )

    def __repr__(self) -> str:
        return f"<NDIMaturityLevel(question_id={self.question_id}, level={self.level})>"


class NDIAcceptanceEvidence(Base):
    """NDI Acceptance Evidence / معيار قبول - شاهد مطلوب model.

    Each evidence can optionally link to a specification code for compliance scoring.
    Evidence can inherit from a lower level.
    """

    __tablename__ = "ndi_acceptance_evidence"
    __table_args__ = (
        UniqueConstraint("maturity_level_id", "evidence_id", name="uq_level_evidence"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    maturity_level_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_maturity_levels.id", ondelete="CASCADE"), nullable=False
    )
    evidence_id: Mapped[int] = mapped_column(Integer, nullable=False)  # Sequential: 1, 2, 3...
    text_en: Mapped[str] = mapped_column(Text, nullable=False)
    text_ar: Mapped[str] = mapped_column(Text, nullable=False)
    inherits_from_level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # If set, inherits from this level
    specification_code: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g., DG.1.1 for compliance
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    maturity_level: Mapped["NDIMaturityLevel"] = relationship(
        "NDIMaturityLevel", back_populates="acceptance_evidence"
    )

    def __repr__(self) -> str:
        return f"<NDIAcceptanceEvidence(level_id={self.maturity_level_id}, evidence_id={self.evidence_id}, spec={self.specification_code})>"
