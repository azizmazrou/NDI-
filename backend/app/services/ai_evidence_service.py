"""AI Evidence Service - خدمة تحليل الشواهد بالذكاء الاصطناعي."""
import json
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import AssessmentResponse
from app.models.ndi import NDIQuestion, NDIMaturityLevel, NDIAcceptanceEvidence
from app.models.evidence import Evidence
from app.models.settings import SystemPrompt
from app.services.ai_service import get_active_ai_provider


async def get_system_prompt(db, prompt_id: str) -> Optional[str]:
    """Get a system prompt template from the database."""
    result = await db.execute(
        select(SystemPrompt).where(SystemPrompt.id == prompt_id).where(SystemPrompt.is_active == True)
    )
    prompt = result.scalar_one_or_none()
    return prompt.prompt_template if prompt else None


class AIEvidenceService:
    """خدمة تحليل ومراجعة الشواهد بالذكاء الاصطناعي."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._ai_provider = None  # Will be loaded from database

    async def _get_ai_provider(self) -> Optional[Dict]:
        """Get AI provider from database (cached)."""
        if self._ai_provider is None:
            self._ai_provider = await get_active_ai_provider(self.db)
        return self._ai_provider

    async def analyze_evidence(
        self,
        response_id: UUID,
        language: str = "ar",
    ) -> Dict[str, Any]:
        """تحليل الشواهد المرفقة لإجابة محددة."""
        try:
            ai_provider = await self._get_ai_provider()
            if not ai_provider or not ai_provider.get("api_key"):
                return {
                    "status": "error",
                    "message": "AI not configured. Please configure AI providers in Settings." if language == "en" else "الذكاء الاصطناعي غير مُعد. يرجى تكوين مزودي الذكاء الاصطناعي في الإعدادات.",
                }

            # Get response with evidence
            result = await self.db.execute(
                select(AssessmentResponse)
                .options(
                    selectinload(AssessmentResponse.evidence),
                    selectinload(AssessmentResponse.question)
                    .selectinload(NDIQuestion.maturity_levels)
                    .selectinload(NDIMaturityLevel.acceptance_evidence),
                )
                .where(AssessmentResponse.id == response_id)
            )
            response = result.scalar_one_or_none()

            if not response:
                return {
                    "status": "error",
                    "message": "Response not found" if language == "en" else "الإجابة غير موجودة",
                }

            if response.selected_level is None:
                return {
                    "status": "error",
                    "message": "No level selected" if language == "en" else "لم يتم اختيار مستوى",
                }

            # Get maturity level details
            maturity_level = None
            for ml in response.question.maturity_levels:
                if ml.level == response.selected_level:
                    maturity_level = ml
                    break

            if not maturity_level:
                return {
                    "status": "error",
                    "message": f"Maturity level {response.selected_level} not found" if language == "en" else f"مستوى النضج {response.selected_level} غير موجود",
                }

            # Get acceptance criteria
            acceptance_criteria = []
            for ev in maturity_level.acceptance_evidence:
                text = ev.text_ar if language == "ar" else ev.text_en
                acceptance_criteria.append({
                    "id": ev.evidence_id,
                    "text": text,
                })

            # Check if there's any evidence to analyze
            if not response.evidence:
                return {
                    "status": "success",
                    "response_id": str(response_id),
                    "question_code": response.question.code,
                    "selected_level": response.selected_level,
                    "acceptance_criteria": acceptance_criteria,
                    "evidence_analyses": [],
                    "coverage": {
                        "total_criteria": len(acceptance_criteria),
                        "covered_count": 0,
                        "coverage_percentage": 0.0,
                        "missing_criteria": acceptance_criteria,
                    },
                    "recommendations": self._generate_recommendations(acceptance_criteria, language),
                    "message": "No evidence uploaded yet" if language == "en" else "لم يتم رفع شواهد بعد",
                }

            # Analyze each evidence
            evidence_analyses = []
            for evidence in response.evidence:
                analysis = await self._analyze_single_evidence(
                    evidence,
                    acceptance_criteria,
                    language,
                )
                evidence_analyses.append(analysis)

            # Aggregate results
            total_criteria = len(acceptance_criteria)
            covered_criteria = set()
            for analysis in evidence_analyses:
                for criterion_id in analysis.get("covered_criteria_ids", []):
                    covered_criteria.add(criterion_id)

            coverage_percentage = (len(covered_criteria) / total_criteria * 100) if total_criteria > 0 else 0

            missing_criteria = [
                c for c in acceptance_criteria
                if c["id"] not in covered_criteria
            ]

            return {
                "status": "success",
                "response_id": str(response_id),
                "question_code": response.question.code,
                "selected_level": response.selected_level,
                "acceptance_criteria": acceptance_criteria,
                "evidence_analyses": evidence_analyses,
                "coverage": {
                    "total_criteria": total_criteria,
                    "covered_count": len(covered_criteria),
                    "coverage_percentage": round(coverage_percentage, 1),
                    "missing_criteria": missing_criteria,
                },
                "recommendations": self._generate_recommendations(missing_criteria, language),
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Error analyzing evidence: {str(e)}" if language == "en" else f"خطأ في تحليل الشواهد: {str(e)}",
            }

    async def _analyze_single_evidence(
        self,
        evidence: Evidence,
        acceptance_criteria: List[Dict],
        language: str,
    ) -> Dict[str, Any]:
        """تحليل شاهد واحد."""

        criteria_text = "\n".join([
            f"- [{c['id']}] {c['text']}"
            for c in acceptance_criteria
        ])

        # Get evidence content
        evidence_content = evidence.extracted_text or evidence.file_name

        # Try to get prompt from database
        prompt_template = await get_system_prompt(self.db, "single_evidence_check")
        if prompt_template:
            prompt = prompt_template.format(
                criteria_text=criteria_text,
                evidence_content=evidence_content[:3000] if evidence_content else 'لا يوجد نص مستخرج'
            )
        else:
            # Fallback default prompt
            prompt = f"""
