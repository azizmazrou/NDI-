"""
Admin Router - مسارات الإدارة
API endpoints for administrative tasks like data seeding
"""

import json
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_db

router = APIRouter(tags=["Admin - الإدارة"])


# Domain descriptions (OE = Open Entity domains)
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


async def truncate_ndi_tables(db: AsyncSession) -> None:
    """Truncate all NDI-related tables."""
    # Order matters - truncate in reverse dependency order
    tables_to_truncate = [
        "ndi_acceptance_evidence",
        "ndi_maturity_levels",
        "ndi_questions",
        "ndi_domains",
    ]

    # Also try to drop old tables that are no longer needed
    old_tables = [
        "ndi_evidence_specification_mapping",
        "ndi_specifications",
    ]

    for table in tables_to_truncate:
        try:
            await db.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        except Exception as e:
            print(f"Warning: Could not truncate {table}: {e}")

    for table in old_tables:
        try:
            await db.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE"))
        except Exception as e:
            print(f"Warning: Could not drop {table}: {e}")

    await db.commit()


async def ensure_schema(db: AsyncSession) -> None:
    """Ensure database schema has the specification_code column."""
    try:
        # Check if specification_code column exists
        result = await db.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'ndi_acceptance_evidence' AND column_name = 'specification_code'
        """))
        if not result.scalar_one_or_none():
            await db.execute(text("""
                ALTER TABLE ndi_acceptance_evidence
                ADD COLUMN specification_code VARCHAR(20) NULL
            """))
            await db.commit()
            print("Added specification_code column to ndi_acceptance_evidence")
    except Exception as e:
        print(f"Warning: Schema update failed: {e}")


@router.post("/seed-ndi-data")
async def seed_ndi_data(
    force: bool = Query(False, description="Force reseed by truncating existing data"),
    db: AsyncSession = Depends(get_db)
):
    """
    Seed NDI data from main-data.json
    تحميل بيانات مؤشر البيانات الوطني من الملف الرئيسي

    - If force=true, truncates all existing NDI data before seeding
    - Creates domains, questions, maturity levels, and acceptance evidence
    - Links evidence to specification codes for compliance scoring
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

        metadata = data.get("metadata", {})

        # Check if data already exists
        result = await db.execute(text("SELECT COUNT(*) FROM ndi_domains"))
        existing_count = result.scalar() or 0

        if existing_count > 0 and not force:
            return {
                "status": "skipped",
                "message": f"NDI data already exists ({existing_count} domains). Use force=true to reseed.",
                "domains_count": existing_count,
                "hint": "POST /api/v1/admin/seed-ndi-data?force=true"
            }

        # Truncate existing data if force=true or if data exists
        if force or existing_count > 0:
            print("Truncating existing NDI data...")
            await truncate_ndi_tables(db)

        # Ensure schema is up to date
        await ensure_schema(db)

        # Seed domains
        print("Seeding domains...")
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
            print(f"  Created domain: {code}")

        # Seed questions and maturity levels
        print("Seeding questions and maturity levels...")
        questions_count = 0
        levels_count = 0
        evidence_count = 0
        spec_count = 0

        for q_idx, q_data in enumerate(data["questions"], start=1):
            domain_code = q_data["domain_code"]
            domain_id = domain_map.get(domain_code)

            if not domain_id:
                print(f"  Warning: Domain {domain_code} not found, skipping question {q_data['code']}")
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
            print(f"  Created question: {q_data['code']}")

            # Build specification code mapping for this question
            spec_mapping = {}  # {(level, evidence_id): specification_code}
            for level_data in q_data.get("levels", []):
                for mapping in level_data.get("evidence_specification_mapping", []):
                    if mapping.get("specification_code"):
                        key = (level_data["level"], mapping["evidence_id"])
                        spec_mapping[key] = mapping["specification_code"]

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

                # Create acceptance evidence with text and specification
                for ev_idx, ev in enumerate(level_data.get("acceptance_evidence", []), start=1):
                    ev_id = ev.get("id", ev_idx)
                    inherits_from = ev.get("inherits_from_level")

                    # Get text directly from evidence object
                    text_en = ev.get("text_en") or ""
                    text_ar = ev.get("text_ar") or ""

                    # Get specification code from mapping
                    spec_code = spec_mapping.get((level_data["level"], ev_id))

                    # Log sample data for debugging
                    if evidence_count < 3:
                        print(f"    Evidence L{level_data['level']}.{ev_id}: text_en='{text_en[:60]}', spec={spec_code}")

                    await db.execute(
                        text("""
                            INSERT INTO ndi_acceptance_evidence
                            (id, maturity_level_id, evidence_id, text_en, text_ar, inherits_from_level, specification_code, sort_order)
                            VALUES (:id, :maturity_level_id, :evidence_id, :text_en, :text_ar, :inherits_from_level, :specification_code, :sort_order)
                        """),
                        {
                            "id": uuid.uuid4(),
                            "maturity_level_id": level_id,
                            "evidence_id": ev_id,
                            "text_en": text_en,
                            "text_ar": text_ar,
                            "inherits_from_level": inherits_from,
                            "specification_code": spec_code,
                            "sort_order": ev_idx,
                        }
                    )
                    evidence_count += 1
                    if spec_code:
                        spec_count += 1

        await db.commit()

        return {
            "status": "success",
            "message": "NDI data seeded successfully",
            "metadata": {
                "version": metadata.get("version"),
                "source": metadata.get("source"),
            },
            "counts": {
                "domains": len(data["domains"]),
                "questions": questions_count,
                "maturity_levels": levels_count,
                "acceptance_evidence": evidence_count,
                "with_specification_code": spec_count,
            }
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
        counts = {}

        # Count NDI data
        for table, key in [
            ("ndi_domains", "ndi_domains"),
            ("ndi_questions", "ndi_questions"),
            ("ndi_maturity_levels", "ndi_maturity_levels"),
            ("ndi_acceptance_evidence", "ndi_acceptance_evidence"),
        ]:
            try:
                result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                counts[key] = result.scalar() or 0
            except:
                counts[key] = 0

        # Count other data
        for table, key in [
            ("ai_provider_configs", "ai_providers"),
            ("assessments", "assessments"),
            ("assessment_responses", "assessment_responses"),
            ("tasks", "tasks"),
            ("users", "users"),
        ]:
            try:
                result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                counts[key] = result.scalar() or 0
            except:
                counts[key] = 0

        # Count specification codes in evidence
        try:
            result = await db.execute(text(
                "SELECT COUNT(DISTINCT specification_code) FROM ndi_acceptance_evidence WHERE specification_code IS NOT NULL"
            ))
            counts["unique_specification_codes"] = result.scalar() or 0
        except:
            counts["unique_specification_codes"] = 0

        return {
            "status": "healthy",
            "data": counts,
            "ndi_data_seeded": counts.get("ndi_domains", 0) > 0,
            "ai_providers_initialized": counts.get("ai_providers", 0) > 0,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.delete("/reset-assessments")
async def reset_assessments(db: AsyncSession = Depends(get_db)):
    """
    Reset all assessments and related data (for testing)
    إعادة تعيين جميع التقييمات والبيانات ذات الصلة (للاختبار)
    """
    try:
        # Delete in order of dependencies
        await db.execute(text("DELETE FROM evidence"))
        await db.execute(text("DELETE FROM tasks"))
        await db.execute(text("DELETE FROM assessment_responses"))
        await db.execute(text("DELETE FROM assessments"))
        await db.commit()

        return {
            "status": "success",
            "message": "All assessments and related data have been reset"
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reset assessments: {str(e)}"
        )


@router.get("/debug-evidence")
async def debug_evidence(
    limit: int = Query(10, description="Number of samples to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Debug endpoint to check acceptance evidence data.
    Shows sample data to verify text_en, text_ar, and specification_code.
    """
    try:
        # Sample acceptance evidence with specification codes
        result = await db.execute(text("""
            SELECT ae.id, ae.evidence_id, ae.text_en, ae.text_ar,
                   ae.specification_code, ae.inherits_from_level,
                   ml.level as maturity_level,
                   q.code as question_code
            FROM ndi_acceptance_evidence ae
            JOIN ndi_maturity_levels ml ON ae.maturity_level_id = ml.id
            JOIN ndi_questions q ON ml.question_id = q.id
            ORDER BY q.code, ml.level, ae.evidence_id
            LIMIT :limit
        """), {"limit": limit})
        rows = result.fetchall()

        samples = []
        for row in rows:
            samples.append({
                "id": str(row[0]),
                "evidence_id": row[1],
                "text_en": row[2],
                "text_ar": row[3],
                "specification_code": row[4],
                "inherits_from_level": row[5],
                "maturity_level": row[6],
                "question_code": row[7],
            })

        # Count stats
        stats_result = await db.execute(text("""
            SELECT
                COUNT(*) as total,
                COUNT(CASE WHEN text_en IS NOT NULL AND text_en != '' THEN 1 END) as with_text_en,
                COUNT(CASE WHEN text_ar IS NOT NULL AND text_ar != '' THEN 1 END) as with_text_ar,
                COUNT(CASE WHEN specification_code IS NOT NULL THEN 1 END) as with_spec_code
            FROM ndi_acceptance_evidence
        """))
        stats = stats_result.fetchone()

        return {
            "stats": {
                "total_evidence": stats[0],
                "with_text_en": stats[1],
                "with_text_ar": stats[2],
                "with_specification_code": stats[3],
            },
            "samples": samples,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
