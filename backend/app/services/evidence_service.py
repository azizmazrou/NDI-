"""Evidence service for document processing and analysis."""
from datetime import datetime
from pathlib import Path
from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.evidence import Evidence
from app.models.assessment import AssessmentResponse
from app.models.ndi import NDIQuestion, NDIMaturityLevel
from app.schemas.evidence import EvidenceAnalysis
from app.config import settings


class EvidenceService:
    """Service for evidence processing and analysis."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def extract_text(self, evidence: Evidence) -> Optional[str]:
        """Extract text from uploaded document."""
        file_path = Path(evidence.file_path)

        if not file_path.exists():
            return None

        extracted_text = ""
        file_type = evidence.file_type.lower() if evidence.file_type else ""

        try:
            if file_type == "pdf":
                extracted_text = await self._extract_pdf(file_path)
            elif file_type in ["docx", "doc"]:
                extracted_text = await self._extract_docx(file_path)
            elif file_type in ["xlsx", "xls"]:
                extracted_text = await self._extract_excel(file_path)
            elif file_type in ["pptx", "ppt"]:
                extracted_text = await self._extract_pptx(file_path)
            elif file_type == "txt":
                extracted_text = file_path.read_text(encoding="utf-8")

            # Update evidence record
            evidence.extracted_text = extracted_text
            await self.db.flush()

            return extracted_text
        except Exception as e:
            print(f"Error extracting text: {e}")
            return None

    async def _extract_pdf(self, file_path: Path) -> str:
        """Extract text from PDF."""
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(file_path))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""

    async def _extract_docx(self, file_path: Path) -> str:
        """Extract text from DOCX."""
        try:
            from docx import Document
            doc = Document(str(file_path))
            text = ""
            for para in doc.paragraphs:
                text += para.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    for cell in row.cells:
                        text += cell.text + " "
                    text += "\n"
            return text.strip()
        except Exception as e:
            print(f"DOCX extraction error: {e}")
            return ""

    async def _extract_excel(self, file_path: Path) -> str:
        """Extract text from Excel."""
        try:
            from openpyxl import load_workbook
            wb = load_workbook(str(file_path), data_only=True)
            text = ""
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                for row in ws.iter_rows():
                    row_text = " ".join(
                        str(cell.value) if cell.value else "" for cell in row
                    )
                    if row_text.strip():
                        text += row_text + "\n"
            return text.strip()
        except Exception as e:
            print(f"Excel extraction error: {e}")
            return ""

    async def _extract_pptx(self, file_path: Path) -> str:
        """Extract text from PowerPoint."""
        try:
            from pptx import Presentation
            prs = Presentation(str(file_path))
            text = ""
            for slide in prs.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
            return text.strip()
        except Exception as e:
            print(f"PPTX extraction error: {e}")
            return ""

    async def analyze_evidence(self, evidence_id: UUID) -> EvidenceAnalysis:
        """Analyze evidence using AI."""
        # Get evidence with response and question
        result = await self.db.execute(
            select(Evidence)
            .options(
                selectinload(Evidence.response)
                .selectinload(AssessmentResponse.question)
                .selectinload(NDIQuestion.maturity_levels)
            )
            .where(Evidence.id == evidence_id)
        )
        evidence = result.scalar_one_or_none()

        if not evidence:
            raise ValueError("Evidence not found")

        # Get the selected level details
        selected_level = evidence.response.selected_level if evidence.response else 0
        question = evidence.response.question if evidence.response else None

        if not question:
            return EvidenceAnalysis(
                supports_level="no",
                covered_criteria=[],
                missing_criteria=[],
                confidence_score=0.0,
                recommendations=["Cannot analyze without question context"],
            )

        # Get maturity level criteria
        level_criteria = next(
            (ml for ml in question.maturity_levels if ml.level == selected_level),
            None
        )

        if not level_criteria:
            return EvidenceAnalysis(
                supports_level="no",
                covered_criteria=[],
                missing_criteria=[],
                confidence_score=0.0,
                recommendations=["Maturity level criteria not found"],
            )

        # Perform AI analysis
        analysis = await self._ai_analyze(
            document_text=evidence.extracted_text or "",
            question=question.question_ar,
            level_description=level_criteria.description_ar,
            acceptance_criteria=level_criteria.acceptance_evidence_ar or [],
        )

        # Update evidence record
        evidence.ai_analysis = analysis
        evidence.analysis_status = "completed"
        evidence.analyzed_at = datetime.utcnow()
        await self.db.flush()

        return EvidenceAnalysis(
            supports_level=analysis.get("supports_level", "no"),
            covered_criteria=analysis.get("covered_criteria", []),
            missing_criteria=analysis.get("missing_criteria", []),
            confidence_score=analysis.get("confidence_score", 0.0),
            recommendations=analysis.get("recommendations", []),
            summary_ar=analysis.get("summary_ar"),
            summary_en=analysis.get("summary_en"),
        )

    async def analyze_evidence_against_criteria(
        self,
        evidence_id: UUID,
        question_code: str,
        selected_level: int,
        language: str = "ar",
    ) -> EvidenceAnalysis:
        """Analyze evidence against specific criteria."""
        # Get evidence
        evidence_result = await self.db.execute(
            select(Evidence).where(Evidence.id == evidence_id)
        )
        evidence = evidence_result.scalar_one_or_none()

        if not evidence:
            raise ValueError("Evidence not found")

        # Get question with levels
        question_result = await self.db.execute(
            select(NDIQuestion)
            .options(selectinload(NDIQuestion.maturity_levels))
            .where(NDIQuestion.code == question_code.upper())
        )
        question = question_result.scalar_one_or_none()

        if not question:
            raise ValueError("Question not found")

        # Get level criteria
        level_criteria = next(
            (ml for ml in question.maturity_levels if ml.level == selected_level),
            None
        )

        if not level_criteria:
            return EvidenceAnalysis(
                supports_level="no",
                covered_criteria=[],
                missing_criteria=[],
                confidence_score=0.0,
                recommendations=["Maturity level criteria not found"],
            )

        # Use appropriate language
        if language == "ar":
            question_text = question.question_ar
            level_desc = level_criteria.description_ar
            criteria = level_criteria.acceptance_evidence_ar or []
        else:
            question_text = question.question_en
            level_desc = level_criteria.description_en
            criteria = level_criteria.acceptance_evidence_en or []

        # Perform analysis
        analysis = await self._ai_analyze(
            document_text=evidence.extracted_text or "",
            question=question_text,
            level_description=level_desc,
            acceptance_criteria=criteria,
        )

        # Update evidence
        evidence.ai_analysis = analysis
        evidence.analysis_status = "completed"
        evidence.analyzed_at = datetime.utcnow()
        await self.db.flush()

        return EvidenceAnalysis(
            supports_level=analysis.get("supports_level", "no"),
            covered_criteria=analysis.get("covered_criteria", []),
            missing_criteria=analysis.get("missing_criteria", []),
            confidence_score=analysis.get("confidence_score", 0.0),
            recommendations=analysis.get("recommendations", []),
            summary_ar=analysis.get("summary_ar"),
            summary_en=analysis.get("summary_en"),
        )

    async def _ai_analyze(
        self,
        document_text: str,
        question: str,
        level_description: str,
        acceptance_criteria: list[str],
    ) -> dict:
        """Perform AI analysis of document."""
        # Check if AI is configured
        if not settings.google_api_key and not settings.openai_api_key:
            # Return mock analysis if no AI configured
            return {
                "supports_level": "partial",
                "covered_criteria": acceptance_criteria[:len(acceptance_criteria)//2] if acceptance_criteria else [],
                "missing_criteria": acceptance_criteria[len(acceptance_criteria)//2:] if acceptance_criteria else [],
                "confidence_score": 0.5,
                "recommendations": [
                    "Configure AI API keys for detailed analysis",
                    "Review document manually against criteria",
                ],
                "summary_ar": "تحليل أولي - يرجى تكوين مفاتيح API للذكاء الاصطناعي للتحليل التفصيلي",
                "summary_en": "Preliminary analysis - Please configure AI API keys for detailed analysis",
            }

        try:
            # Use Google Gemini if available
            if settings.google_api_key:
                return await self._analyze_with_gemini(
                    document_text, question, level_description, acceptance_criteria
                )
            # Use OpenAI if available
            elif settings.openai_api_key:
                return await self._analyze_with_openai(
                    document_text, question, level_description, acceptance_criteria
                )
        except Exception as e:
            print(f"AI analysis error: {e}")
            return {
                "supports_level": "no",
                "covered_criteria": [],
                "missing_criteria": acceptance_criteria,
                "confidence_score": 0.0,
                "recommendations": [f"Analysis failed: {str(e)}"],
            }

        return {
            "supports_level": "no",
            "covered_criteria": [],
            "missing_criteria": acceptance_criteria,
            "confidence_score": 0.0,
            "recommendations": ["No AI provider configured"],
        }

    async def _analyze_with_gemini(
        self,
        document_text: str,
        question: str,
        level_description: str,
        acceptance_criteria: list[str],
    ) -> dict:
        """Analyze using Google Gemini."""
        import google.generativeai as genai

        genai.configure(api_key=settings.google_api_key)
        model = genai.GenerativeModel("gemini-pro")

        criteria_text = "\n".join(f"- {c}" for c in acceptance_criteria)
        prompt = f"""أنت محلل شواهد لمؤشر البيانات الوطني (NDI).

