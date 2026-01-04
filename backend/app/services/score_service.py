"""Score Service - خدمة حساب الدرجات."""
from typing import Optional, List, Dict, Any
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assessment import Assessment, AssessmentResponse
from app.models.ndi import (
    NDIDomain,
    NDIQuestion,
    NDIMaturityLevel,
    NDIAcceptanceEvidence,
)
from app.models.evidence import Evidence
from app.schemas.score import (
    MaturityScoreResult,
    ComplianceScoreResult,
    CombinedAssessmentResult,
    DomainScore,
    SpecificationStatus,
    QuestionDetail,
    LevelInfo,
)


class ScoreService:
    """خدمة حساب درجات النضج والامتثال."""

    LEVEL_NAMES = {
        0: ("Absence of Capabilities", "غياب القدرات"),
        1: ("Establishing", "التأسيس"),
        2: ("Defined", "التحديد"),
        3: ("Activated", "التفعيل"),
        4: ("Managed", "الإدارة"),
        5: ("Pioneer", "الريادة"),
    }

    LEVEL_THRESHOLDS = [
        (0.25, 0),
        (1.25, 1),
        (2.50, 2),
        (4.00, 3),
        (4.75, 4),
        (5.01, 5),
    ]

    def __init__(self, db: AsyncSession):
        self.db = db

    def _get_level_from_score(self, score: float) -> int:
        """تحويل الدرجة إلى مستوى."""
        for threshold, level in self.LEVEL_THRESHOLDS:
            if score < threshold:
                return level
        return 5

    def _get_level_name(self, level: int, language: str = "en") -> str:
        """الحصول على اسم المستوى."""
        names = self.LEVEL_NAMES.get(level, ("Unknown", "غير معروف"))
        return names[0] if language == "en" else names[1]

    async def _get_domains(self) -> List[NDIDomain]:
        """جلب جميع المجالات."""
        result = await self.db.execute(
            select(NDIDomain)
            .options(selectinload(NDIDomain.questions))
            .order_by(NDIDomain.sort_order)
        )
        return result.scalars().all()

    async def _get_responses(self, assessment_id: UUID) -> List[AssessmentResponse]:
        """جلب إجابات التقييم."""
        result = await self.db.execute(
            select(AssessmentResponse)
            .options(
                selectinload(AssessmentResponse.question).selectinload(NDIQuestion.domain),
                selectinload(AssessmentResponse.evidence),
            )
            .where(AssessmentResponse.assessment_id == assessment_id)
        )
        return result.scalars().all()

    async def _get_maturity_level(
        self, question_id: UUID, level: int
    ) -> Optional[NDIMaturityLevel]:
        """جلب مستوى النضج."""
        result = await self.db.execute(
            select(NDIMaturityLevel)
            .options(
                selectinload(NDIMaturityLevel.acceptance_evidence),
            )
            .where(NDIMaturityLevel.question_id == question_id)
            .where(NDIMaturityLevel.level == level)
        )
        return result.scalar_one_or_none()

    async def _get_total_questions(self) -> int:
        """إجمالي عدد الأسئلة."""
        result = await self.db.execute(select(func.count(NDIQuestion.id)))
        return result.scalar() or 42

    async def calculate_maturity_score(
        self, assessment_id: UUID
    ) -> MaturityScoreResult:
        """
        حساب درجة النضج.
        = متوسط المستويات المختارة لجميع الأسئلة
        """
        responses = await self._get_responses(assessment_id)
        domains = await self._get_domains()
        total_questions = await self._get_total_questions()

        domain_scores: List[DomainScore] = []
        all_scores: List[float] = []

        for domain in domains:
            domain_question_ids = [q.id for q in domain.questions]
            domain_responses = [
                r for r in responses
                if r.question_id in domain_question_ids and r.selected_level is not None
            ]

            if domain_responses:
                avg_score = sum(r.selected_level for r in domain_responses) / len(domain_responses)
                level = self._get_level_from_score(avg_score)
                all_scores.append(avg_score)
            else:
                avg_score = 0.0
                level = 0

            domain_scores.append(DomainScore(
                domain_code=domain.code,
                domain_name_en=domain.name_en,
                domain_name_ar=domain.name_ar,
                score=round(avg_score, 2),
                level=level,
                level_name_en=self._get_level_name(level, "en"),
                level_name_ar=self._get_level_name(level, "ar"),
                answered_count=len(domain_responses),
                total_questions=len(domain.questions),
                percentage=round((avg_score / 5) * 100, 1) if avg_score > 0 else 0,
            ))

        # Overall score
        if all_scores:
            overall_score = sum(all_scores) / len(all_scores)
        else:
            overall_score = 0.0

        overall_level = self._get_level_from_score(overall_score)
        answered_count = sum(ds.answered_count for ds in domain_scores)

        return MaturityScoreResult(
            overall_score=round(overall_score, 2),
            overall_level=overall_level,
            overall_level_name_en=self._get_level_name(overall_level, "en"),
            overall_level_name_ar=self._get_level_name(overall_level, "ar"),
            overall_percentage=round((overall_score / 5) * 100, 1),
            domain_scores=domain_scores,
            answered_count=answered_count,
            total_questions=total_questions,
        )

    async def calculate_compliance_score(
        self, assessment_id: UUID
    ) -> ComplianceScoreResult:
        """
        حساب درجة الامتثال.

        الخطوات:
        1. لكل إجابة، جلب المستوى المختار
        2. جلب acceptance_evidence مع specification_code للمستوى
        3. لكل شاهد له specification_code، تحقق هل الشاهد مرفوع؟
        4. إذا مرفوع = المواصفة ممتثلة
        """
        responses = await self._get_responses(assessment_id)

        specifications_status: List[SpecificationStatus] = []

        for response in responses:
            if response.selected_level is None:
                continue

            # Get maturity level with acceptance evidence
            maturity_level = await self._get_maturity_level(
                response.question_id,
                response.selected_level
            )

            if not maturity_level or not maturity_level.acceptance_evidence:
                continue

            # Get uploaded evidence IDs
            uploaded_evidence_ids = [ev.evidence_id for ev in response.evidence if ev.evidence_id]

            # Check each evidence with specification_code
            for evidence in maturity_level.acceptance_evidence:
                if not evidence.specification_code:
                    continue  # Skip evidence without specification code

                is_uploaded = evidence.evidence_id in uploaded_evidence_ids

                specifications_status.append(SpecificationStatus(
                    specification_code=evidence.specification_code,
                    question_code=response.question.code if response.question else "",
                    evidence_id=evidence.evidence_id,
                    status="compliant" if is_uploaded else "non_compliant",
                    has_evidence=is_uploaded,
                ))

        # Calculate percentages
        total = len(specifications_status)
        compliant = sum(1 for s in specifications_status if s.status == "compliant")
        non_compliant = total - compliant

        return ComplianceScoreResult(
            compliant_count=compliant,
            partial_count=0,
            non_compliant_count=non_compliant,
            total_specifications=total,
            compliance_percentage=round((compliant / total * 100), 1) if total > 0 else 0,
            is_compliant=compliant == total and total > 0,
            specifications_detail=specifications_status,
        )

    async def get_combined_assessment(
        self, assessment_id: UUID
    ) -> CombinedAssessmentResult:
        """
        التقييم المجمع: النضج + الامتثال معاً.
        """
        maturity = await self.calculate_maturity_score(assessment_id)
        compliance = await self.calculate_compliance_score(assessment_id)

        # Get question details
        responses = await self._get_responses(assessment_id)
        question_details: List[QuestionDetail] = []

        for response in responses:
            if response.selected_level is None:
                continue

            maturity_level = await self._get_maturity_level(
                response.question_id,
                response.selected_level
            )

            # Get uploaded evidence IDs
            uploaded_evidence_ids = [ev.evidence_id for ev in response.evidence if ev.evidence_id]

            # Build specifications status from acceptance_evidence with specification_code
            spec_status = []
            if maturity_level and maturity_level.acceptance_evidence:
                for ev in maturity_level.acceptance_evidence:
                    if ev.specification_code:
                        spec_status.append({
                            "code": ev.specification_code,
                            "evidence_id": ev.evidence_id,
                            "uploaded": ev.evidence_id in uploaded_evidence_ids,
                        })

            required_evidence_count = len(maturity_level.acceptance_evidence) if maturity_level else 0

            question_details.append(QuestionDetail(
                question_code=response.question.code if response.question else "",
                domain_code=response.question.domain.code if response.question and response.question.domain else "",
                question_en=response.question.question_en if response.question else "",
                question_ar=response.question.question_ar if response.question else "",
                selected_level=response.selected_level,
                level_name_en=self._get_level_name(response.selected_level, "en"),
                level_name_ar=self._get_level_name(response.selected_level, "ar"),
                required_evidence_count=required_evidence_count,
                uploaded_evidence_count=len(response.evidence),
                specifications_status=spec_status,
                all_specs_compliant=all(s["uploaded"] for s in spec_status) if spec_status else True,
            ))

        return CombinedAssessmentResult(
            maturity=maturity,
            compliance=compliance,
            question_details=question_details,
        )

    async def update_assessment_scores(self, assessment_id: UUID) -> None:
        """تحديث درجات التقييم في قاعدة البيانات."""
        maturity = await self.calculate_maturity_score(assessment_id)
        compliance = await self.calculate_compliance_score(assessment_id)

        result = await self.db.execute(
            select(Assessment).where(Assessment.id == assessment_id)
        )
        assessment = result.scalar_one_or_none()

        if assessment:
            assessment.maturity_score = maturity.overall_score
            assessment.compliance_score = compliance.compliance_percentage
            assessment.current_score = maturity.overall_score
            await self.db.flush()
