#!/bin/bash

echo "=================================================="
echo "   People's Bill Platform - Quick Start Setup    "
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

# Check Python
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓${NC} Python3 found: $(python3 --version)"
else
    echo -e "${RED}✗${NC} Python3 not found. Please install Python 3.9+"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL found"
else
    echo -e "${YELLOW}⚠${NC} PostgreSQL not found. Make sure it's installed or use Docker"
fi

# Setup Backend
echo -e "\n${YELLOW}Setting up Backend...${NC}"
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Created virtual environment"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✓${NC} Backend dependencies installed"

# Setup environment file
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓${NC} Created .env file (please edit with your settings)"
else
    echo -e "${GREEN}✓${NC} .env file exists"
fi

# Initialize database
echo -e "\n${YELLOW}Initialize database? (y/n)${NC}"
read -r init_db
if [ "$init_db" = "y" ]; then
    python setup_db.py
fi

# Setup Frontend
echo -e "\n${YELLOW}Setting up Frontend...${NC}"
cd ../frontend

# Install dependencies
echo "Installing Node dependencies..."
npm install --silent
echo -e "${GREEN}✓${NC} Frontend dependencies installed"

# Setup environment file
if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    echo -e "${GREEN}✓${NC} Created .env.local file"
else
    echo -e "${GREEN}✓${NC} .env.local file exists"
fi

# Start services
echo -e "\n${YELLOW}Do you want to start the services now? (y/n)${NC}"
read -r start_services

if [ "$start_services" = "y" ]; then
    echo -e "\n${GREEN}Starting services...${NC}"
    
    # Start backend in background
    cd ../backend
    source venv/bin/activate
    uvicorn main:app --reload --port 8000 &
    BACKEND_PID=$!
    echo -e "${GREEN}✓${NC} Backend started (PID: $BACKEND_PID)"
    
    # Start frontend
    cd ../frontend
    echo -e "${GREEN}✓${NC} Starting frontend..."
    npm run dev
    
    # Cleanup on exit
    trap "kill $BACKEND_PID 2>/dev/null" EXIT
else
    echo -e "\n${GREEN}Setup complete!${NC}"
    echo -e "\nTo start the services manually:"
    echo -e "  Backend:  cd backend && source venv/bin/activate && uvicorn main:app --reload"
    echo -e "  Frontend: cd frontend && npm run dev"
fi

echo -e "\n=================================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "Default admin login: admin / changeme123"
echo -e "Access the application at: http://localhost:3000"
echo -e "=================================================="