أنت محلل شواهد لمؤشر البيانات الوطني (NDI).

معايير القبول المطلوبة:
{criteria_text}

محتوى المستند:
{evidence_content[:3000] if evidence_content else 'لا يوجد نص مستخرج'}

المطلوب:
1. هل المستند يغطي أياً من معايير القبول؟
2. أي معايير مغطاة (ذكر أرقام المعايير)؟
3. درجة التطابق (0-100%)

أجب بصيغة JSON فقط:
{{
  "covers_any_criteria": true/false,
  "covered_criteria_ids": [1, 2, ...],
  "match_percentage": 0-100,
  "summary": "ملخص قصير"
}}
"""

        try:
            response_text = await self._call_llm(prompt)
            # Parse JSON response
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]

            analysis = json.loads(response_text)
            analysis["evidence_id"] = str(evidence.id)
            analysis["file_name"] = evidence.file_name
            return analysis

        except Exception as e:
            return {
                "evidence_id": str(evidence.id),
                "file_name": evidence.file_name,
                "covers_any_criteria": False,
                "covered_criteria_ids": [],
                "match_percentage": 0,
                "error": str(e),
            }

    async def suggest_evidence_structure(
        self,
        question_code: str,
        target_level: int,
        language: str = "ar",
    ) -> Dict[str, Any]:
        """اقتراح هيكل الدليل المطلوب."""
        try:
            ai_provider = await self._get_ai_provider()
            if not ai_provider or not ai_provider.get("api_key"):
                return {
                    "status": "error",
                    "message": "AI not configured. Please configure AI providers in Settings." if language == "en" else "الذكاء الاصطناعي غير مُعد. يرجى تكوين مزودي الذكاء الاصطناعي في الإعدادات.",
                }

            # Get question and maturity level
            result = await self.db.execute(
                select(NDIQuestion)
                .options(
                    selectinload(NDIQuestion.maturity_levels)
                    .selectinload(NDIMaturityLevel.acceptance_evidence)
                )
                .where(NDIQuestion.code == question_code.upper())
            )
            question = result.scalar_one_or_none()

            if not question:
                return {
                    "status": "error",
                    "message": f"Question not found: {question_code}" if language == "en" else f"السؤال غير موجود: {question_code}",
                }

            # Find target maturity level
            maturity_level = None
            for ml in question.maturity_levels:
                if ml.level == target_level:
                    maturity_level = ml
                    break

            if not maturity_level:
                return {
                    "status": "error",
                    "message": f"Maturity level {target_level} not found for question {question_code}" if language == "en" else f"مستوى النضج {target_level} غير موجود للسؤال {question_code}",
                }

            # Get acceptance criteria
            acceptance_criteria = []
            for ev in maturity_level.acceptance_evidence:
                text = ev.text_ar if language == "ar" else ev.text_en
                acceptance_criteria.append(text)

            level_description = maturity_level.description_ar if language == "ar" else maturity_level.description_en
            question_text = question.question_ar if language == "ar" else question.question_en
            level_name = maturity_level.name_ar if language == "ar" else maturity_level.name_en
            acceptance_criteria_text = chr(10).join(f'- {c}' for c in acceptance_criteria) if acceptance_criteria else "No criteria defined"

            # Try to get prompt from database
            prompt_template = await get_system_prompt(self.db, "evidence_structure")
            if prompt_template:
                try:
                    prompt = prompt_template.format(
                        question_text=question_text or "",
                        target_level=target_level,
                        level_name=level_name or "",
                        level_description=level_description or "",
                        acceptance_criteria=acceptance_criteria_text
                    )
                except KeyError as e:
                    # Fallback if prompt template has different placeholders
                    prompt = None
            else:
                prompt = None

            if not prompt:
                # Fallback default prompt
                prompt = f"""
