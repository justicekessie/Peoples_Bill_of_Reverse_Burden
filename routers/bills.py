"""
Bill origination, signing, and stage-machine endpoints.

Phase 1, step 3 of the multi-bill refactor. Exposes the endpoints needed for
citizens to originate bills, collect signatures, and have moderators promote
them into drafting.

Stage machine:
    proposed --(moderator activates)-->       gathering_signatures
    gathering_signatures --(>= threshold)-->  drafting
    drafting --(admin finalizes)-->           finalized
    any --(moderator archives)-->             archived

Not yet implemented (deferred):
  - Real OTP verification for signatures (step 4). For now /verify flips the
    signature to verified without checking a code.
  - Citizen self-registration. Today any authenticated User can originate; in
    step 4 we'll add a lightweight citizen signup flow.
  - Finalize / archive endpoints (step 5+).
"""

import hashlib
import re
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from sqlalchemy.orm import Session

from auth import get_current_user, get_moderator_user
from database import get_db
from models import Bill, BillSignature, User


router = APIRouter(prefix="/api/bills", tags=["bills"])


# ============== Stage machine ==============

STAGE_PROPOSED = "proposed"
STAGE_GATHERING = "gathering_signatures"
STAGE_DRAFTING = "drafting"
STAGE_FINALIZED = "finalized"
STAGE_ARCHIVED = "archived"

VALID_STAGES = {
    STAGE_PROPOSED,
    STAGE_GATHERING,
    STAGE_DRAFTING,
    STAGE_FINALIZED,
    STAGE_ARCHIVED,
}


# ============== Pydantic schemas ==============


class BillCreate(BaseModel):
    title: str = Field(..., min_length=10, max_length=300)
    summary: str = Field(..., min_length=50, max_length=5000)


class BillResponse(BaseModel):
    id: int
    slug: str
    title: str
    summary: str
    stage: str
    signature_threshold: int
    signature_count: int
    originator_user_id: Optional[int]
    created_at: datetime
    promoted_to_drafting_at: Optional[datetime]

    class Config:
        from_attributes = True


class BillSignRequest(BaseModel):
    identifier: str = Field(..., min_length=5, max_length=200)
    identifier_type: str = Field(..., pattern="^(phone|email|national_id)$")
    region: Optional[str] = None

    @validator("identifier")
    def strip_identifier(cls, v):
        return v.strip().lower()


class BillSignResponse(BaseModel):
    signature_id: int
    bill_id: int
    verified: bool
    message: str


class BillVerifyRequest(BaseModel):
    # Placeholder — step 4 will add a `code` field and validate it against an
    # OTP provider. For now any call verifies the signature.
    pass


# ============== Helpers ==============


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug[:100] or "bill"


def _unique_slug(db: Session, base: str) -> str:
    slug = base
    suffix = 2
    while db.query(Bill).filter(Bill.slug == slug).first() is not None:
        slug = f"{base}-{suffix}"
        suffix += 1
    return slug


def _hash_identifier(identifier_type: str, identifier: str) -> str:
    # Namespace the hash with the identifier type so a phone and an email that
    # happen to share a string can't collide.
    return hashlib.sha256(f"{identifier_type}:{identifier}".encode()).hexdigest()


def _get_bill_or_404(db: Session, slug: str) -> Bill:
    bill = db.query(Bill).filter(Bill.slug == slug).first()
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill


# ============== Endpoints ==============


