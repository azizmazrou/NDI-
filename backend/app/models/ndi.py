"""NDI (National Data Index) models."""
import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.assessment import AssessmentResponse


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
    is_oe_domain: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    questions: Mapped[List["NDIQuestion"]] = relationship(
        "NDIQuestion", back_populates="domain", cascade="all, delete-orphan"
    )
    specifications: Mapped[List["NDISpecification"]] = relationship(
        "NDISpecification", back_populates="domain", cascade="all, delete-orphan"
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
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    question_en: Mapped[str] = mapped_column(Text, nullable=False)
    question_ar: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    domain: Mapped["NDIDomain"] = relationship("NDIDomain", back_populates="questions")
    maturity_levels: Mapped[List["NDIMaturityLevel"]] = relationship(
        "NDIMaturityLevel", back_populates="question", cascade="all, delete-orphan"
    )
    responses: Mapped[List["AssessmentResponse"]] = relationship(
        "AssessmentResponse", back_populates="question"
    )

    def __repr__(self) -> str:
        return f"<NDIQuestion(code={self.code})>"


class NDIMaturityLevel(Base):
    """NDI Maturity Level / مستوى النضج model."""

    __tablename__ = "ndi_maturity_levels"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_questions.id"), nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    name_en: Mapped[str] = mapped_column(String(50), nullable=False)
    name_ar: Mapped[str] = mapped_column(String(50), nullable=False)
    description_en: Mapped[str] = mapped_column(Text, nullable=False)
    description_ar: Mapped[str] = mapped_column(Text, nullable=False)
    acceptance_evidence_en: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    acceptance_evidence_ar: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    related_specifications: Mapped[list[str] | None] = mapped_column(
        ARRAY(String(20)), nullable=True
    )

    # Relationships
    question: Mapped["NDIQuestion"] = relationship(
        "NDIQuestion", back_populates="maturity_levels"
    )

    def __repr__(self) -> str:
        return f"<NDIMaturityLevel(question_id={self.question_id}, level={self.level})>"


class NDISpecification(Base):
    """NDI Compliance Specification / مواصفة الامتثال model."""

    __tablename__ = "ndi_specifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    domain_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("ndi_domains.id"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    title_en: Mapped[str] = mapped_column(String(500), nullable=False)
    title_ar: Mapped[str] = mapped_column(String(500), nullable=False)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    maturity_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    domain: Mapped["NDIDomain"] = relationship(
        "NDIDomain", back_populates="specifications"
    )

    def __repr__(self) -> str:
        return f"<NDISpecification(code={self.code})>"
