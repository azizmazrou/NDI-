"""
Admin Router - مسارات الإدارة
API endpoints for administrative tasks like data seeding
"""

import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.database import get_db

router = APIRouter(prefix="/admin", tags=["Admin - الإدارة"])


# Domain descriptions
DOMAIN_DESCRIPTIONS = {
    "DG": {
        "description_en": "The exercise of authority and control over the management of data assets.",
        "description_ar": "ممارسة السلطة والسيطرة على إدارة أصول البيانات.",
        "is_oe_domain": False
    },
    "MCM": {
        "description_en": "Planning, implementation, and control of activities to enable access to high quality, integrated metadata.",
        "description_ar": "تخطيط وتنفيذ ومراقبة الأنشطة لتمكين الوصول إلى البيانات الوصفية المتكاملة عالية الجودة.",
        "is_oe_domain": False
    },
    "DQ": {
        "description_en": "Planning and implementation of quality management techniques to measure, assess, improve, and ensure the fitness of data for use.",
        "description_ar": "تخطيط وتنفيذ تقنيات إدارة الجودة لقياس وتقييم وتحسين وضمان ملاءمة البيانات للاستخدام.",
        "is_oe_domain": False
    },
    "DO": {
        "description_en": "Planning, control, and support for structured data assets across the data lifecycle.",
        "description_ar": "تخطيط ومراقبة ودعم أصول البيانات المهيكلة عبر دورة حياة البيانات.",
        "is_oe_domain": False
    },
    "DCM": {
        "description_en": "Planning, implementation, and control of activities to store, protect, and access data in unstructured sources.",
        "description_ar": "تخطيط وتنفيذ ومراقبة الأنشطة لتخزين وحماية والوصول إلى البيانات في المصادر غير المهيكلة.",
        "is_oe_domain": False
    },
    "DAM": {
        "description_en": "Defining the blueprint for data assets by establishing standards and best practices.",
        "description_ar": "تحديد المخطط لأصول البيانات من خلال وضع المعايير وأفضل الممارسات.",
        "is_oe_domain": False
    },
    "DSI": {
        "description_en": "Managing processes related to data movement and consolidation inside and outside the entity.",
        "description_ar": "إدارة العمليات المتعلقة بنقل البيانات وتوحيدها داخل الجهة وخارجها.",
        "is_oe_domain": False
    },
    "RMD": {
        "description_en": "Managing data for optimal consistency and quality through establishing a single point of reference.",
        "description_ar": "إدارة البيانات لتحقيق الاتساق والجودة المثلى من خلال إنشاء نقطة مرجعية واحدة.",
        "is_oe_domain": False
    },
    "BIA": {
        "description_en": "Planning, implementing, and controlling processes to extract value from data through analytics.",
        "description_ar": "تخطيط وتنفيذ ومراقبة العمليات لاستخراج القيمة من البيانات من خلال التحليلات.",
        "is_oe_domain": False
    },
    "DVR": {
        "description_en": "Measuring and tracking the value generated from data assets and initiatives.",
        "description_ar": "قياس وتتبع القيمة المتولدة من أصول البيانات والمبادرات.",
        "is_oe_domain": False
    },
    "OD": {
        "description_en": "Making data publicly available for use and reuse by external stakeholders.",
        "description_ar": "إتاحة البيانات للعموم للاستخدام وإعادة الاستخدام من قبل الجهات الخارجية.",
        "is_oe_domain": True
    },
    "FOI": {
        "description_en": "Ensuring public access to information held by government entities.",
        "description_ar": "ضمان وصول الجمهور إلى المعلومات التي تحتفظ بها الجهات الحكومية.",
        "is_oe_domain": True
    },
    "DC": {
        "description_en": "Categorizing data based on sensitivity and security requirements.",
        "description_ar": "تصنيف البيانات بناءً على متطلبات الحساسية والأمان.",
        "is_oe_domain": False
    },
    "PDP": {
        "description_en": "Protecting personal data and ensuring compliance with privacy regulations.",
        "description_ar": "حماية البيانات الشخصية وضمان الامتثال للوائح الخصوصية.",
        "is_oe_domain": False
    }
}


