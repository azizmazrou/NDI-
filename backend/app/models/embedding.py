"""Embedding model for RAG."""
import uuid
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.config import settings


class Embedding(Base):
    """Embedding for RAG / التضمين للـ RAG model."""

    __tablename__ = "embeddings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    source_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'question', 'level', 'specification', 'domain'
    source_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    content_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    content_ar: Mapped[str | None] = mapped_column(Text, nullable=True)
    embedding_en = mapped_column(Vector(settings.embedding_dimension), nullable=True)
    embedding_ar = mapped_column(Vector(settings.embedding_dimension), nullable=True)
    metadata: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)

    def __repr__(self) -> str:
        return f"<Embedding(id={self.id}, source_type={self.source_type})>"
