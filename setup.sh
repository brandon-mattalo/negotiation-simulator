#!/bin/bash

# Negotiation Simulator - Quick Setup Script

echo "===================================="
echo "Negotiation Simulator Setup"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL from https://www.postgresql.org/"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL found${NC}"
echo ""

# Setup Backend
echo "Setting up backend..."
cd backend || exit

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit backend/.env with your database credentials and Claude API key${NC}"
    echo "Press Enter when ready to continue..."
    read
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo ""
echo -e "${YELLOW}Ready to run database migrations.${NC}"
echo "Make sure your PostgreSQL database is running and .env is configured."
echo "Press Enter to continue or Ctrl+C to cancel..."
read

echo "Running database migrations..."
npm run prisma:migrate

echo "Seeding database with templates..."
npm run prisma:seed

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Setup Frontend
echo "Setting up frontend..."
cd ../frontend || exit

echo "Installing frontend dependencies..."
npm install

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Final instructions
echo "===================================="
echo "Setup Complete!"
echo "===================================="
echo ""
echo "To start the application:"
echo ""
echo "1. Start the backend (in one terminal):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo -e "${GREEN}Happy negotiating!${NC}"
