#!/bin/bash

# Jobs Analytics Backend Setup Script
# This script helps you set up the backend API quickly

echo "🚀 Jobs Analytics Backend Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 16+ first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) detected${NC}"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client (psql) not found. Make sure PostgreSQL is installed and accessible.${NC}"
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies installed${NC}"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file...${NC}"
    cp env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env file with your database credentials${NC}"
    echo -e "${YELLOW}   Required fields: DATABASE_URL or DB_HOST, DB_NAME, DB_USER, DB_PASSWORD${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Build TypeScript
echo -e "${BLUE}🔨 Building TypeScript...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build TypeScript${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TypeScript built successfully${NC}"

# Test database connection
echo -e "${BLUE}🔌 Testing database connection...${NC}"
node -e "
const { testConnection } = require('./dist/config/database');
testConnection().then(success => {
  if (success) {
    console.log('✅ Database connection successful');
    process.exit(0);
  } else {
    console.log('❌ Database connection failed');
    console.log('   Please check your .env file and ensure PostgreSQL is running');
    process.exit(1);
  }
}).catch(err => {
  console.log('❌ Database connection error:', err.message);
  process.exit(1);
});
" 2>/dev/null

DB_STATUS=$?

if [ $DB_STATUS -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
    
    # Run migrations
    echo -e "${BLUE}🗄️  Running database migrations...${NC}"
    npm run migrate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
    else
        echo -e "${RED}❌ Database migrations failed${NC}"
        exit 1
    fi
    
    # Ask about classifying existing jobs
    echo -e "${BLUE}❓ Do you want to classify existing jobs now? (y/N)${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}🤖 Starting job classification...${NC}"
        npm run classify-all
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Job classification completed${NC}"
        else
            echo -e "${YELLOW}⚠️  Job classification had some issues, but setup continues${NC}"
        fi
    else
        echo -e "${YELLOW}⏭️  Skipping job classification. You can run 'npm run classify-all' later.${NC}"
    fi
    
else
    echo -e "${YELLOW}⚠️  Database connection failed. Please check your configuration.${NC}"
    echo -e "${YELLOW}   You can run migrations later with: npm run migrate${NC}"
    echo -e "${YELLOW}   And classify jobs with: npm run classify-all${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. 📝 Edit .env file with your database credentials (if not done already)"
echo "2. 🔌 Ensure your PostgreSQL database is running and accessible"
echo "3. 🚀 Start the development server: npm run dev"
echo "4. 🌐 API will be available at: http://localhost:5000"
echo "5. 💊 Health check: http://localhost:5000/health"
echo ""
echo -e "${BLUE}Available commands:${NC}"
echo "• npm run dev        - Start development server"
echo "• npm run build      - Build for production"
echo "• npm start          - Start production server"
echo "• npm run migrate    - Run database migrations"
echo "• npm run classify-all - Classify all existing jobs"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"









