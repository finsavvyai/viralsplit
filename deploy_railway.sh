#!/bin/bash

# ViralSplit Railway Deployment Script
echo "🚀 Starting Railway deployment in background..."

# Function to check deployment status
check_deployment_status() {
    echo "📊 Checking deployment status..."
    railway status
    echo "🔍 Checking API health..."
    curl -s https://viralspiritio-production.up.railway.app/health | jq . 2>/dev/null || echo "❌ API not responding yet"
}

# Start deployment in background
echo "🔄 Initiating Railway deployment..."
railway up > deployment.log 2>&1 &
DEPLOY_PID=$!

echo "✅ Deployment started with PID: $DEPLOY_PID"
echo "📝 Logs are being written to: deployment.log"
echo "⏳ Monitoring deployment status..."

# Monitor deployment for up to 10 minutes
for i in {1..60}; do
    echo "⏱️  Check $i/60 - $(date)"
    
    # Check if deployment process is still running
    if ! kill -0 $DEPLOY_PID 2>/dev/null; then
        echo "✅ Deployment process completed"
        break
    fi
    
    # Check deployment status every 10 seconds
    if [ $((i % 6)) -eq 0 ]; then
        check_deployment_status
    fi
    
    sleep 10
done

# Final status check
echo ""
echo "🎯 Final deployment status:"
check_deployment_status

# Show deployment logs
echo ""
echo "📋 Recent deployment logs:"
tail -20 deployment.log

echo ""
echo "🎉 Deployment monitoring complete!"
echo "📊 Full logs available in: deployment.log"