@router.post("/seed-ndi-data")
async def seed_ndi_data(db: AsyncSession = Depends(get_db)):
    """
    Seed NDI data from main-data.json
    تحميل بيانات مؤشر البيانات الوطني من الملف الرئيسي
    """
    # Path to data file
    data_file = Path(__file__).parent.parent.parent.parent / "data" / "main-data.json"

    if not data_file.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Data file not found at {data_file}"
        )

    try:
        # Load data
        with open(data_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Check if data already exists
        result = await db.execute(text("SELECT COUNT(*) FROM ndi_domains"))
        count = result.scalar()

        if count > 0:
            return {
                "status": "skipped",
                "message": f"NDI data already exists ({count} domains found). Use force=true to reseed.",
                "domains_count": count
            }

        # Seed domains
        domain_map = {}
        for idx, domain_data in enumerate(data["domains"], start=1):
            code = domain_data["code"]
            extra = DOMAIN_DESCRIPTIONS.get(code, {})
            domain_id = uuid.uuid4()

            await db.execute(
                text("""
                    INSERT INTO ndi_domains (id, code, name_en, name_ar, description_en, description_ar, question_count, is_oe_domain, sort_order)
                    VALUES (:id, :code, :name_en, :name_ar, :description_en, :description_ar, :question_count, :is_oe_domain, :sort_order)
                """),
                {
                    "id": domain_id,
                    "code": code,
                    "name_en": domain_data["name_en"],
                    "name_ar": domain_data["name_ar"],
                    "description_en": extra.get("description_en", ""),
                    "description_ar": extra.get("description_ar", ""),
                    "question_count": domain_data.get("question_count", 0),
                    "is_oe_domain": extra.get("is_oe_domain", False),
                    "sort_order": idx,
                }
            )
            domain_map[code] = domain_id

        # Seed questions and maturity levels
        questions_count = 0
        levels_count = 0

        for q_idx, q_data in enumerate(data["questions"], start=1):
            domain_code = q_data["domain_code"]
            domain_id = domain_map.get(domain_code)

            if not domain_id:
                continue

            question_id = uuid.uuid4()
            await db.execute(
                text("""
                    INSERT INTO ndi_questions (id, domain_id, code, question_en, question_ar, sort_order)
                    VALUES (:id, :domain_id, :code, :question_en, :question_ar, :sort_order)
                """),
                {
                    "id": question_id,
                    "domain_id": domain_id,
                    "code": q_data["code"],
                    "question_en": q_data["question_en"],
                    "question_ar": q_data["question_ar"],
                    "sort_order": q_idx,
                }
            )
            questions_count += 1

            # Create maturity levels
            for level_data in q_data.get("levels", []):
                level_id = uuid.uuid4()
                await db.execute(
                    text("""
                        INSERT INTO ndi_maturity_levels (id, question_id, level, name_en, name_ar, description_en, description_ar)
                        VALUES (:id, :question_id, :level, :name_en, :name_ar, :description_en, :description_ar)
                    """),
                    {
                        "id": level_id,
                        "question_id": question_id,
                        "level": level_data["level"],
                        "name_en": level_data["name_en"],
                        "name_ar": level_data["name_ar"],
                        "description_en": level_data.get("description_en", ""),
                        "description_ar": level_data.get("description_ar", ""),
                    }
                )
                levels_count += 1

                # Create acceptance evidence
                for ev_idx, ev in enumerate(level_data.get("acceptance_evidence", []), start=1):
                    await db.execute(
                        text("""
                            INSERT INTO ndi_acceptance_evidence (id, maturity_level_id, evidence_id, text_en, text_ar, inherits_from_level, sort_order)
                            VALUES (:id, :maturity_level_id, :evidence_id, :text_en, :text_ar, :inherits_from_level, :sort_order)
                        """),
                        {
                            "id": uuid.uuid4(),
                            "maturity_level_id": level_id,
                            "evidence_id": ev.get("id", ev_idx),
                            "text_en": ev.get("text_en", ""),
                            "text_ar": ev.get("text_ar", ""),
                            "inherits_from_level": ev.get("inherits_from_level"),
                            "sort_order": ev_idx,
                        }
                    )

        await db.commit()

        return {
            "status": "success",
            "message": "NDI data seeded successfully",
            "domains_count": len(data["domains"]),
            "questions_count": questions_count,
            "levels_count": levels_count,
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to seed NDI data: {str(e)}"
        )


@router.get("/status")
async def get_status(db: AsyncSession = Depends(get_db)):
    """
    Get system status including data counts
    الحصول على حالة النظام بما في ذلك عدد البيانات
    """
    try:
        # Count domains
        domains_result = await db.execute(text("SELECT COUNT(*) FROM ndi_domains"))
        domains_count = domains_result.scalar() or 0

        # Count questions
        questions_result = await db.execute(text("SELECT COUNT(*) FROM ndi_questions"))
        questions_count = questions_result.scalar() or 0

        # Count AI providers
        providers_result = await db.execute(text("SELECT COUNT(*) FROM ai_provider_configs"))
        providers_count = providers_result.scalar() or 0

        # Count assessments
        assessments_result = await db.execute(text("SELECT COUNT(*) FROM assessments"))
        assessments_count = assessments_result.scalar() or 0

        return {
            "status": "healthy",
            "data": {
                "ndi_domains": domains_count,
                "ndi_questions": questions_count,
                "ai_providers": providers_count,
                "assessments": assessments_count,
            },
            "ndi_data_seeded": domains_count > 0,
            "ai_providers_initialized": providers_count > 0,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
