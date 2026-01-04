"""Add inherits_from_level column to ndi_acceptance_evidence table.

Run this migration with:
    cd /app/backend && python -m app.scripts.migrations.add_inherits_from_level
"""
import asyncio
from sqlalchemy import text
from app.database import async_session_maker, init_db


async def migrate():
    """Add inherits_from_level column if it doesn't exist."""
    print("Running migration: add_inherits_from_level")

    await init_db()

    async with async_session_maker() as session:
        try:
            # Check if column already exists
            result = await session.execute(
                text("""
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_name = 'ndi_acceptance_evidence'
                    AND column_name = 'inherits_from_level'
                """)
            )
            exists = result.scalar_one_or_none()

            if exists:
                print("Column 'inherits_from_level' already exists. Skipping.")
                return

            # Add the new column
            await session.execute(
                text("""
                    ALTER TABLE ndi_acceptance_evidence
                    ADD COLUMN inherits_from_level INTEGER NULL
                """)
            )
            await session.commit()
            print("✅ Added column 'inherits_from_level' to ndi_acceptance_evidence table.")

        except Exception as e:
            await session.rollback()
            print(f"❌ Migration failed: {e}")
            raise


if __name__ == "__main__":
    asyncio.run(migrate())
