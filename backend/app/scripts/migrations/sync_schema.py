"""Sync database schema with models.

This migration ensures all columns exist in the database tables.
Run with: cd /app/backend && python -m app.scripts.migrations.sync_schema
"""
import asyncio
from sqlalchemy import text
from app.database import async_session_maker, init_db


# Define columns that may need to be added
SCHEMA_UPDATES = [
    # ndi_acceptance_evidence - add inherits_from_level
    {
        "table": "ndi_acceptance_evidence",
        "column": "inherits_from_level",
        "type": "INTEGER",
        "nullable": True,
    },
    # ndi_domains - add icon if missing
    {
        "table": "ndi_domains",
        "column": "icon",
        "type": "VARCHAR(50)",
        "nullable": True,
    },
    # ndi_domains - add color if missing
    {
        "table": "ndi_domains",
        "column": "color",
        "type": "VARCHAR(20)",
        "nullable": True,
    },
    # ndi_domains - add is_oe_domain if missing
    {
        "table": "ndi_domains",
        "column": "is_oe_domain",
        "type": "BOOLEAN",
        "nullable": False,
        "default": "FALSE",
    },
]

# Tables that should exist
REQUIRED_TABLES = [
    "ndi_domains",
    "ndi_questions",
    "ndi_maturity_levels",
    "ndi_acceptance_evidence",
    "ndi_evidence_specification_mapping",
    "ndi_specifications",
    "assessments",
    "assessment_responses",
    "evidence",
    "tasks",
    "users",
    "settings",
    "organization_settings",
    "ai_provider_configs",
]


async def check_table_exists(session, table_name: str) -> bool:
    """Check if a table exists."""
    result = await session.execute(
        text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = :table_name
            )
        """),
        {"table_name": table_name}
    )
    return result.scalar()


async def check_column_exists(session, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    result = await session.execute(
        text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = :table_name
            AND column_name = :column_name
        """),
        {"table_name": table_name, "column_name": column_name}
    )
    return result.scalar_one_or_none() is not None


async def add_column(session, table: str, column: str, col_type: str, nullable: bool, default: str = None):
    """Add a column to a table."""
    null_clause = "NULL" if nullable else "NOT NULL"
    default_clause = f"DEFAULT {default}" if default else ""

    sql = f"ALTER TABLE {table} ADD COLUMN {column} {col_type} {null_clause} {default_clause}"
    await session.execute(text(sql.strip()))


async def migrate():
    """Run schema migrations."""
    print("=" * 60)
    print("Schema Sync Migration")
    print("=" * 60)

    await init_db()

    async with async_session_maker() as session:
        try:
            # Check required tables
            print("\n--- Checking Required Tables ---")
            missing_tables = []
            for table in REQUIRED_TABLES:
                exists = await check_table_exists(session, table)
                status = "✅" if exists else "❌ MISSING"
                print(f"  {table}: {status}")
                if not exists:
                    missing_tables.append(table)

            if missing_tables:
                print(f"\n⚠️  Missing tables: {', '.join(missing_tables)}")
                print("   Run database initialization first (create_all)")

            # Check and add columns
            print("\n--- Checking Column Schema ---")
            changes_made = 0

            for update in SCHEMA_UPDATES:
                table = update["table"]
                column = update["column"]

                # First check if table exists
                if not await check_table_exists(session, table):
                    print(f"  ⚠️  Table '{table}' doesn't exist, skipping column check")
                    continue

                exists = await check_column_exists(session, table, column)

                if exists:
                    print(f"  ✓ {table}.{column} exists")
                else:
                    print(f"  + Adding {table}.{column}...")
                    await add_column(
                        session,
                        table,
                        column,
                        update["type"],
                        update["nullable"],
                        update.get("default")
                    )
                    changes_made += 1
                    print(f"    ✅ Added")

            await session.commit()

            print("\n" + "=" * 60)
            if changes_made > 0:
                print(f"✅ Schema sync complete! {changes_made} column(s) added.")
            else:
                print("✅ Schema is already up to date!")
            print("=" * 60)

        except Exception as e:
            await session.rollback()
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    asyncio.run(migrate())
