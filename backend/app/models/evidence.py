"""Evidence model."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.assessment import AssessmentResponse


class Evidence(Base):
    """Evidence / الشاهد model."""

    __tablename__ = "evidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    response_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("assessment_responses.id"), nullable=False
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extracted_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    analysis_status: Mapped[str | None] = mapped_column(
        String(20), default="pending"
    )  # pending, processing, completed, failed
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    analyzed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    response: Mapped["AssessmentResponse"] = relationship(
        "AssessmentResponse", back_populates="evidence"
    )

    def __repr__(self) -> str:
        return f"<Evidence(id={self.id}, file_name={self.file_name})>"
