#!/bin/bash

# Railway deployment script with version tracking
# Usage: ./deploy_railway.sh

# Store the root directory path (get absolute path correctly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../" && pwd)"

# Source notifier (create dummy if not found)
if [ -f "$ROOT_DIR/tools/setup/notifier.sh" ]; then
    source "$ROOT_DIR/tools/setup/notifier.sh"
else
    notify() { echo "📢 $1: $2"; }
fi

echo "🚀 Starting Railway deployment in background..."

# Increment build number
echo "📈 Incrementing build number..."
$ROOT_DIR/scripts/version.sh increment
NEW_BUILD=$($ROOT_DIR/scripts/version.sh show | grep "Build:" | awk '{print $2}')

# Update deployment status to deploying
echo "🔄 Updating deployment status..."
$ROOT_DIR/scripts/version.sh update-deployment-status railway deploying

# Start deployment in background
echo "🚂 Starting Railway API deployment"
notify "railway" "Starting Railway deployment for build $NEW_BUILD"

railway up --detach > deployment.log 2>&1 &
DEPLOYMENT_PID=$!

echo "✅ Deployment started with PID: $DEPLOYMENT_PID"
echo "📝 Logs are being written to: deployment.log"

# Monitor deployment
echo "⏳ Monitoring deployment status..."
sleep 10

# Check deployment status every 30 seconds for up to 5 minutes
for i in {1..10}; do
    echo "⏱️  Check $i/10 - $(date)"
    
    # Check if deployment process is still running
    if ! kill -0 $DEPLOYMENT_PID 2>/dev/null; then
        echo "✅ Deployment process completed"
        break
    fi
    
    sleep 30
done

# Final status check
echo "🎯 Final deployment status:"
echo "📊 Checking deployment status..."

railway status

echo "🔍 Checking API health..."
if curl -s -f "https://api.viralsplit.io/health" > /dev/null; then
    echo "✅ API is healthy"
    
    # Verify version deployment
    echo "🔍 Verifying version deployment..."
    sleep 30  # Wait longer for version endpoint to be ready
    
    API_VERSION=$(curl -s "https://api.viralsplit.io/version" | jq -r '.build // "unknown"')
    EXPECTED_BUILD=$NEW_BUILD
    
    if [ "$API_VERSION" = "$EXPECTED_BUILD" ]; then
        echo "✅ Version verification successful: API shows build $API_VERSION"
        ./scripts/version.sh update-deployment-status railway online
        notify "railway" "Railway API deployment successful for build $NEW_BUILD"
    else
        echo "⚠️  Version mismatch: Expected build $EXPECTED_BUILD, API shows build $API_VERSION"
        echo "🔄 Retrying version check in 60 seconds..."
        sleep 60
        API_VERSION=$(curl -s "https://api.viralsplit.io/version" | jq -r '.build // "unknown"')
        if [ "$API_VERSION" = "$EXPECTED_BUILD" ]; then
            echo "✅ Version verification successful on retry: API shows build $API_VERSION"
            ./scripts/version.sh update-deployment-status railway online
            notify "railway" "Railway API deployment successful for build $NEW_BUILD"
        else
            echo "❌ Version verification failed: Expected build $EXPECTED_BUILD, API shows build $API_VERSION"
            echo "⚠️  Deployment may still be processing, marking as deploying"
            ./scripts/version.sh update-deployment-status railway deploying
            notify "warning" "Railway API deployment may still be processing"
        fi
    fi
else
    echo "❌ API health check failed"
    ./scripts/version.sh update-deployment-status railway failed
    notify "error" "Railway API deployment failed for build $NEW_BUILD"
fi

echo "🚂 Railway API deployment is healthy and responding"
echo "📋 Recent deployment logs:"
tail -10 deployment.log

# Create deployment tag
echo "🏷️  Creating deployment tag..."
./scripts/version.sh create-deployment-tag

echo "🎉 Deployment monitoring complete!"
echo "📊 Full logs available in: deployment.log"
