"""Seed NDI data into database."""
import asyncio
import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker, init_db
from app.models.ndi import NDIDomain, NDIQuestion, NDIMaturityLevel


# Path to data files
DATA_DIR = Path(__file__).parent.parent.parent.parent / "data"


async def seed_domains(session: AsyncSession) -> dict[str, NDIDomain]:
    """Seed NDI domains."""
    domains_file = DATA_DIR / "domains.json"
    with open(domains_file, "r", encoding="utf-8") as f:
        domains_data = json.load(f)

    domain_map = {}
    for data in domains_data:
        # Check if domain already exists
        result = await session.execute(
            select(NDIDomain).where(NDIDomain.code == data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            domain_map[data["code"]] = existing
            print(f"Domain {data['code']} already exists, skipping...")
            continue

        domain = NDIDomain(
            code=data["code"],
            name_en=data["name_en"],
            name_ar=data["name_ar"],
            description_en=data.get("description_en"),
            description_ar=data.get("description_ar"),
            question_count=data.get("question_count"),
            is_oe_domain=data.get("is_oe_domain", False),
            sort_order=data.get("sort_order", 0),
        )
        session.add(domain)
        domain_map[data["code"]] = domain
        print(f"Created domain: {data['code']} - {data['name_en']}")

    await session.flush()
    return domain_map


async def seed_questions(
    session: AsyncSession, domain_map: dict[str, NDIDomain]
) -> dict[str, NDIQuestion]:
    """Seed NDI questions."""
    questions_file = DATA_DIR / "questions.json"
    with open(questions_file, "r", encoding="utf-8") as f:
        questions_data = json.load(f)

    question_map = {}
    for data in questions_data:
        # Check if question already exists
        result = await session.execute(
            select(NDIQuestion).where(NDIQuestion.code == data["code"])
        )
        existing = result.scalar_one_or_none()

        if existing:
            question_map[data["code"]] = existing
            print(f"Question {data['code']} already exists, skipping...")
            continue

        domain = domain_map.get(data["domain_code"])
        if not domain:
            print(f"Domain {data['domain_code']} not found, skipping question {data['code']}")
            continue

        question = NDIQuestion(
            domain_id=domain.id,
            code=data["code"],
            question_en=data["question_en"],
            question_ar=data["question_ar"],
            sort_order=data.get("sort_order", 0),
        )
        session.add(question)
        question_map[data["code"]] = question
        print(f"Created question: {data['code']}")

    await session.flush()
    return question_map


async def seed_maturity_levels(
    session: AsyncSession, question_map: dict[str, NDIQuestion]
) -> None:
    """Seed maturity levels for all questions."""
    levels_file = DATA_DIR / "maturity_levels.json"
    with open(levels_file, "r", encoding="utf-8") as f:
        levels_data = json.load(f)

    level_info = {l["level"]: l for l in levels_data["levels"]}
    level_descriptions = levels_data["level_descriptions"]

    for question_code, question in question_map.items():
        for level_num in range(6):  # Levels 0-5
            # Check if level already exists
            result = await session.execute(
                select(NDIMaturityLevel)
                .where(NDIMaturityLevel.question_id == question.id)
                .where(NDIMaturityLevel.level == level_num)
            )
            existing = result.scalar_one_or_none()

            if existing:
                continue

            info = level_info.get(level_num, {})
            desc = level_descriptions.get(str(level_num), {})

            level = NDIMaturityLevel(
                question_id=question.id,
                level=level_num,
                name_en=info.get("name_en", f"Level {level_num}"),
                name_ar=info.get("name_ar", f"المستوى {level_num}"),
                description_en=desc.get("description_en", ""),
                description_ar=desc.get("description_ar", ""),
                acceptance_evidence_en=None,
                acceptance_evidence_ar=None,
                related_specifications=None,
            )
            session.add(level)

        print(f"Created maturity levels for: {question_code}")

    await session.flush()


async def main():
    """Main seed function."""
    print("Initializing database...")
    await init_db()

    print("\nSeeding NDI data...")
    async with async_session_maker() as session:
        try:
            # Seed in order
            print("\n--- Seeding Domains ---")
            domain_map = await seed_domains(session)

            print("\n--- Seeding Questions ---")
            question_map = await seed_questions(session, domain_map)

            print("\n--- Seeding Maturity Levels ---")
            await seed_maturity_levels(session, question_map)

            # Commit all changes
            await session.commit()
            print("\n✅ NDI data seeded successfully!")

            # Print summary
            print(f"\nSummary:")
            print(f"  - Domains: {len(domain_map)}")
            print(f"  - Questions: {len(question_map)}")
            print(f"  - Maturity Levels: {len(question_map) * 6}")

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Error seeding data: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(main())