السؤال: {question}
وصف المستوى: {level_description}
معايير القبول:
{criteria_text}

المستند المرفوع:
{document_text[:8000]}

المطلوب:
1. هل المستند يدعم المستوى المختار؟ (yes/partial/no)
2. أي معايير قبول يغطيها المستند؟
3. أي معايير قبول مفقودة؟
4. توصيات لتحسين الشواهد

أجب بـ JSON فقط بدون أي نص إضافي:
{{
  "supports_level": "yes|partial|no",
  "covered_criteria": [],
  "missing_criteria": [],
  "confidence_score": 0.0-1.0,
  "recommendations": [],
  "summary_ar": "",
  "summary_en": ""
}}
"""

        response = model.generate_content(prompt)

        # Parse JSON response
        import json
        try:
            # Extract JSON from response
            text = response.text
            # Find JSON in response
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

        return {
            "supports_level": "partial",
            "covered_criteria": [],
            "missing_criteria": acceptance_criteria,
            "confidence_score": 0.5,
            "recommendations": ["Could not parse AI response"],
        }

    async def _analyze_with_openai(
        self,
        document_text: str,
        question: str,
        level_description: str,
        acceptance_criteria: list[str],
    ) -> dict:
        """Analyze using OpenAI."""
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)

        criteria_text = "\n".join(f"- {c}" for c in acceptance_criteria)
        prompt = f"""You are an evidence analyzer for the National Data Index (NDI).

Question: {question}
Level Description: {level_description}
Acceptance Criteria:
{criteria_text}

Document Content:
{document_text[:8000]}

Analyze and respond with JSON only:
{{
  "supports_level": "yes|partial|no",
  "covered_criteria": [],
  "missing_criteria": [],
  "confidence_score": 0.0-1.0,
  "recommendations": [],
  "summary_ar": "",
  "summary_en": ""
}}
"""

        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
        )

        import json
        return json.loads(response.choices[0].message.content)