أنت مستشار في مؤشر البيانات الوطني (NDI).

السؤال: {question_text or 'غير محدد'}
المستوى المستهدف: {target_level} - {level_name or 'غير محدد'}
وصف المستوى: {level_description or 'غير محدد'}

معايير القبول / الشواهد المطلوبة:
{acceptance_criteria_text}

المطلوب:
اقترح هيكلاً للدليل المطلوب يتضمن:
1. عنوان الدليل المقترح
2. الأقسام الرئيسية
3. ما يجب أن يتضمنه كل قسم
4. نصائح لكتابة دليل قوي

أجب بصيغة JSON:
{{
  "title": "عنوان الدليل المقترح",
  "sections": [
    {{
      "heading": "عنوان القسم",
      "description": "ما يجب أن يتضمنه",
      "tips": ["نصيحة 1", "نصيحة 2"]
    }}
  ],
  "general_tips": ["نصيحة عامة 1", "نصيحة عامة 2"],
  "common_mistakes": ["خطأ شائع يجب تجنبه"]
}}
"""

            response_text = await self._call_llm(prompt)
            response_text = response_text.strip()
            if response_text.startswith("```"):
                parts = response_text.split("```")
                if len(parts) >= 2:
                    response_text = parts[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                    response_text = response_text.strip()

            suggestion = json.loads(response_text)
            return {
                "status": "success",
                "question_code": question_code,
                "target_level": target_level,
                "acceptance_criteria": acceptance_criteria,
                "suggestion": suggestion,
            }

        except json.JSONDecodeError as e:
            return {
                "status": "error",
                "message": f"Failed to parse AI response: {str(e)}" if language == "en" else f"فشل في تحليل استجابة الذكاء الاصطناعي: {str(e)}",
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error generating structure suggestion: {str(e)}" if language == "en" else f"خطأ في توليد اقتراح الهيكل: {str(e)}",
            }

    async def quick_check(
        self,
        content: str,
        question_code: str,
        target_level: int,
    ) -> Dict[str, Any]:
        """فحص سريع للدليل."""

        # Get maturity level requirements
        result = await self.db.execute(
            select(NDIQuestion)
            .options(
                selectinload(NDIQuestion.maturity_levels)
                .selectinload(NDIMaturityLevel.acceptance_evidence)
            )
            .where(NDIQuestion.code == question_code.upper())
        )
        question = result.scalar_one_or_none()

        if not question:
            return {"status": "error", "message": "Question not found"}

        # Find target maturity level
        maturity_level = None
        for ml in question.maturity_levels:
            if ml.level == target_level:
                maturity_level = ml
                break

        if not maturity_level:
            return {"status": "error", "message": "Maturity level not found"}

        # Simple keyword matching for quick check
        checklist = []
        for ev in maturity_level.acceptance_evidence:
            keywords = self._extract_keywords(ev.text_ar)
            found = any(kw.lower() in content.lower() for kw in keywords)

            checklist.append({
                "evidence_id": ev.evidence_id,
                "requirement": ev.text_ar,
                "found": found,
                "confidence": "high" if found else "low",
            })

        covered = sum(1 for c in checklist if c["found"])
        total = len(checklist)

        return {
            "status": "success",
            "checklist": checklist,
            "coverage": {
                "covered": covered,
                "total": total,
                "percentage": round((covered / total * 100), 1) if total > 0 else 0,
            },
            "ready_for_submission": covered == total,
        }

    def _extract_keywords(self, text: str) -> List[str]:
        """استخراج كلمات مفتاحية من النص."""
        # Remove common Arabic stop words and extract meaningful words
        stop_words = ["في", "من", "على", "إلى", "هل", "أن", "مع", "عن", "التي", "الذي"]
        words = text.split()
        keywords = [w for w in words if len(w) > 2 and w not in stop_words]
        return keywords[:10]  # Return top 10 keywords

    def _generate_recommendations(
        self,
        missing_criteria: List[Dict],
        language: str,
    ) -> List[str]:
        """توليد توصيات بناءً على المعايير المفقودة."""
        if not missing_criteria:
            if language == "ar":
                return ["جميع معايير القبول مغطاة. الدليل جاهز للتقديم."]
            return ["All acceptance criteria are covered. Evidence is ready for submission."]

        recommendations = []
        for criterion in missing_criteria[:5]:  # Top 5 missing
            if language == "ar":
                recommendations.append(f"أضف دليلاً يغطي: {criterion['text']}")
            else:
                recommendations.append(f"Add evidence covering: {criterion['text']}")

        return recommendations

    async def _call_llm(self, prompt: str) -> str:
        """Call the configured LLM from database settings."""
        import asyncio
        import logging

        logger = logging.getLogger(__name__)

        ai_provider = await self._get_ai_provider()

        if not ai_provider or not ai_provider.get("api_key"):
            raise ValueError("No AI provider configured. Please configure in Settings.")

        provider_id = ai_provider.get("id", "")
        api_key = ai_provider.get("api_key", "")
        model_name = ai_provider.get("model_name", "")
        api_endpoint = ai_provider.get("api_endpoint", "")

        logger.info(f"Calling LLM with provider: {provider_id}, model: {model_name}")

        if provider_id == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name or "gemini-pro")
            # Run sync call in thread pool to avoid blocking
            response = await asyncio.to_thread(model.generate_content, prompt)
            return response.text

        elif provider_id == "openai":
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=api_key)
            response = await client.chat.completions.create(
                model=model_name or "gpt-4",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content

        elif provider_id == "claude":
            import anthropic
            client = anthropic.AsyncAnthropic(api_key=api_key)
            response = await client.messages.create(
                model=model_name or "claude-3-opus-20240229",
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
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
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content

        raise ValueError(f"Unknown AI provider: {provider_id}")
