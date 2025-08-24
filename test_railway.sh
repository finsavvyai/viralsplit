#!/bin/bash

# Test Railway Deployment

RAILWAY_URL="https://viralspiritio-production.up.railway.app"

echo "🚂 Testing Railway Deployment"
echo "============================"

echo ""
echo "1. Testing Basic Connectivity..."
curl -I "$RAILWAY_URL" 2>/dev/null | head -1

echo ""
echo "2. Testing Health Endpoint..."
curl -f "$RAILWAY_URL/health" 2>/dev/null || echo "❌ Health endpoint failed"

echo ""
echo "3. Testing Root Endpoint..."
curl -f "$RAILWAY_URL/" 2>/dev/null || echo "❌ Root endpoint failed"

echo ""
echo "4. Testing API Documentation..."
curl -f "$RAILWAY_URL/docs" 2>/dev/null || echo "❌ Docs endpoint failed"

echo ""
echo "5. Testing OpenAPI Schema..."
curl -f "$RAILWAY_URL/openapi.json" 2>/dev/null | head -c 100 || echo "❌ OpenAPI schema failed"

echo ""
echo "🔍 Checking Railway Status..."
railway status

echo ""
echo "📊 Railway Logs (last 20 lines)..."
railway logs --tail 20

echo ""
echo "🌐 Railway Domain..."
railway domain
