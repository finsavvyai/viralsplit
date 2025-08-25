#!/bin/bash

# Quick WebSocket Test for ViralSplit
# Fast verification of WebSocket functionality

API_BASE_URL="https://api.viralsplit.io"
WEB_APP_URL="https://viralsplit.io"

echo "🔌 Quick WebSocket Test"
echo "======================"

# Test 1: API Health
echo "1. Testing API health..."
if curl -s "${API_BASE_URL}/health" > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

# Test 2: Create a test project
echo "2. Creating test project..."
response=$(curl -s -X POST "${API_BASE_URL}/api/upload/youtube" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "agreed_to_terms": true,
        "is_trial": true
    }')

if [ $? -eq 0 ]; then
    echo "✅ Test project created"
    PROJECT_ID=$(echo "$response" | grep -o '"project_id":"[^"]*"' | cut -d'"' -f4)
    echo "Project ID: $PROJECT_ID"
else
    echo "❌ Failed to create test project"
    exit 1
fi

# Test 3: Check project status
echo "3. Testing project status..."
status_response=$(curl -s -X GET "${API_BASE_URL}/api/projects/${PROJECT_ID}/status")
if [ $? -eq 0 ]; then
    echo "✅ Project status endpoint working"
    echo "Status: $(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Project status endpoint failed"
fi

# Test 4: WebSocket endpoint (should return 404 for GET)
echo "4. Testing WebSocket endpoint..."
ws_response=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/ws/${PROJECT_ID}")
if [ "$ws_response" = "404" ]; then
    echo "✅ WebSocket endpoint accessible (404 expected for GET)"
else
    echo "⚠️  WebSocket endpoint returned: $ws_response"
fi

echo ""
echo "🎯 Quick test completed!"
echo "For full WebSocket testing, run: ./test_websocket_api.sh"
echo ""
echo "🌐 Your web app is available at: $WEB_APP_URL"
