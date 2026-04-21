"""
Migration 001: Seed the Reverse Burden bill as id=1.

Phase 1, step 1 of the multi-bill refactor.

Creates the `bills` and `bill_signatures` tables (via Base.metadata.create_all)
and inserts the original "Reverse Burden" bill so that subsequent migrations
can backfill existing submissions / clusters / bill_clauses by setting
`bill_id = 1`.

Idempotent: safe to run multiple times.

Run:
    python migrations/001_seed_reverse_burden_bill.py
"""

from datetime import datetime

from database import SessionLocal, engine
from models import Base, Bill


REVERSE_BURDEN_SLUG = "reverse-burden"

REVERSE_BURDEN_TITLE = "The People's Bill on Reverse Burden"

REVERSE_BURDEN_SUMMARY = (
    "An Act to require public officers to explain wealth disproportionate to "
    "their lawful income and to provide for the confiscation of unexplained "
    "assets."
)

REVERSE_BURDEN_PREAMBLE = (
    "A BILL ENTITLED\n\n"
    "An Act to require public officers to explain wealth disproportionate to "
    "their lawful income and to provide for the confiscation of unexplained "
    "assets.\n\n"
    "BE IT ENACTED by the Parliament of Ghana as follows:"
)


def run():
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(Bill).filter(Bill.slug == REVERSE_BURDEN_SLUG).first()
        if existing:
            print(f"✓ Reverse Burden bill already seeded (id={existing.id})")
            return

        bill = Bill(
            slug=REVERSE_BURDEN_SLUG,
            title=REVERSE_BURDEN_TITLE,
            summary=REVERSE_BURDEN_SUMMARY,
            preamble=REVERSE_BURDEN_PREAMBLE,
            stage="drafting",
            signature_threshold=100,
            signature_count=0,
            promoted_to_drafting_at=datetime.utcnow(),
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)

        print(f"✓ Seeded Reverse Burden bill (id={bill.id}, slug={bill.slug})")
        print(
            "  Existing submissions, clusters, and bill_clauses can be "
            f"backfilled to bill_id={bill.id} in the next migration."
        )

    except Exception as e:
        db.rollback()
        print(f"✗ Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
