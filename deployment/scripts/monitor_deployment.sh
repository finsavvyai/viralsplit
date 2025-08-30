#!/bin/bash

# ViralSplit Deployment Monitor
# Monitors ongoing deployments and shows real-time status

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "🔍 ViralSplit Deployment Monitor"
echo "================================"

# Check if deployments are running
check_running_deployments() {
    echo "📊 Checking running deployments..."
    
    # Check Railway deployment
    RAILWAY_PID=$(ps aux | grep "deploy_railway.sh" | grep -v grep | awk '{print $2}')
    if [ -n "$RAILWAY_PID" ]; then
        echo -e "${BLUE}🚂 Railway deployment is running (PID: $RAILWAY_PID)${NC}"
    else
        echo -e "${GREEN}✅ Railway deployment completed${NC}"
    fi
    
    # Check Vercel deployment
    VERCEL_PID=$(ps aux | grep "deploy_vercel.sh" | grep -v grep | awk '{print $2}')
    if [ -n "$VERCEL_PID" ]; then
        echo -e "${PURPLE}▲ Vercel deployment is running (PID: $VERCEL_PID)${NC}"
    else
        echo -e "${GREEN}✅ Vercel deployment completed${NC}"
    fi
    
    # Check full stack deployment
    FULL_PID=$(ps aux | grep "deploy_all.sh" | grep -v grep | awk '{print $2}')
    if [ -n "$FULL_PID" ]; then
        echo -e "${YELLOW}🚀 Full stack deployment is running (PID: $FULL_PID)${NC}"
    fi
}

# Show recent logs
show_recent_logs() {
    echo ""
    echo "📋 Recent Railway logs:"
    if [ -f "deployment.log" ]; then
        tail -5 deployment.log
    else
        echo "No Railway logs found"
    fi
    
    echo ""
    echo "📋 Recent Vercel logs:"
    if [ -f "vercel_deploy.log" ]; then
        tail -5 vercel_deploy.log
    else
        echo "No Vercel logs found"
    fi
}

# Check service health
check_service_health() {
    echo ""
    echo "🏥 Service Health Check:"
    
    # Check Railway API
    echo -n "🔧 Railway API: "
    if curl -s https://api.viralsplit.io/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
    
    # Check Vercel Web App
    echo -n "🌐 Vercel Web App: "
    if curl -s https://viralsplit.io > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Responding${NC}"
    else
        echo -e "${RED}❌ Not responding${NC}"
    fi
}

# Main monitoring function
main() {
    while true; do
        clear
        echo "🔍 ViralSplit Deployment Monitor - $(date)"
        echo "================================================"
        
        check_running_deployments
        show_recent_logs
        check_service_health
        
        echo ""
        echo "⏳ Refreshing in 10 seconds... (Press Ctrl+C to exit)"
        sleep 10
    done
}

# Run main function
main "$@"
