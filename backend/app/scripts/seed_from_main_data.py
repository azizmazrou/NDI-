"""Seed NDI data from main-data.json into database."""
import asyncio
import json
import uuid
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker, init_db


# Path to main-data.json
DATA_FILE = Path(__file__).parent.parent.parent.parent / "data" / "main-data.json"

# Domain descriptions (not in main-data.json but needed)
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


async def check_column_exists(session: AsyncSession, table: str, column: str) -> bool:
    """Check if a column exists in a table."""
    result = await session.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table AND column_name = :column
        """),
        {"table": table, "column": column}
    )
    return result.scalar_one_or_none() is not None


async def ensure_schema(session: AsyncSession) -> None:
    """Ensure database schema has all required columns."""
    print("Checking database schema...")
    changes = 0

    # Schema updates needed
    schema_updates = [
        ("ndi_acceptance_evidence", "inherits_from_level", "INTEGER NULL"),
        ("ndi_domains", "icon", "VARCHAR(50) NULL"),
        ("ndi_domains", "color", "VARCHAR(20) NULL"),
        ("ndi_domains", "is_oe_domain", "BOOLEAN NOT NULL DEFAULT FALSE"),
    ]

    for table, column, col_def in schema_updates:
        if not await check_column_exists(session, table, column):
            print(f"  Adding '{table}.{column}'...")
            await session.execute(
                text(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}")
            )
            changes += 1

    if changes > 0:
        await session.commit()
        print(f"  ✅ Added {changes} column(s).")
    else:
        print("  Schema is up to date.")


async def clear_existing_data(session: AsyncSession) -> None:
    """Clear existing NDI data to avoid duplicates."""
    print("Clearing existing NDI data...")

    # Delete in reverse order of dependencies
    await session.execute(text("DELETE FROM ndi_evidence_specification_mapping"))
    await session.execute(text("DELETE FROM ndi_acceptance_evidence"))
    await session.execute(text("DELETE FROM ndi_maturity_levels"))
    await session.execute(text("DELETE FROM ndi_questions"))
    await session.execute(text("DELETE FROM ndi_specifications"))
    await session.execute(text("DELETE FROM ndi_domains"))

    await session.commit()
    print("Existing data cleared.")


async def seed_domains(session: AsyncSession, domains_data: list) -> dict:
    """Seed NDI domains using raw SQL to match actual DB schema."""
    domain_map = {}

    for idx, data in enumerate(domains_data, start=1):
        code = data["code"]
        extra = DOMAIN_DESCRIPTIONS.get(code, {})
        domain_id = uuid.uuid4()

        # Use raw SQL to insert only columns that exist in DB
        await session.execute(
            text("""
                INSERT INTO ndi_domains (id, code, name_en, name_ar, description_en, description_ar, question_count, is_oe_domain, sort_order)
                VALUES (:id, :code, :name_en, :name_ar, :description_en, :description_ar, :question_count, :is_oe_domain, :sort_order)
            """),
            {
                "id": domain_id,
                "code": code,
                "name_en": data["name_en"],
                "name_ar": data["name_ar"],
                "description_en": extra.get("description_en", ""),
                "description_ar": extra.get("description_ar", ""),
                "question_count": data.get("question_count", 0),
                "is_oe_domain": extra.get("is_oe_domain", False),
                "sort_order": idx,
            }
        )
        domain_map[code] = domain_id
        print(f"  Created domain: {code} - {data['name_en']}")

    await session.flush()
    return domain_map


async def seed_questions_and_levels(
    session: AsyncSession,
    questions_data: list,
    domain_map: dict
) -> None:
    """Seed NDI questions and their maturity levels using raw SQL."""

    for q_idx, q_data in enumerate(questions_data, start=1):
        domain_code = q_data["domain_code"]
        domain_id = domain_map.get(domain_code)

        if not domain_id:
            print(f"  Warning: Domain {domain_code} not found, skipping question {q_data['code']}")
            continue

        # Create question using raw SQL
        question_id = uuid.uuid4()
        await session.execute(
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

        print(f"  Created question: {q_data['code']}")

        # Create maturity levels for this question
        for level_data in q_data.get("levels", []):
            level_id = uuid.uuid4()
            await session.execute(
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

            # Create acceptance evidence records (including inherited ones)
            ev_counter = 1
            for ev in level_data.get("acceptance_evidence", []):
                await session.execute(
                    text("""
                        INSERT INTO ndi_acceptance_evidence (id, maturity_level_id, evidence_id, text_en, text_ar, inherits_from_level, sort_order)
                        VALUES (:id, :maturity_level_id, :evidence_id, :text_en, :text_ar, :inherits_from_level, :sort_order)
                    """),
                    {
                        "id": uuid.uuid4(),
                        "maturity_level_id": level_id,
                        "evidence_id": ev.get("id", ev_counter),
                        "text_en": ev.get("text_en", ""),
                        "text_ar": ev.get("text_ar", ""),
                        "inherits_from_level": ev.get("inherits_from_level"),  # None if not inherited
                        "sort_order": ev_counter,
                    }
                )
                ev_counter += 1

        print(f"    Created {len(q_data.get('levels', []))} maturity levels")


async def main():
    """Main seed function."""
    print("=" * 60)
    print("NDI Data Seeder - Using main-data.json")
    print("=" * 60)

    # Load data
    print(f"\nLoading data from: {DATA_FILE}")
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    metadata = data.get("metadata", {})
    print(f"  Version: {metadata.get('version')}")
    print(f"  Source: {metadata.get('source')}")
    print(f"  Total Domains: {metadata.get('total_domains')}")
    print(f"  Total Questions: {metadata.get('total_questions')}")

    # Initialize database
    print("\nInitializing database connection...")
    await init_db()

    async with async_session_maker() as session:
        try:
            # Ensure schema is up to date
            await ensure_schema(session)

            # Clear existing data
            await clear_existing_data(session)

            # Seed domains
            print("\n--- Seeding Domains ---")
            domain_map = await seed_domains(session, data["domains"])

            # Seed questions and maturity levels
            print("\n--- Seeding Questions & Maturity Levels ---")
            await seed_questions_and_levels(session, data["questions"], domain_map)

            # Commit all changes
            await session.commit()

            print("\n" + "=" * 60)
            print("✅ NDI data seeded successfully!")
            print("=" * 60)

            # Calculate evidence count
            total_evidence = sum(
                len(level.get("acceptance_evidence", []))
                for q in data["questions"]
                for level in q.get("levels", [])
            )

            # Print summary
            print(f"\nSummary:")
            print(f"  - Domains: {len(data['domains'])}")
            print(f"  - Questions: {len(data['questions'])}")
            print(f"  - Maturity Levels: {len(data['questions']) * 6} (6 per question)")
            print(f"  - Acceptance Evidence: {total_evidence}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding data: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(main())
