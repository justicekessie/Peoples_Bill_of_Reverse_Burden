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
from models import Bill, BillClause, BillSignature, Cluster, EditHistory, Submission, User, Vote


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


GHANA_REGIONS = {
    "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
    "Volta", "Oti", "Northern", "North East", "Savannah",
    "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Western North",
}


class SubmissionCreate(BaseModel):
    content: str = Field(..., min_length=10, max_length=5000)
    region: str
    age: Optional[int] = None
    occupation: Optional[str] = None
    language: str = "en"

    @validator("region")
    def valid_region(cls, v):
        if v not in GHANA_REGIONS:
            raise ValueError(f"Invalid region: {v}")
        return v


class SubmissionResponse(BaseModel):
    id: int
    bill_id: int
    content: str
    region: str
    status: str
    cluster_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class ClusterResponse(BaseModel):
    id: int
    bill_id: int
    theme: str
    summary: str
    representative_text: Optional[str]
    submission_count: int
    confidence_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class ClauseResponse(BaseModel):
    id: int
    bill_id: int
    section_number: int
    title: str
    content: str
    rationale: Optional[str]
    cluster_id: int
    legal_review_status: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


LEGAL_REVIEW_STATUSES = {"draft", "reviewed", "approved"}


class ClauseUpdate(BaseModel):
    section_number: Optional[int] = Field(None, ge=1)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    rationale: Optional[str] = None
    legal_review_status: Optional[str] = None
    change_reason: Optional[str] = None

    @validator("legal_review_status")
    def valid_status(cls, v):
        if v is not None and v not in LEGAL_REVIEW_STATUSES:
            raise ValueError(
                f"Invalid legal_review_status: {v}. "
                f"Must be one of {sorted(LEGAL_REVIEW_STATUSES)}"
            )
        return v


VOTE_VALUES = {"approve", "reject", "neutral"}


class VoteCreate(BaseModel):
    vote_value: str
    identifier: str = Field(..., min_length=5, max_length=200)
    identifier_type: str = Field(..., pattern="^(phone|email|national_id)$")
    region: Optional[str] = None
    comment: Optional[str] = Field(None, max_length=2000)

    @validator("vote_value")
    def valid_vote_value(cls, v):
        if v not in VOTE_VALUES:
            raise ValueError(
                f"Invalid vote_value: {v}. Must be one of {sorted(VOTE_VALUES)}"
            )
        return v

    @validator("identifier")
    def strip_identifier(cls, v):
        return v.strip().lower()

    @validator("comment")
    def trim_comment(cls, v):
        if v is None:
            return v
        stripped = v.strip()
        return stripped or None


class VoteResponse(BaseModel):
    id: int
    clause_id: int
    vote_value: str
    comment: Optional[str]
    region: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class VoteStatsResponse(BaseModel):
    clause_id: int
    total: int
    approve: int
    reject: int
    neutral: int
    approval_rate: float
    comment_count: int
    comments_enabled: bool
    recent_comments: List[VoteResponse]


class FullBillResponse(BaseModel):
    slug: str
    title: str
    summary: str
    stage: str
    total_sections: int
    full_text: str
    clauses: List[ClauseResponse]
    last_updated: datetime


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


# ============== Per-bill content endpoints ==============
#
# These replace the hardcoded-bill endpoints in main.py (`/api/submissions`,
# `/api/clusters`, `/api/bill/full`) by scoping everything under a slug. The
# rendered document reads its title and preamble from the Bill row instead of
# the "THE PEOPLE'S BILL ON REVERSE BURDEN" string literal.


