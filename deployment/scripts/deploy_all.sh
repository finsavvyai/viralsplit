#!/bin/bash

# ViralSplit Full Stack Deployment Script
# Deploys both Railway API and Vercel Web App with notifications

# Store the root directory path (get absolute path correctly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../" && pwd)"

# Source notifier (create dummy if not found)
if [ -f "$ROOT_DIR/tools/setup/notifier.sh" ]; then
    source "$ROOT_DIR/tools/setup/notifier.sh"
else
    notify() { echo "📢 $1: $2"; }
fi

# Configuration
PROJECT_NAME="ViralSplit Full Stack"

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo "🚀 Starting ViralSplit Full Stack Deployment"
echo "============================================="

# Function to deploy Railway API
deploy_railway_api() {
    echo ""
    echo -e "${BLUE}🔧 Deploying Railway API...${NC}"
    notify "deploy" "Starting Railway API deployment"
    
    # Run Railway deployment in background
    ./deploy_railway.sh &
    RAILWAY_PID=$!
    
    echo "✅ Railway deployment started with PID: $RAILWAY_PID"
    
    # Wait for Railway deployment to complete
    wait $RAILWAY_PID
    RAILWAY_EXIT_CODE=$?
    
    if [ $RAILWAY_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Railway API deployment successful${NC}"
        notify "success" "Railway API deployment completed successfully"
    else
        echo -e "${RED}❌ Railway API deployment failed${NC}"
        notify "error" "Railway API deployment failed"
        return 1
    fi
}

# Function to deploy Vercel Web App
deploy_vercel_web() {
    echo ""
    echo -e "${PURPLE}🌐 Deploying Vercel Web App...${NC}"
    notify "deploy" "Starting Vercel web app deployment"
    
    # Run Vercel deployment in background
    ./deploy_vercel.sh &
    VERCEL_PID=$!
    
    echo "✅ Vercel deployment started with PID: $VERCEL_PID"
    
    # Wait for Vercel deployment to complete
    wait $VERCEL_PID
    VERCEL_EXIT_CODE=$?
    
    if [ $VERCEL_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Vercel Web App deployment successful${NC}"
        notify "success" "Vercel web app deployment completed successfully"
    else
        echo -e "${RED}❌ Vercel Web App deployment failed${NC}"
        notify "error" "Vercel web app deployment failed"
        return 1
    fi
}

# Function to test the full stack
test_full_stack() {
    echo ""
    echo -e "${YELLOW}🧪 Testing full stack deployment...${NC}"
    notify "info" "Testing full stack deployment"
    
    # Test Railway API
    echo "🔍 Testing Railway API..."
    if curl -s https://api.viralsplit.io/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Railway API is healthy${NC}"
    else
        echo -e "${RED}❌ Railway API health check failed${NC}"
        notify "error" "Railway API health check failed"
        return 1
    fi
    
    # Test Vercel Web App
    echo "🔍 Testing Vercel Web App..."
    if curl -s https://viralsplit.vercel.app > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Vercel Web App is responding${NC}"
    else
        echo -e "${RED}❌ Vercel Web App health check failed${NC}"
        notify "error" "Vercel Web App health check failed"
        return 1
    fi
    
    notify "success" "Full stack deployment test passed"
    echo -e "${GREEN}✅ Full stack test completed successfully${NC}"
}

# Function to show deployment summary
show_deployment_summary() {
    echo ""
    echo "🎯 Deployment Summary"
    echo "===================="
    echo "🌐 Railway API: https://api.viralsplit.io"
    echo "🌐 Vercel Web App: https://viralsplit.io"
    echo "📊 Railway Status: $(railway status 2>/dev/null | head -1 || echo 'Unknown')"
    echo "📊 Vercel Status: $(vercel ls --prod 2>/dev/null | grep viralsplit || echo 'Unknown')"
}

# Main deployment process
main() {
    # Deploy Railway API first
    deploy_railway_api
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Railway deployment failed. Stopping deployment.${NC}"
        notify "error" "Full stack deployment failed - Railway API failed"
        exit 1
    fi
    
    # Wait a bit for Railway to stabilize
    echo "⏳ Waiting for Railway API to stabilize..."
    sleep 30
    
    # Deploy Vercel Web App
    deploy_vercel_web
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Vercel deployment failed.${NC}"
        notify "error" "Full stack deployment failed - Vercel web app failed"
        exit 1
    fi
    
    # Wait a bit for Vercel to stabilize
    echo "⏳ Waiting for Vercel Web App to stabilize..."
    sleep 30
    
    # Test the full stack
    test_full_stack
    
    # Run WebSocket API tests
    echo ""
    echo -e "${YELLOW}🧪 Running WebSocket API tests...${NC}"
    notify "info" "Running WebSocket API tests"
    
    if ./test_websocket_api.sh; then
        echo -e "${GREEN}✅ WebSocket API tests passed${NC}"
        notify "success" "WebSocket API tests passed"
    else
        echo -e "${RED}❌ WebSocket API tests failed${NC}"
        notify "error" "WebSocket API tests failed"
    fi
    
    # Show summary
    show_deployment_summary
    
    echo ""
    echo -e "${GREEN}🎉 Full stack deployment completed successfully!${NC}"
    notify "success" "ViralSplit full stack deployment completed successfully!"
}

# Run main function
main "$@"
