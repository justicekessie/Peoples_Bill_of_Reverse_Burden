"""
People's Bill Platform - Backend API
FastAPI application for citizen submissions and bill generation
"""

from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import uvicorn
from pydantic import BaseModel, validator
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules
from database import get_db, engine
from models import Base, Submission, Cluster, BillClause, User, Region, Vote
from auth import get_current_user, create_access_token, verify_password, get_password_hash
from ml_service import ClusteringService
from services import BillService, StatsService

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="People's Bill Platform API",
    description="Democratic legislation platform for Ghana",
    version="1.0.0"
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://peoplesbill.gh",
        "https://www.peoplesbill.gh"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
clustering_service = ClusteringService()
bill_service = BillService()
stats_service = StatsService()

# ============== PYDANTIC MODELS ==============

class SubmissionCreate(BaseModel):
    """Model for creating a new submission"""
    content: str
    region: str
    age: Optional[int] = None
    occupation: Optional[str] = None
    language: str = "en"
    
    @validator('content')
    def content_not_empty(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Submission must be at least 10 characters')
        if len(v) > 5000:
            raise ValueError('Submission must be less than 5000 characters')
        return v
    
    @validator('region')
    def valid_region(cls, v):
        valid_regions = [
            "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
            "Volta", "Oti", "Northern", "North East", "Savannah",
            "Upper East", "Upper West", "Bono", "Bono East", "Ahafo", "Western North"
        ]
        if v not in valid_regions:
            raise ValueError(f'Invalid region. Must be one of: {", ".join(valid_regions)}')
        return v

class SubmissionResponse(BaseModel):
    """Response model for submissions"""
    id: int
    content: str
    region: str
    created_at: datetime
    cluster_id: Optional[int]
    status: str
    
    class Config:
        from_attributes = True

class ClusterResponse(BaseModel):
    """Response model for clusters"""
    id: int
    theme: str
    summary: str
    submission_count: int
    representative_text: str
    confidence_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class BillClauseCreate(BaseModel):
    """Model for creating/updating bill clauses"""
    cluster_id: int
    section_number: int
    title: str
    content: str
    rationale: Optional[str] = None

class BillClauseResponse(BaseModel):
    """Response model for bill clauses"""
    id: int
    section_number: int
    title: str
    content: str
    rationale: Optional[str]
    cluster_id: int
    submission_count: int
    approval_rate: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    """Admin login request"""
    username: str
    password: str

class StatsResponse(BaseModel):
    """Platform statistics"""
    total_submissions: int
    total_contributors: int
    regions_represented: int
    clusters_formed: int
    clauses_drafted: int
    average_approval_rate: float
    submissions_by_region: dict
    submissions_over_time: List[dict]
    top_themes: List[dict]

# ============== PUBLIC ENDPOINTS ==============

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "People's Bill Platform API",
        "version": "1.0.0",
        "description": "Citizen-powered legislation for Ghana",
        "documentation": "/docs",
        "status": "operational"
    }

