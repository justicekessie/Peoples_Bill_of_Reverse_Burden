"""
Database Models for People's Bill Platform
SQLAlchemy models for all database tables
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Submission(Base):
    """Citizen submissions table"""
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    region = Column(String(50), nullable=False, index=True)
    age = Column(Integer, nullable=True)
    occupation = Column(String(100), nullable=True)
    language = Column(String(10), default="en")
    
    # Processing fields
    status = Column(String(20), default="pending", index=True)  # pending, approved, rejected
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=True)
    
    # Metadata
    ip_address = Column(String(45), nullable=True)  # For rate limiting
    user_agent = Column(String(200), nullable=True)
    submission_method = Column(String(20), default="web")  # web, sms, ussd
    
    # Review tracking
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cluster = relationship("Cluster", back_populates="submissions")
    reviewer = relationship("User", back_populates="reviewed_submissions")
    
    def __repr__(self):
        return f"<Submission {self.id}: {self.content[:50]}...>"


class Cluster(Base):
    """AI-generated clusters of similar submissions"""
    __tablename__ = "clusters"
    
    id = Column(Integer, primary_key=True, index=True)
    theme = Column(String(200), nullable=False)
    summary = Column(Text, nullable=False)
    representative_text = Column(Text)  # Most representative submission
    
    # ML fields
    embedding_vector = Column(JSON)  # Store as JSON for simplicity in Phase 1
    confidence_score = Column(Float, default=0.0)
    keywords = Column(JSON)  # Top keywords for this cluster
    
    # Statistics
    submission_count = Column(Integer, default=0)
    regions_represented = Column(JSON)  # List of regions
    avg_age = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    submissions = relationship("Submission", back_populates="cluster")
    bill_clauses = relationship("BillClause", back_populates="cluster")
    
    def __repr__(self):
        return f"<Cluster {self.id}: {self.theme}>"


class BillClause(Base):
    """Draft bill clauses generated from clusters"""
    __tablename__ = "bill_clauses"
    
    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, ForeignKey("clusters.id"), nullable=False)
    
    # Clause content
    section_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    rationale = Column(Text)  # Explanation of why this clause exists
    
    # Legal review
    legal_review_status = Column(String(20), default="draft")  # draft, reviewed, approved
    legal_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    legal_review_notes = Column(Text)
    
    # Version control
    version = Column(Integer, default=1)
    previous_version = Column(Text)  # Store previous content
    
    # Public feedback
    public_comments_enabled = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cluster = relationship("Cluster", back_populates="bill_clauses")
    votes = relationship("Vote", back_populates="clause")
    edit_history = relationship("EditHistory", back_populates="clause")
    legal_reviewer = relationship("User", back_populates="reviewed_clauses")
    
    def __repr__(self):
        return f"<BillClause {self.section_number}: {self.title}>"


class User(Base):
    """Admin and moderator users"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    
    # Profile
    full_name = Column(String(100))
    role = Column(String(20), default="moderator")  # admin, moderator, legal_reviewer
    organization = Column(String(100))  # e.g., "Ghana Bar Association"
    
    # Activity tracking
    last_login = Column(DateTime)
    login_count = Column(Integer, default=0)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    reviewed_submissions = relationship("Submission", back_populates="reviewer")
    reviewed_clauses = relationship("BillClause", back_populates="legal_reviewer")
    edit_history = relationship("EditHistory", back_populates="editor")
    
    def __repr__(self):
        return f"<User {self.username}>"


class Vote(Base):
    """Public votes on bill clauses"""
    __tablename__ = "votes"
    
    id = Column(Integer, primary_key=True, index=True)
    clause_id = Column(Integer, ForeignKey("bill_clauses.id"), nullable=False)
    
    # Vote details
    vote_value = Column(String(10), nullable=False)  # approve, reject, neutral
    comment = Column(Text, nullable=True)
    
    # Voter info (anonymous but tracked for statistics)
    region = Column(String(50), nullable=True)
    voter_hash = Column(String(64))  # Hashed identifier to prevent duplicate votes
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    clause = relationship("BillClause", back_populates="votes")
    
    def __repr__(self):
        return f"<Vote {self.id}: {self.vote_value}>"


class Region(Base):
    """Ghana's 16 regions for tracking"""
    __tablename__ = "regions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    capital = Column(String(50))
    population = Column(Integer)  # For representation weighting
    
    # Statistics
    submission_count = Column(Integer, default=0)
    last_submission = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Region {self.name}>"


class EditHistory(Base):
    """Track all edits to bill clauses"""
    __tablename__ = "edit_history"
    
    id = Column(Integer, primary_key=True, index=True)
    clause_id = Column(Integer, ForeignKey("bill_clauses.id"), nullable=False)
    editor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Change details
    field_changed = Column(String(50))  # title, content, section_number
    old_value = Column(Text)
    new_value = Column(Text)
    change_reason = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    clause = relationship("BillClause", back_populates="edit_history")
    editor = relationship("User", back_populates="edit_history")
    
    def __repr__(self):
        return f"<EditHistory {self.id}: {self.field_changed}>"


class SystemLog(Base):
    """System activity logging"""
    __tablename__ = "system_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Log details
    action = Column(String(100), nullable=False)
    description = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    ip_address = Column(String(45))
    
    # Additional data
    metadata = Column(JSON)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SystemLog {self.id}: {self.action}>"


class SMSSubmission(Base):
    """Track SMS submissions (Phase 2)"""
    __tablename__ = "sms_submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), nullable=False)  # Hashed for privacy
    message = Column(Text, nullable=False)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=True)
    
    # SMS gateway details
    gateway_id = Column(String(100))
    cost = Column(Float)
    status = Column(String(20))  # received, processed, failed
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SMSSubmission {self.id}>"
