"""
Database configuration and connection setup
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost/peoples_bill_ghana"
)

# For SQLite in development (optional)
if os.getenv("USE_SQLITE", "false").lower() == "true":
    DATABASE_URL = "sqlite:///./peoples_bill.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    # PostgreSQL for production
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Verify connections before using
        echo=False  # Set to True for SQL debugging
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """
    Dependency to get database session.
    Used with FastAPI's Depends.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_database():
    """
    Initialize database with tables and seed data
    """
    from models import Base, Region, User
    from auth import get_password_hash
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a session for seeding
    db = SessionLocal()
    
    try:
        # Check if regions already exist
        if db.query(Region).count() == 0:
            # Seed Ghana's 16 regions
            regions = [
                {"name": "Greater Accra", "code": "GAR", "capital": "Accra", "population": 5055883},
                {"name": "Ashanti", "code": "ASH", "capital": "Kumasi", "population": 6030030},
                {"name": "Western", "code": "WES", "capital": "Sekondi-Takoradi", "population": 2658774},
                {"name": "Eastern", "code": "EAS", "capital": "Koforidua", "population": 2917039},
                {"name": "Central", "code": "CEN", "capital": "Cape Coast", "population": 2563228},
                {"name": "Volta", "code": "VOL", "capital": "Ho", "population": 1635421},
                {"name": "Oti", "code": "OTI", "capital": "Dambai", "population": 735432},
                {"name": "Northern", "code": "NOR", "capital": "Tamale", "population": 2046696},
                {"name": "North East", "code": "NEA", "capital": "Nalerigu", "population": 535967},
                {"name": "Savannah", "code": "SAV", "capital": "Damongo", "population": 583933},
                {"name": "Upper East", "code": "UEA", "capital": "Bolgatanga", "population": 1241998},
                {"name": "Upper West", "code": "UWE", "capital": "Wa", "population": 859679},
                {"name": "Bono", "code": "BON", "capital": "Sunyani", "population": 1179079},
                {"name": "Bono East", "code": "BEA", "capital": "Techiman", "population": 1170301},
                {"name": "Ahafo", "code": "AHA", "capital": "Goaso", "population": 553636},
                {"name": "Western North", "code": "WNO", "capital": "Sefwi Wiawso", "population": 819984},
            ]
            
            for region_data in regions:
                region = Region(**region_data)
                db.add(region)
            
            print("✓ Seeded 16 Ghana regions")
        
        # Check if admin user exists
        if db.query(User).filter(User.username == "admin").count() == 0:
            # Create default admin user
            admin = User(
                username="admin",
                email="admin@peoplesbill.gh",
                password_hash=get_password_hash("changeme123"),  # Change this!
                full_name="System Administrator",
                role="admin",
                organization="People's Bill Platform",
                is_active=True
            )
            db.add(admin)
            
            # Create a sample legal reviewer
            legal_reviewer = User(
                username="legal1",
                email="legal@peoplesbill.gh",
                password_hash=get_password_hash("legal123"),
                full_name="Legal Reviewer",
                role="legal_reviewer",
                organization="Ghana Bar Association",
                is_active=True
            )
            db.add(legal_reviewer)
            
            print("✓ Created default admin and legal reviewer accounts")
            print("  Admin login: admin / changeme123")
            print("  Legal login: legal1 / legal123")
            print("  ⚠️  Please change these passwords immediately!")
        
        db.commit()
        print("✓ Database initialized successfully")
        
    except Exception as e:
        print(f"✗ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Run this directly to initialize the database
    init_database()