@app.post("/api/submissions", response_model=SubmissionResponse)
async def create_submission(
    submission: SubmissionCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new citizen submission.
    This is the main endpoint citizens use to contribute.
    """
    try:
        # Create submission in database
        db_submission = Submission(
            content=submission.content,
            region=submission.region,
            age=submission.age,
            occupation=submission.occupation,
            language=submission.language,
            status="pending"
        )
        db.add(db_submission)
        db.commit()
        db.refresh(db_submission)
        
        # Queue for clustering (async in production)
        # For now, we'll just save it
        
        return SubmissionResponse(
            id=db_submission.id,
            content=db_submission.content,
            region=db_submission.region,
            created_at=db_submission.created_at,
            cluster_id=db_submission.cluster_id,
            status=db_submission.status
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions", response_model=List[SubmissionResponse])
async def get_submissions(
    skip: int = 0,
    limit: int = 100,
    region: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all submissions with optional filtering"""
    query = db.query(Submission)
    
    if region:
        query = query.filter(Submission.region == region)
    if status:
        query = query.filter(Submission.status == status)
    
    submissions = query.offset(skip).limit(limit).all()
    return submissions

@app.get("/api/clusters", response_model=List[ClusterResponse])
async def get_clusters(
    db: Session = Depends(get_db)
):
    """Get all submission clusters with themes"""
    clusters = db.query(Cluster).all()
    
    # Add submission count for each cluster
    for cluster in clusters:
        cluster.submission_count = db.query(Submission).filter(
            Submission.cluster_id == cluster.id
        ).count()
    
    return clusters

@app.get("/api/bill/clauses", response_model=List[BillClauseResponse])
async def get_bill_clauses(
    db: Session = Depends(get_db)
):
    """Get all draft bill clauses"""
    clauses = db.query(BillClause).order_by(BillClause.section_number).all()
    
    # Add metrics for each clause
    for clause in clauses:
        # Get submission count from cluster
        cluster = db.query(Cluster).filter(Cluster.id == clause.cluster_id).first()
        if cluster:
            clause.submission_count = db.query(Submission).filter(
                Submission.cluster_id == cluster.id
            ).count()
        
        # Calculate approval rate from votes
        votes = db.query(Vote).filter(Vote.clause_id == clause.id).all()
        if votes:
            approvals = sum(1 for v in votes if v.vote_value == "approve")
            clause.approval_rate = (approvals / len(votes)) * 100
        else:
            clause.approval_rate = 0.0
    
    return clauses

@app.get("/api/bill/full")
async def get_full_bill(
    db: Session = Depends(get_db)
):
    """Get the full bill document with all clauses"""
    clauses = db.query(BillClause).order_by(BillClause.section_number).all()
    
    bill_text = "THE PEOPLE'S BILL ON REVERSE BURDEN\n\n"
    bill_text += "A BILL ENTITLED\n\n"
    bill_text += "An Act to require public officers to explain wealth disproportionate to their lawful income "
    bill_text += "and to provide for the confiscation of unexplained assets.\n\n"
    bill_text += "BE IT ENACTED by the Parliament of Ghana as follows:\n\n"
    
    for clause in clauses:
        bill_text += f"SECTION {clause.section_number}: {clause.title}\n"
        bill_text += f"{clause.content}\n\n"
    
    return {
        "title": "The People's Bill on Reverse Burden",
        "version": "1.0.0-draft",
        "last_updated": datetime.now(),
        "total_sections": len(clauses),
        "full_text": bill_text,
        "clauses": [
            {
                "section": c.section_number,
                "title": c.title,
                "content": c.content,
                "rationale": c.rationale
            }
            for c in clauses
        ]
    }

@app.get("/api/stats", response_model=StatsResponse)
async def get_statistics(
    db: Session = Depends(get_db)
):
    """Get platform statistics"""
    stats = stats_service.get_platform_stats(db)
    return stats

@app.post("/api/vote")
async def submit_vote(
    clause_id: int,
    vote: str,
    region: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Submit a vote on a bill clause"""
    if vote not in ["approve", "reject", "neutral"]:
        raise HTTPException(status_code=400, detail="Invalid vote value")
    
    db_vote = Vote(
        clause_id=clause_id,
        vote_value=vote,
        region=region
    )
    db.add(db_vote)
    db.commit()
    
    return {"status": "success", "message": "Vote recorded"}

# ============== ADMIN ENDPOINTS ==============

@app.post("/api/admin/login")
async def admin_login(
    login: LoginRequest,
    db: Session = Depends(get_db)
):
    """Admin login endpoint"""
    user = db.query(User).filter(User.username == login.username).first()
    
    if not user or not verify_password(login.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }

@app.post("/api/admin/cluster")
async def trigger_clustering(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually trigger AI clustering of submissions"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get unclustered submissions
        submissions = db.query(Submission).filter(
            Submission.cluster_id == None,
            Submission.status == "approved"
        ).all()
        
        if not submissions:
            return {"message": "No unclustered submissions found"}
        
        # Run clustering
        clusters = clustering_service.cluster_submissions(submissions)
        
        # Save clusters to database
        for cluster_data in clusters:
            cluster = Cluster(
                theme=cluster_data["theme"],
                summary=cluster_data["summary"],
                representative_text=cluster_data["representative_text"],
                confidence_score=cluster_data["confidence_score"]
            )
            db.add(cluster)
            db.flush()
            
            # Update submissions with cluster_id
            for sub_id in cluster_data["submission_ids"]:
                submission = db.query(Submission).filter(
                    Submission.id == sub_id
                ).first()
                if submission:
                    submission.cluster_id = cluster.id
        
        db.commit()
        
        return {
            "status": "success",
            "clusters_created": len(clusters),
            "submissions_processed": len(submissions)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: int,
    status: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update submission status (approve/reject/pending)"""
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Moderator access required")
    
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.status = status
    submission.reviewed_by = current_user.id
    submission.reviewed_at = datetime.now()
    db.commit()
    
    return {"status": "success", "new_status": status}

@app.post("/api/admin/clauses", response_model=BillClauseResponse)
async def create_bill_clause(
    clause: BillClauseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a bill clause from a cluster"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if clause already exists for this cluster
    existing = db.query(BillClause).filter(
        BillClause.cluster_id == clause.cluster_id
    ).first()
    
    if existing:
        # Update existing clause
        existing.section_number = clause.section_number
        existing.title = clause.title
        existing.content = clause.content
        existing.rationale = clause.rationale
        existing.updated_at = datetime.now()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new clause
        db_clause = BillClause(
            cluster_id=clause.cluster_id,
            section_number=clause.section_number,
            title=clause.title,
            content=clause.content,
            rationale=clause.rationale
        )
        db.add(db_clause)
        db.commit()
        db.refresh(db_clause)
        
        # Add computed fields
        db_clause.submission_count = db.query(Submission).filter(
            Submission.cluster_id == clause.cluster_id
        ).count()
        db_clause.approval_rate = 0.0
        
        return db_clause

@app.post("/api/admin/generate-clause/{cluster_id}")
async def generate_clause_from_cluster(
    cluster_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Use AI to generate a bill clause from a cluster"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    
    # Get submissions in this cluster
    submissions = db.query(Submission).filter(
        Submission.cluster_id == cluster_id
    ).all()
    
    # Generate clause using AI
    generated = bill_service.generate_clause(cluster, submissions)
    
    return {
        "cluster_id": cluster_id,
        "theme": cluster.theme,
        "generated_clause": generated["content"],
        "suggested_title": generated["title"],
        "rationale": generated["rationale"],
        "confidence": generated["confidence"]
    }

@app.get("/api/admin/dashboard")
async def admin_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get admin dashboard data"""
    if current_user.role not in ["admin", "moderator"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get pending submissions count
    pending = db.query(Submission).filter(
        Submission.status == "pending"
    ).count()
    
    # Get today's submissions
    today = datetime.now().date()
    today_submissions = db.query(Submission).filter(
        Submission.created_at >= today
    ).count()
    
    # Get recent submissions for review
    recent = db.query(Submission).order_by(
        Submission.created_at.desc()
    ).limit(10).all()
    
    return {
        "pending_reviews": pending,
        "today_submissions": today_submissions,
        "total_submissions": db.query(Submission).count(),
        "total_clusters": db.query(Cluster).count(),
        "total_clauses": db.query(BillClause).count(),
        "recent_submissions": [
            {
                "id": s.id,
                "content": s.content[:100] + "...",
                "region": s.region,
                "status": s.status,
                "created_at": s.created_at
            }
            for s in recent
        ]
    }

# ============== EXPORT ENDPOINTS ==============

@app.get("/api/export/bill.pdf")
async def export_bill_pdf(
    db: Session = Depends(get_db)
):
    """Export the bill as PDF (Phase 2 - returns JSON for now)"""
    return await get_full_bill(db)

@app.get("/api/export/submissions.csv")
async def export_submissions_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export submissions as CSV for analysis"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    submissions = db.query(Submission).all()
    
    # Create CSV content
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Content", "Region", "Age", "Occupation",
        "Language", "Status", "Cluster ID", "Created At"
    ])
    
    # Data
    for s in submissions:
        writer.writerow([
            s.id, s.content, s.region, s.age, s.occupation,
            s.language, s.status, s.cluster_id, s.created_at
        ])
    
    from fastapi.responses import Response
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=submissions.csv"}
    )

# ============== HEALTH CHECK ==============

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy", "timestamp": datetime.now()}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
