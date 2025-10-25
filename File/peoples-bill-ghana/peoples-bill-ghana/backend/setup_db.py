#!/usr/bin/env python
"""
Database Setup Script for People's Bill Platform
Run this script to initialize the database with tables and seed data
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import init_database

if __name__ == "__main__":
    print("=" * 50)
    print("People's Bill Platform - Database Setup")
    print("=" * 50)
    
    print("\n📋 Initializing database...")
    init_database()
    
    print("\n✅ Database setup complete!")
    print("\n" + "=" * 50)
    print("You can now start the application with:")
    print("  uvicorn main:app --reload")
    print("=" * 50)
