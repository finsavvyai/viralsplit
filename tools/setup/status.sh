#!/bin/bash

# ViralSplit Local Services Status Checker

echo "🔍 ViralSplit Local Services Status"
echo "=================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check service
check_service() {
    local name=$1
    local url=$2
    local port=$3
    
    echo -n "$name ($port): "
    
    if curl -f -s "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not responding${NC}"
        return 1
    fi
}

# Check Redis
echo -n "Redis (6379): "
if /opt/homebrew/bin/redis-cli ping >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

echo ""
echo "Web Services:"
check_service "API Backend" "http://localhost:8000/health" "8000"
check_service "Web Frontend" "http://localhost:3000" "3000"
check_service "Mobile App (Expo)" "http://localhost:8081" "8081"

echo ""
echo "🌐 Access URLs:"
echo -e "${BLUE}📱 API:${NC}           http://localhost:8000"
echo -e "${BLUE}📖 API Docs:${NC}      http://localhost:8000/docs"
echo -e "${BLUE}🌍 Web App:${NC}       http://localhost:3000"
echo -e "${BLUE}📱 Mobile:${NC}        http://localhost:8081"
echo ""
echo "🔧 Quick Commands:"
echo "- Start all: ./start_local.sh"
echo "- Test API: ./test_api.sh"
echo "- Stop all: pkill -f 'uvicorn\|celery\|npm\|expo'"
