"""AI service for gap analysis and recommendations."""
from typing import Optional, Any
from uuid import UUID
import uuid as uuid_lib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from cryptography.fernet import Fernet
import os

from app.models.assessment import Assessment, AssessmentResponse as AssessmentResponseModel
from app.models.ndi import NDIDomain, NDIQuestion
from app.models.settings import AIProviderConfig, SystemPrompt
from app.schemas.ai import (
    GapAnalysisResponse,
    GapItem,
    RecommendationResponse,
    Recommendation,
    ChatMessage,
    ChatResponse,
)
from app.config import settings
from app.services.rag_service import RAGService


# Encryption key for decrypting stored API keys - MUST match settings.py
_DEFAULT_KEY = "dGhpc19pc19hX2RlZmF1bHRfa2V5X2Zvcl9kZXY="
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", None)

if ENCRYPTION_KEY:
    _fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)
else:
    import hashlib
    import base64
    key_bytes = hashlib.sha256(_DEFAULT_KEY.encode()).digest()
    stable_key = base64.urlsafe_b64encode(key_bytes)
    _fernet = Fernet(stable_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt stored API key."""
    if not encrypted_key:
        return ""
    try:
        return _fernet.decrypt(encrypted_key.encode()).decode()
    except Exception:
        return ""


async def get_active_ai_provider(db: AsyncSession) -> Optional[dict]:
    """Get the active/default AI provider configuration from database."""
    # First try to get the default provider
    result = await db.execute(
        select(AIProviderConfig)
        .where(AIProviderConfig.is_default == True)
        .where(AIProviderConfig.is_enabled == True)
    )
    provider = result.scalar_one_or_none()

    # If no default, get any enabled provider
    if not provider:
        result = await db.execute(
            select(AIProviderConfig)
            .where(AIProviderConfig.is_enabled == True)
            .where(AIProviderConfig.api_key.isnot(None))
        )
        provider = result.scalar_one_or_none()

    if not provider or not provider.api_key:
        return None

    return {
        "id": provider.id,
        "name": provider.name_en,
        "api_key": decrypt_api_key(provider.api_key),
        "api_endpoint": provider.api_endpoint,
        "model_name": provider.model_name,
    }


class AIService:
    """Service for AI-powered analysis."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.rag_service = RAGService(db)

    async def gap_analysis(
        self,
        assessment_id: UUID,
        target_level: int = 3,
        domain_code: Optional[str] = None,
        language: str = "ar",
    ) -> GapAnalysisResponse:
        """Perform gap analysis on assessment."""
        # Get assessment responses
        query = (
            select(AssessmentResponseModel)
            .options(
                selectinload(AssessmentResponseModel.question)
                .selectinload(NDIQuestion.domain)
            )
            .where(AssessmentResponseModel.assessment_id == assessment_id)
            .where(AssessmentResponseModel.selected_level.isnot(None))
        )

        if domain_code:
            domain_result = await self.db.execute(
                select(NDIDomain).where(NDIDomain.code == domain_code.upper())
            )
            domain = domain_result.scalar_one_or_none()
            if domain:
                query = query.join(NDIQuestion).where(NDIQuestion.domain_id == domain.id)

        result = await self.db.execute(query)
        responses = result.scalars().all()

        gaps = []
        total_gap = 0
        gap_count = 0

        for response in responses:
            if response.selected_level < target_level:
                gap = target_level - response.selected_level
                total_gap += gap
                gap_count += 1

                question = response.question
                domain = question.domain if question else None

                # Determine priority based on gap size
                if gap >= 3:
                    priority = "high"
                elif gap >= 2:
                    priority = "medium"
                else:
                    priority = "low"

                actions = self._get_actions_for_gap(response.selected_level, target_level, language)
                recommendation = ", ".join(actions) if actions else ""

                gaps.append(
                    GapItem(
                        domain_code=domain.code if domain else "N/A",
                        domain_name=domain.name_ar if language == "ar" and domain else (domain.name_en if domain else "N/A"),
                        question_code=question.code if question else "N/A",
                        question=question.question_ar if language == "ar" and question else (question.question_en if question else "N/A"),
                        current_level=response.selected_level,
                        target_level=target_level,
                        gap=gap,
                        actions_required=actions,
                        priority=priority,
                        recommendation=recommendation,
                    )
                )

        # Sort by priority and gap size
        priority_order = {"high": 0, "medium": 1, "low": 2}
        gaps.sort(key=lambda x: (priority_order[x.priority], -x.gap))

        overall_gap = total_gap / gap_count if gap_count > 0 else 0
        high_priority_count = sum(1 for g in gaps if g.priority == "high")

        # Generate summary
        if language == "ar":
            summary = f"تم تحديد {len(gaps)} فجوة تحتاج للمعالجة للوصول للمستوى {target_level}. متوسط الفجوة: {overall_gap:.2f}"
            quick_wins = [g.question for g in gaps if g.priority == "low"][:3]
            critical = [g.question for g in gaps if g.priority == "high"][:3]
        else:
            summary = f"Identified {len(gaps)} gaps to address to reach level {target_level}. Average gap: {overall_gap:.2f}"
            quick_wins = [g.question for g in gaps if g.priority == "low"][:3]
            critical = [g.question for g in gaps if g.priority == "high"][:3]

        return GapAnalysisResponse(
            status="success",
            assessment_id=assessment_id,
            target_level=target_level,
            overall_gap=overall_gap,
            total_gaps=len(gaps),
            high_priority_gaps=high_priority_count,
            gaps=gaps,
            summary=summary,
            quick_wins=quick_wins,
            critical_actions=critical,
        )

    def _get_actions_for_gap(
        self, current_level: int, target_level: int, language: str
    ) -> list[str]:
        """Get recommended actions to close the gap."""
        actions_ar = {
            (0, 1): ["توثيق العمليات الحالية", "تحديد المسؤوليات"],
            (0, 2): ["توثيق العمليات", "تحديد الأدوار والمسؤوليات", "وضع سياسات أولية"],
            (0, 3): ["توثيق كامل", "تدريب الموظفين", "تفعيل العمليات", "قياس الأداء"],
            (1, 2): ["توثيق السياسات", "تحديد الإجراءات"],
            (1, 3): ["توثيق السياسات", "تدريب الموظفين", "تفعيل العمليات"],
            (2, 3): ["تفعيل العمليات", "قياس الأداء"],
            (2, 4): ["تفعيل العمليات", "قياس الأداء", "التحسين المستمر"],
            (3, 4): ["قياس الأداء", "التحسين المستمر", "الأتمتة"],
            (3, 5): ["التحسين المستمر", "الأتمتة", "الابتكار"],
            (4, 5): ["الابتكار", "القيادة في المجال"],
        }

        actions_en = {
            (0, 1): ["Document current processes", "Define responsibilities"],
            (0, 2): ["Document processes", "Define roles", "Establish initial policies"],
            (0, 3): ["Full documentation", "Train staff", "Activate processes", "Measure performance"],
            (1, 2): ["Document policies", "Define procedures"],
            (1, 3): ["Document policies", "Train staff", "Activate processes"],
            (2, 3): ["Activate processes", "Measure performance"],
            (2, 4): ["Activate processes", "Measure performance", "Continuous improvement"],
            (3, 4): ["Measure performance", "Continuous improvement", "Automation"],
            (3, 5): ["Continuous improvement", "Automation", "Innovation"],
            (4, 5): ["Innovation", "Industry leadership"],
        }

        actions = actions_ar if language == "ar" else actions_en
        key = (current_level, target_level)

        # Find closest match
        for (start, end), acts in actions.items():
            if start <= current_level < end <= target_level:
                return acts

        if language == "ar":
            return ["تحليل الفجوة وتحديد الإجراءات المطلوبة"]
        return ["Analyze gap and determine required actions"]

    async def get_recommendations(
        self,
        assessment_id: UUID,
        focus_areas: Optional[list[str]] = None,
        language: str = "ar",
    ) -> RecommendationResponse:
        """Get AI-powered recommendations."""
        # Perform gap analysis first
        gap_analysis = await self.gap_analysis(assessment_id, language=language)

        recommendations = []
        for i, gap in enumerate(gap_analysis.gaps[:10]):  # Top 10 gaps
            # Determine effort based on gap size
            if gap.gap >= 3:
                effort = "high"
                effort_level = "عالي" if language == "ar" else "High"
            elif gap.gap >= 2:
                effort = "medium"
                effort_level = "متوسط" if language == "ar" else "Medium"
            else:
                effort = "low"
                effort_level = "منخفض" if language == "ar" else "Low"

            impact = "high" if gap.priority == "high" else "medium"
            expected_impact = "عالي" if language == "ar" and impact == "high" else (
                "High" if impact == "high" else ("متوسط" if language == "ar" else "Medium")
            )

            recommendations.append(
                Recommendation(
                    id=f"rec_{i+1}",
                    domain_code=gap.domain_code,
                    title=gap.question[:100],
                    description=f"{'الانتقال من المستوى' if language == 'ar' else 'Move from level'} {gap.current_level} {'إلى' if language == 'ar' else 'to'} {gap.target_level}",
                    priority=gap.priority,
                    effort=effort,
                    effort_level=effort_level,
                    impact=impact,
                    expected_impact=expected_impact,
                    prerequisites=gap.actions_required[:2] if len(gap.actions_required) > 2 else [],
                    expected_outcome=gap.actions_required[-1] if gap.actions_required else "",
                    steps=gap.actions_required,
                )
            )

        if language == "ar":
            roadmap = f"خطة تحسين مكونة من {len(recommendations)} توصية لتحقيق المستوى المستهدف"
        else:
            roadmap = f"Improvement plan with {len(recommendations)} recommendations to achieve target level"

        return RecommendationResponse(
            status="success",
            assessment_id=assessment_id,
            total_recommendations=len(recommendations),
            recommendations=recommendations,
            roadmap_summary=roadmap,
        )

    async def chat(
        self,
        messages: list[ChatMessage],
        context: Optional[dict[str, Any]] = None,
        language: str = "ar",
    ) -> ChatResponse:
        """Chat with AI about NDI using RAG."""
        # Get last user message
        user_message = next(
            (m.content for m in reversed(messages) if m.role == "user"),
            "",
        )

        if not user_message:
            return ChatResponse(
                message="لم يتم تقديم سؤال" if language == "ar" else "No question provided",
                sources=[],
                suggested_actions=[],
            )

        # Use RAG to get relevant context
        rag_results = await self.rag_service.retrieve(user_message, language=language)

        # Get AI provider from database
        ai_provider = await get_active_ai_provider(self.db)

        # Build response using AI
        if ai_provider and ai_provider.get("api_key"):
            response = await self._generate_chat_response(
                user_message, rag_results, context, language, ai_provider
            )
        else:
            # Fallback response without AI
            if language == "ar":
                response = "للحصول على إجابات مفصلة، يرجى تكوين مفاتيح API للذكاء الاصطناعي في الإعدادات."
            else:
                response = "For detailed answers, please configure AI API keys in Settings."

        return ChatResponse(
            message=response,
            sources=rag_results.get("sources", []),
            suggested_actions=rag_results.get("suggested_actions", []),
        )

    async def _generate_chat_response(
        self,
        question: str,
        rag_results: dict,
        context: Optional[dict],
        language: str,
        ai_provider: dict,
    ) -> str:
        """Generate chat response using AI provider from database."""
        context_text = rag_results.get("context", "")
        provider_id = ai_provider.get("id", "")
        api_key = ai_provider.get("api_key", "")
        model_name = ai_provider.get("model_name", "")
        api_endpoint = ai_provider.get("api_endpoint", "")

        # Try to get prompt from database
        prompt_result = await self.db.execute(
            select(SystemPrompt).where(SystemPrompt.id == "chat_assistant").where(SystemPrompt.is_active == True)
        )
        prompt_record = prompt_result.scalar_one_or_none()

        if prompt_record:
            system_prompt = prompt_record.prompt_template.format(
                context_text=context_text,
                language='Arabic' if language == 'ar' else 'English'
            )
        else:
            # Fallback default prompt
            system_prompt = f"""You are an expert assistant for the National Data Index (NDI) compliance system.
Available context:
{context_text}

Answer in {'Arabic' if language == 'ar' else 'English'} concisely and helpfully."""

        try:
            if provider_id == "gemini":
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(model_name or "gemini-pro")

                prompt = f"""{system_prompt}

User question: {question}"""
                response = model.generate_content(prompt)
                return response.text

            elif provider_id == "openai":
                from openai import AsyncOpenAI
                client = AsyncOpenAI(api_key=api_key)

                response = await client.chat.completions.create(
                    model=model_name or "gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                )
                return response.choices[0].message.content

            elif provider_id == "claude":
                import anthropic
                client = anthropic.AsyncAnthropic(api_key=api_key)

                response = await client.messages.create(
                    model=model_name or "claude-3-opus-20240229",
                    max_tokens=1024,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": question},
                    ],
                )
                return response.content[0].text

            elif provider_id == "azure":
                from openai import AsyncAzureOpenAI
                client = AsyncAzureOpenAI(
                    api_key=api_key,
                    api_version="2024-02-15-preview",
                    azure_endpoint=api_endpoint,
                )

                response = await client.chat.completions.create(
                    model=model_name or "gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": question},
                    ],
                )
                return response.choices[0].message.content

            else:
                return "Unknown AI provider configured"

        except Exception as e:
            error_msg = str(e)
            if language == "ar":
                return f"حدث خطأ في معالجة الطلب: {error_msg}"
            return f"Error processing request: {error_msg}"
