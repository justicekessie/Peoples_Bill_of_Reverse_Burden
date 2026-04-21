"""
Migration 002: Add bill_id foreign key to submissions, clusters, bill_clauses.

Phase 1, step 2 of the multi-bill refactor.

Adds a `bill_id` column to the three existing content tables, backfills every
existing row to `bill_id = 1` (the Reverse Burden bill seeded by migration
001), and promotes the column to NOT NULL + FOREIGN KEY on Postgres.

SQLite is treated as dev-only (see database.py). On SQLite we add the column
and backfill but skip the NOT NULL / FK constraint alteration, since SQLite
cannot add those constraints without rebuilding the table. The ORM layer still
enforces `nullable=False`.

Idempotent: safe to run multiple times.

Run:
    python migrations/002_add_bill_id_fk.py
"""

from sqlalchemy import inspect, text

from database import engine
from models import Bill


TABLES = ("submissions", "clusters", "bill_clauses")

DEFAULT_BILL_ID = 1


def column_exists(inspector, table_name, column_name):
    return any(c["name"] == column_name for c in inspector.get_columns(table_name))


def backfill_table(conn, table_name, bill_id):
    conn.execute(
        text(f"UPDATE {table_name} SET bill_id = :bid WHERE bill_id IS NULL"),
        {"bid": bill_id},
    )


def run():
    dialect = engine.dialect.name
    inspector = inspect(engine)

    # Safety check: the target bill must exist before backfilling.
    with engine.connect() as conn:
        bill = conn.execute(
            text("SELECT id FROM bills WHERE id = :bid"),
            {"bid": DEFAULT_BILL_ID},
        ).first()
        if bill is None:
            raise RuntimeError(
                f"Bill id={DEFAULT_BILL_ID} not found. "
                "Run migrations/001_seed_reverse_burden_bill.py first."
            )

    with engine.begin() as conn:
        for table in TABLES:
            if table not in inspector.get_table_names():
                print(f"  ! Table '{table}' does not exist — skipping")
                continue

            if column_exists(inspector, table, "bill_id"):
                print(f"  · {table}.bill_id already exists — backfilling NULLs only")
                backfill_table(conn, table, DEFAULT_BILL_ID)
                continue

            print(f"  + adding {table}.bill_id")
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN bill_id INTEGER"))

            print(f"  · backfilling {table}.bill_id = {DEFAULT_BILL_ID}")
            backfill_table(conn, table, DEFAULT_BILL_ID)

            if dialect == "postgresql":
                print(f"  · setting {table}.bill_id NOT NULL + FK")
                conn.execute(
                    text(f"ALTER TABLE {table} ALTER COLUMN bill_id SET NOT NULL")
                )
                conn.execute(
                    text(
                        f"ALTER TABLE {table} "
                        f"ADD CONSTRAINT fk_{table}_bill "
                        f"FOREIGN KEY (bill_id) REFERENCES bills(id)"
                    )
                )
                conn.execute(
                    text(
                        f"CREATE INDEX IF NOT EXISTS ix_{table}_bill_id "
                        f"ON {table} (bill_id)"
                    )
                )
            else:
                print(
                    f"  · dialect={dialect}: skipping NOT NULL/FK "
                    "(ORM enforces nullable=False)"
                )

    print("✓ Migration 002 complete")


if __name__ == "__main__":
    run()