@router.get("/{slug}/submissions", response_model=List[SubmissionResponse])
def list_submissions(
    slug: str,
    skip: int = 0,
    limit: int = 100,
    region: Optional[str] = None,
    submission_status: Optional[str] = None,
    cluster_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    bill = _get_bill_or_404(db, slug)
    query = db.query(Submission).filter(Submission.bill_id == bill.id)
    if region is not None:
        query = query.filter(Submission.region == region)
    if submission_status is not None:
        query = query.filter(Submission.status == submission_status)
    if cluster_id is not None:
        query = query.filter(Submission.cluster_id == cluster_id)
    return (
        query.order_by(Submission.created_at.desc()).offset(skip).limit(limit).all()
    )


@router.post(
    "/{slug}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_submission(
    slug: str,
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
):
    bill = _get_bill_or_404(db, slug)
    if bill.stage not in (STAGE_DRAFTING, STAGE_GATHERING):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot submit input: bill is in stage '{bill.stage}'. "
                "Submissions are accepted during gathering_signatures (early "
                "input) and drafting."
            ),
        )

    submission = Submission(
        bill_id=bill.id,
        content=payload.content,
        region=payload.region,
        age=payload.age,
        occupation=payload.occupation,
        language=payload.language,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/{slug}/clusters", response_model=List[ClusterResponse])
def list_clusters(slug: str, db: Session = Depends(get_db)):
    bill = _get_bill_or_404(db, slug)
    clusters = (
        db.query(Cluster)
        .filter(Cluster.bill_id == bill.id)
        .order_by(Cluster.submission_count.desc())
        .all()
    )
    return clusters


@router.get("/{slug}/clauses", response_model=List[ClauseResponse])
def list_clauses(slug: str, db: Session = Depends(get_db)):
    bill = _get_bill_or_404(db, slug)
    return (
        db.query(BillClause)
        .filter(BillClause.bill_id == bill.id)
        .order_by(BillClause.section_number)
        .all()
    )


CLAUSE_EDITABLE_FIELDS = ("section_number", "title", "content", "rationale", "legal_review_status")


@router.patch("/{slug}/clauses/{clause_id}", response_model=ClauseResponse)
def update_clause(
    slug: str,
    clause_id: int,
    payload: ClauseUpdate,
    db: Session = Depends(get_db),
    editor: User = Depends(get_moderator_user),
):
    """Edit a draft clause. Records each changed field in edit_history.

    Content changes also snapshot the previous content onto the clause and bump
    its version so older drafts are recoverable.
    """
    bill = _get_bill_or_404(db, slug)
    if bill.stage not in (STAGE_DRAFTING, STAGE_FINALIZED):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot edit clauses: bill is in stage '{bill.stage}'. "
                "Editing is allowed during drafting and finalized review."
            ),
        )

    clause = (
        db.query(BillClause)
        .filter(BillClause.id == clause_id, BillClause.bill_id == bill.id)
        .first()
    )
    if clause is None:
        raise HTTPException(status_code=404, detail="Clause not found")

    updates = payload.dict(exclude_unset=True)
    change_reason = updates.pop("change_reason", None)

    changed_fields: list[tuple[str, object, object]] = []
    for field in CLAUSE_EDITABLE_FIELDS:
        if field not in updates:
            continue
        new_value = updates[field]
        old_value = getattr(clause, field)
        if new_value == old_value:
            continue
        changed_fields.append((field, old_value, new_value))

    if not changed_fields:
        return clause

    for field, _old, new_value in changed_fields:
        setattr(clause, field, new_value)

    if any(field == "content" for field, _o, _n in changed_fields):
        old_content = next(old for field, old, _n in changed_fields if field == "content")
        clause.previous_version = old_content
        clause.version = (clause.version or 1) + 1

    if any(field == "legal_review_status" for field, _o, _n in changed_fields):
        clause.legal_reviewer_id = editor.id

    for field, old_value, new_value in changed_fields:
        db.add(
            EditHistory(
                clause_id=clause.id,
                editor_id=editor.id,
                field_changed=field,
                old_value=None if old_value is None else str(old_value),
                new_value=None if new_value is None else str(new_value),
                change_reason=change_reason,
            )
        )

    db.commit()
    db.refresh(clause)
    return clause


def _get_clause_or_404(db: Session, bill: Bill, clause_id: int) -> BillClause:
    clause = (
        db.query(BillClause)
        .filter(BillClause.id == clause_id, BillClause.bill_id == bill.id)
        .first()
    )
    if clause is None:
        raise HTTPException(status_code=404, detail="Clause not found")
    return clause


