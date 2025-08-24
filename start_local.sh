#!/bin/bash

# ViralSplit Local Development Startup Script
# This script starts all services needed for local development

echo "🚀 Starting ViralSplit Local Development Environment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start service if not running
start_service() {
    local name=$1
    local port=$2
    local command=$3
    
    echo -n "Starting $name... "
    if check_port $port; then
        echo -e "${GREEN}✅ Already running on port $port${NC}"
    else
        echo -e "${YELLOW}🔄 Starting...${NC}"
        eval "$command" &
        sleep 3
        if check_port $port; then
            echo -e "${GREEN}✅ Started successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  May still be starting...${NC}"
        fi
    fi
}

# Check if .env file exists
if [ ! -f "apps/api/.env" ]; then
    echo "❌ Error: apps/api/.env file not found!"
    echo "Please copy apps/api/env.template to apps/api/.env and fill in your API keys"
    exit 1
fi

echo ""
echo "1. Checking Redis..."
if redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Starting Redis...${NC}"
    redis-server --daemonize yes
    sleep 2
    if redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis started successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis may not be available${NC}"
    fi
fi

echo ""
echo "2. Starting Services..."

# Start API
start_service "FastAPI Backend" "8000" "cd apps/api && source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# Start Celery Worker
start_service "Celery Worker" "8001" "cd apps/api && source venv/bin/activate && celery -A celery_app worker --loglevel=info"

# Start Celery Beat
start_service "Celery Beat" "8002" "cd apps/api && source venv/bin/activate && celery -A celery_app beat --loglevel=info"

# Start Web Frontend
start_service "Next.js Web App" "3000" "cd apps/viralsplit && npm run dev"

# Start Mobile App (Expo)
start_service "Expo Mobile App" "8081" "cd apps/viralsplit-mobile && npm start"

echo ""
echo "3. Waiting for services to be ready..."
sleep 10

echo ""
echo "4. Testing Services..."

# Test API
echo -n "Testing API... "
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${YELLOW}⚠️  Not responding yet${NC}"
fi

# Test Web App
echo -n "Testing Web App... "
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${YELLOW}⚠️  Not responding yet${NC}"
fi

echo ""
echo "🎉 ViralSplit Local Environment Started!"
echo "======================================="
echo ""
echo "🌐 Access Points:"
echo -e "${BLUE}📱 API Backend:${NC}     http://localhost:8000"
echo -e "${BLUE}📖 API Docs:${NC}        http://localhost:8000/docs"
echo -e "${BLUE}💚 Health Check:${NC}    http://localhost:8000/health"
echo -e "${BLUE}📊 Metrics:${NC}         http://localhost:8000/metrics"
echo ""
echo -e "${BLUE}🌍 Web Frontend:${NC}    http://localhost:3000"
echo -e "${BLUE}📱 Mobile App:${NC}      http://localhost:8081 (Expo)"
echo ""
echo "🔧 Background Services:"
echo -e "${BLUE}🔴 Redis:${NC}           localhost:6379"
echo -e "${BLUE}⚡ Celery Worker:${NC}    Background processing"
echo -e "${BLUE}⏰ Celery Beat:${NC}      Scheduled tasks"
echo ""
echo "📱 Mobile Development:"
echo "- Install Expo Go app on your phone"
echo "- Scan QR code from Expo terminal"
echo "- Or press 'i' for iOS simulator, 'a' for Android"
echo ""
echo "🔧 Useful Commands:"
echo "- View API logs: cd apps/api && tail -f logs/app.log"
echo "- Test API: ./test_api.sh"
echo "- Stop all: pkill -f 'uvicorn\|celery\|npm\|expo'"
echo ""
echo "🚀 Happy coding!"
