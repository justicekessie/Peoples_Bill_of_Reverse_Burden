"""
Authentication and authorization module
JWT-based authentication for admin users
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import User

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return username
    except JWTError:
        raise credentials_exception

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    username = verify_token(token, credentials_exception)
    user = db.query(User).filter(User.username == username).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Update last login
    user.last_login = datetime.utcnow()
    user.login_count = (user.login_count or 0) + 1
    db.commit()
    
    return user

async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the current user is an admin"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_moderator_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Ensure the current user is at least a moderator"""
    if current_user.role not in ["admin", "moderator", "legal_reviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator access required"
        )
    return current_user

def create_user(
    db: Session,
    username: str,
    email: str,
    password: str,
    full_name: str = None,
    role: str = "moderator",
    organization: str = None
) -> User:
    """Create a new user"""
    # Check if user already exists
    if db.query(User).filter(User.username == username).first():
        raise ValueError("Username already exists")
    
    if db.query(User).filter(User.email == email).first():
        raise ValueError("Email already exists")
    
    # Create new user
    user = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        full_name=full_name,
        role=role,
        organization=organization,
        is_active=True
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """Authenticate a user"""
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return None
    
    if not verify_password(password, user.password_hash):
        return None
    
    return user

# Rate limiting helper (basic implementation)
class RateLimiter:
    """Simple in-memory rate limiter"""
    def __init__(self):
        self.attempts = {}
        self.window = 3600  # 1 hour window
        self.max_attempts = 100  # Max attempts per window
    
    def check_rate_limit(self, identifier: str) -> bool:
        """Check if rate limit exceeded"""
        now = datetime.utcnow()
        
        # Clean old entries
        self.attempts = {
            k: v for k, v in self.attempts.items()
            if (now - v["first"]).seconds < self.window
        }
        
        if identifier not in self.attempts:
            self.attempts[identifier] = {"first": now, "count": 1}
            return True
        
        entry = self.attempts[identifier]
        if (now - entry["first"]).seconds >= self.window:
            # Reset window
            self.attempts[identifier] = {"first": now, "count": 1}
            return True
        
        if entry["count"] >= self.max_attempts:
            return False
        
        entry["count"] += 1
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()