def _compute_vote_stats(
    db: Session, clause: BillClause, recent_comment_limit: int = 10
) -> VoteStatsResponse:
    votes = db.query(Vote).filter(Vote.clause_id == clause.id).all()
    counts = {"approve": 0, "reject": 0, "neutral": 0}
    comment_count = 0
    for vote in votes:
        counts[vote.vote_value] = counts.get(vote.vote_value, 0) + 1
        if vote.comment:
            comment_count += 1
    total = len(votes)
    decisive = counts["approve"] + counts["reject"]
    approval_rate = (counts["approve"] / decisive * 100.0) if decisive else 0.0

    recent_comments = (
        db.query(Vote)
        .filter(Vote.clause_id == clause.id, Vote.comment.isnot(None))
        .order_by(Vote.created_at.desc())
        .limit(recent_comment_limit)
        .all()
    )

    return VoteStatsResponse(
        clause_id=clause.id,
        total=total,
        approve=counts["approve"],
        reject=counts["reject"],
        neutral=counts["neutral"],
        approval_rate=round(approval_rate, 1),
        comment_count=comment_count,
        comments_enabled=bool(clause.public_comments_enabled),
        recent_comments=recent_comments,
    )


@router.get(
    "/{slug}/clauses/{clause_id}/votes/stats",
    response_model=VoteStatsResponse,
)
def get_clause_vote_stats(slug: str, clause_id: int, db: Session = Depends(get_db)):
    bill = _get_bill_or_404(db, slug)
    clause = _get_clause_or_404(db, bill, clause_id)
    return _compute_vote_stats(db, clause)


@router.post(
    "/{slug}/clauses/{clause_id}/votes",
    response_model=VoteStatsResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_clause_vote(
    slug: str,
    clause_id: int,
    payload: VoteCreate,
    db: Session = Depends(get_db),
):
    """Record one public vote on a clause.

    The voter's identifier is hashed so the same person can't double-vote on a
    clause. Comments are accepted only when the clause has public comments
    enabled. Returns the updated vote stats for the clause so clients can
    refresh without a second round-trip.
    """
    bill = _get_bill_or_404(db, slug)
    if bill.stage not in (STAGE_DRAFTING, STAGE_FINALIZED):
        raise HTTPException(
            status_code=409,
            detail=(
                f"Cannot vote: bill is in stage '{bill.stage}'. "
                "Voting is open during drafting and finalized review."
            ),
        )

    clause = _get_clause_or_404(db, bill, clause_id)

    if payload.comment and not clause.public_comments_enabled:
        raise HTTPException(
            status_code=409,
            detail="Comments are disabled on this clause.",
        )

    voter_hash = _hash_identifier(payload.identifier_type, payload.identifier)

    existing = (
        db.query(Vote)
        .filter(Vote.clause_id == clause.id, Vote.voter_hash == voter_hash)
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="This identifier has already voted on this clause.",
        )

    vote = Vote(
        clause_id=clause.id,
        vote_value=payload.vote_value,
        comment=payload.comment,
        region=payload.region,
        voter_hash=voter_hash,
    )
    db.add(vote)
    db.commit()

    return _compute_vote_stats(db, clause)


@router.get("/{slug}/full", response_model=FullBillResponse)
def get_full_bill(slug: str, db: Session = Depends(get_db)):
    """Render the full bill document from the Bill row and its clauses.

    The title and preamble come from the `bills` table, not a hardcoded
    constant — that's the whole point of step 5.
    """
    bill = _get_bill_or_404(db, slug)
    clauses = (
        db.query(BillClause)
        .filter(BillClause.bill_id == bill.id)
        .order_by(BillClause.section_number)
        .all()
    )

    parts = [bill.title.upper(), ""]
    if bill.preamble:
        parts.extend([bill.preamble, ""])
    else:
        parts.extend([bill.summary, ""])
    for clause in clauses:
        parts.append(f"SECTION {clause.section_number}: {clause.title}")
        parts.append(clause.content)
        parts.append("")

    return FullBillResponse(
        slug=bill.slug,
        title=bill.title,
        summary=bill.summary,
        stage=bill.stage,
        total_sections=len(clauses),
        full_text="\n".join(parts).rstrip() + "\n",
        clauses=clauses,
        last_updated=bill.updated_at or bill.created_at,
    )