@router.post("", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(
    payload: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Originate a new bill proposal. Starts in `proposed` stage."""
    slug = _unique_slug(db, _slugify(payload.title))

    bill = Bill(
        slug=slug,
        title=payload.title,
        summary=payload.summary,
        originator_user_id=current_user.id,
        stage=STAGE_PROPOSED,
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


@router.get("", response_model=List[BillResponse])
def list_bills(
    stage: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Bill)
    if stage is not None:
        if stage not in VALID_STAGES:
            raise HTTPException(status_code=400, detail=f"Invalid stage: {stage}")
        query = query.filter(Bill.stage == stage)
    return query.order_by(Bill.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{slug}", response_model=BillResponse)
def get_bill(slug: str, db: Session = Depends(get_db)):
    return _get_bill_or_404(db, slug)


@router.post("/{slug}/activate", response_model=BillResponse)
def activate_bill(
    slug: str,
    db: Session = Depends(get_db),
    _moderator: User = Depends(get_moderator_user),
):
    """Moderator moves a proposal from `proposed` into `gathering_signatures`."""
    bill = _get_bill_or_404(db, slug)
    if bill.stage != STAGE_PROPOSED:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot activate: bill is in stage '{bill.stage}'",
        )
    bill.stage = STAGE_GATHERING
    db.commit()
    db.refresh(bill)
    return bill


@router.post("/{slug}/sign", response_model=BillSignResponse, status_code=status.HTTP_201_CREATED)
def sign_bill(
    slug: str,
    payload: BillSignRequest,
    db: Session = Depends(get_db),
):
    """Record a signature. Signatures are unverified until /verify runs.

    Only verified signatures count toward the threshold, so an unverified
    signature is effectively a pending claim.
    """
    bill = _get_bill_or_404(db, slug)
    if bill.stage != STAGE_GATHERING:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot sign: bill is in stage '{bill.stage}'",
        )

    signer_hash = _hash_identifier(payload.identifier_type, payload.identifier)

    existing = (
        db.query(BillSignature)
        .filter(
            BillSignature.bill_id == bill.id,
            BillSignature.signer_hash == signer_hash,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409, detail="This identifier has already signed this bill"
        )

    signature = BillSignature(
        bill_id=bill.id,
        signer_hash=signer_hash,
        region=payload.region,
        verified=False,
    )
    db.add(signature)
    db.commit()
    db.refresh(signature)

    return BillSignResponse(
        signature_id=signature.id,
        bill_id=bill.id,
        verified=False,
        message="Signature recorded. Verify via /verify to count toward the threshold.",
    )


@router.post("/{slug}/signatures/{signature_id}/verify", response_model=BillSignResponse)
def verify_signature(
    slug: str,
    signature_id: int,
    _payload: BillVerifyRequest,
    db: Session = Depends(get_db),
):
    """Verify a signature.

    Placeholder — step 4 will validate an OTP code here. For now the endpoint
    simply marks the signature as verified and increments the bill's
    signature_count.
    """
    bill = _get_bill_or_404(db, slug)

    signature = (
        db.query(BillSignature)
        .filter(
            BillSignature.id == signature_id,
            BillSignature.bill_id == bill.id,
        )
        .first()
    )
    if signature is None:
        raise HTTPException(status_code=404, detail="Signature not found")

    if signature.verified:
        return BillSignResponse(
            signature_id=signature.id,
            bill_id=bill.id,
            verified=True,
            message="Signature already verified.",
        )

    signature.verified = True
    signature.verification_method = "placeholder"
    signature.verified_at = datetime.utcnow()
    bill.signature_count = (bill.signature_count or 0) + 1
    db.commit()
    db.refresh(signature)

    return BillSignResponse(
        signature_id=signature.id,
        bill_id=bill.id,
        verified=True,
        message="Signature verified.",
    )


@router.post("/{slug}/promote", response_model=BillResponse)
def promote_bill(
    slug: str,
    db: Session = Depends(get_db),
    _moderator: User = Depends(get_moderator_user),
):
    """Move a bill from `gathering_signatures` to `drafting` once the
    verified-signature threshold is met."""
    bill = _get_bill_or_404(db, slug)
    if bill.stage != STAGE_GATHERING:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot promote: bill is in stage '{bill.stage}'",
        )
    if bill.signature_count < bill.signature_threshold:
        raise HTTPException(
            status_code=409,
            detail=(
                f"Signature threshold not met: "
                f"{bill.signature_count}/{bill.signature_threshold}"
            ),
        )

    bill.stage = STAGE_DRAFTING
    bill.promoted_to_drafting_at = datetime.utcnow()
    db.commit()
    db.refresh(bill)
    return bill
