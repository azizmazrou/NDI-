"""RAG (Retrieval Augmented Generation) service."""
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.embedding import Embedding
from app.models.ndi import NDIDomain, NDIQuestion, NDIMaturityLevel, NDIAcceptanceEvidence
from app.config import settings


class RAGService:
    """Service for RAG operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve(
        self,
        query: str,
        language: str = "ar",
        top_k: int = 5,
    ) -> dict[str, Any]:
        """Retrieve relevant context for a query."""
        # If embeddings are configured, use vector search
        if settings.openai_api_key or settings.google_api_key:
            return await self._vector_search(query, language, top_k)
        else:
            # Fallback to keyword search
            return await self._keyword_search(query, language, top_k)

    async def _vector_search(
        self,
        query: str,
        language: str,
        top_k: int,
    ) -> dict[str, Any]:
        """Perform vector similarity search."""
        # Get embedding for query
        query_embedding = await self._get_embedding(query)

        if query_embedding is None:
            return await self._keyword_search(query, language, top_k)

        # Search in embeddings table
        embedding_col = "embedding_ar" if language == "ar" else "embedding_en"
        content_col = "content_ar" if language == "ar" else "content_en"

        # Use pgvector similarity search
        query_sql = text(f"""
            SELECT id, source_type, source_id, {content_col} as content, metadata,
                   1 - ({embedding_col} <=> :embedding::vector) as similarity
            FROM embeddings
            WHERE {embedding_col} IS NOT NULL
            ORDER BY {embedding_col} <=> :embedding::vector
            LIMIT :limit
        """)

        result = await self.db.execute(
            query_sql,
            {"embedding": str(query_embedding), "limit": top_k},
        )
        rows = result.fetchall()

        sources = []
        context_parts = []

        for row in rows:
            sources.append({
                "type": row.source_type,
                "id": str(row.source_id),
                "content": row.content,
                "similarity": row.similarity,
                "metadata": row.extra_metadata,
            })
            if row.content:
                context_parts.append(row.content)

        return {
            "context": "\n\n".join(context_parts),
            "sources": sources,
            "suggested_actions": [],
        }

    async def _keyword_search(
        self,
        query: str,
        language: str,
        top_k: int,
    ) -> dict[str, Any]:
        """Perform keyword-based search as fallback."""
        sources = []
        context_parts = []

        # Search in domains
        name_col = "name_ar" if language == "ar" else "name_en"
        desc_col = "description_ar" if language == "ar" else "description_en"

        domains_result = await self.db.execute(
            select(NDIDomain)
            .where(
                getattr(NDIDomain, name_col).ilike(f"%{query}%")
                | getattr(NDIDomain, desc_col).ilike(f"%{query}%")
            )
            .limit(top_k)
        )
        domains = domains_result.scalars().all()

        for domain in domains:
            content = f"{getattr(domain, name_col)}: {getattr(domain, desc_col) or ''}"
            sources.append({
                "type": "domain",
                "id": str(domain.id),
                "code": domain.code,
                "content": content,
            })
            context_parts.append(content)

        # Search in questions
        q_col = "question_ar" if language == "ar" else "question_en"

        questions_result = await self.db.execute(
            select(NDIQuestion)
            .where(getattr(NDIQuestion, q_col).ilike(f"%{query}%"))
            .limit(top_k)
        )
        questions = questions_result.scalars().all()

        for question in questions:
            content = f"[{question.code}] {getattr(question, q_col)}"
            sources.append({
                "type": "question",
                "id": str(question.id),
                "code": question.code,
                "content": content,
            })
            context_parts.append(content)

        # Search in acceptance evidence with specification codes
        text_col = "text_ar" if language == "ar" else "text_en"

        evidence_result = await self.db.execute(
            select(NDIAcceptanceEvidence)
            .where(NDIAcceptanceEvidence.specification_code.isnot(None))
            .where(getattr(NDIAcceptanceEvidence, text_col).ilike(f"%{query}%"))
            .limit(top_k)
        )
        evidences = evidence_result.scalars().all()

        for ev in evidences:
            content = f"[{ev.specification_code}] {getattr(ev, text_col)}"
            sources.append({
                "type": "specification",
                "id": str(ev.id),
                "code": ev.specification_code,
                "content": content,
            })
            context_parts.append(content)

        return {
            "context": "\n\n".join(context_parts),
            "sources": sources,
            "suggested_actions": [],
        }

    async def _get_embedding(self, text: str) -> Optional[list[float]]:
        """Get embedding for text using configured provider."""
        if settings.openai_api_key:
            return await self._get_openai_embedding(text)
        elif settings.google_api_key:
            return await self._get_google_embedding(text)
        return None

    async def _get_openai_embedding(self, text: str) -> Optional[list[float]]:
        """Get embedding using OpenAI."""
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.openai_api_key)

            response = await client.embeddings.create(
                model=settings.embedding_model,
                input=text,
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"OpenAI embedding error: {e}")
            return None

    async def _get_google_embedding(self, text: str) -> Optional[list[float]]:
        """Get embedding using Google."""
        try:
            import google.generativeai as genai
            genai.configure(api_key=settings.google_api_key)

            result = genai.embed_content(
                model="models/embedding-001",
                content=text,
            )
            return result["embedding"]
        except Exception as e:
            print(f"Google embedding error: {e}")
            return None

    async def index_ndi_data(self) -> int:
        """Index all NDI data for RAG."""
        count = 0

        # Index domains
        domains_result = await self.db.execute(select(NDIDomain))
        domains = domains_result.scalars().all()

        for domain in domains:
            await self._index_item(
                source_type="domain",
                source_id=domain.id,
                content_en=f"{domain.name_en}: {domain.description_en or ''}",
                content_ar=f"{domain.name_ar}: {domain.description_ar or ''}",
                metadata={"code": domain.code},
            )
            count += 1

        # Index questions
        questions_result = await self.db.execute(
            select(NDIQuestion).options()
        )
        questions = questions_result.scalars().all()

        for question in questions:
            await self._index_item(
                source_type="question",
                source_id=question.id,
                content_en=f"[{question.code}] {question.question_en}",
                content_ar=f"[{question.code}] {question.question_ar}",
                metadata={"code": question.code, "domain_id": str(question.domain_id)},
            )
            count += 1

        # Index maturity levels
        levels_result = await self.db.execute(select(NDIMaturityLevel))
        levels = levels_result.scalars().all()

        for level in levels:
            await self._index_item(
                source_type="level",
                source_id=level.id,
                content_en=f"Level {level.level} - {level.name_en}: {level.description_en}",
                content_ar=f"المستوى {level.level} - {level.name_ar}: {level.description_ar}",
                metadata={
                    "level": level.level,
                    "question_id": str(level.question_id),
                },
            )
            count += 1

        # Index acceptance evidence with specification codes
        evidence_result = await self.db.execute(
            select(NDIAcceptanceEvidence)
            .where(NDIAcceptanceEvidence.specification_code.isnot(None))
        )
        evidences = evidence_result.scalars().all()

        for ev in evidences:
            await self._index_item(
                source_type="specification",
                source_id=ev.id,
                content_en=f"[{ev.specification_code}] {ev.text_en}",
                content_ar=f"[{ev.specification_code}] {ev.text_ar}",
                metadata={
                    "code": ev.specification_code,
                    "maturity_level_id": str(ev.maturity_level_id),
                    "evidence_id": ev.evidence_id,
                },
            )
            count += 1

        await self.db.commit()
        return count

    async def _index_item(
        self,
        source_type: str,
        source_id: UUID,
        content_en: str,
        content_ar: str,
        metadata: dict,
    ) -> None:
        """Index a single item."""
        # Check if already exists
        existing = await self.db.execute(
            select(Embedding)
            .where(Embedding.source_type == source_type)
            .where(Embedding.source_id == source_id)
        )
        embedding = existing.scalar_one_or_none()

        # Get embeddings
        embedding_en = await self._get_embedding(content_en)
        embedding_ar = await self._get_embedding(content_ar)

        if embedding:
            # Update existing
            embedding.content_en = content_en
            embedding.content_ar = content_ar
            if embedding_en:
                embedding.embedding_en = embedding_en
            if embedding_ar:
                embedding.embedding_ar = embedding_ar
            embedding.extra_metadata = metadata
        else:
            # Create new
            new_embedding = Embedding(
                source_type=source_type,
                source_id=source_id,
                content_en=content_en,
                content_ar=content_ar,
                embedding_en=embedding_en,
                embedding_ar=embedding_ar,
                extra_metadata=metadata,
            )
            self.db.add(new_embedding)
