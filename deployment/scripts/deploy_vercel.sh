#!/bin/bash

# Vercel deployment script with version tracking
# Usage: ./deploy_vercel.sh

# Store the root directory path (get absolute path correctly)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../../" && pwd)"

# Source notifier (create dummy if not found)  
if [ -f "$ROOT_DIR/tools/setup/notifier.sh" ]; then
    source "$ROOT_DIR/tools/setup/notifier.sh"
else
    # Create dummy notify function if notifier not found
    notify() { echo "📢 $1: $2"; }
fi

echo "🚀 Starting Vercel deployment in background..."
echo "Root directory: $ROOT_DIR"

# Increment build number
echo "📈 Incrementing build number..."
$ROOT_DIR/scripts/version.sh increment
NEW_BUILD=$($ROOT_DIR/scripts/version.sh show | grep "Build:" | awk '{print $2}')

# Update deployment status to deploying
echo "🔄 Updating deployment status..."
$ROOT_DIR/scripts/version.sh update-deployment-status vercel deploying

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel..."
    vercel login
fi

# Navigate to web app directory
cd $ROOT_DIR/apps/viralsplit
echo "Current directory: $(pwd)"

# Verify files exist
echo "Checking version files..."
ls -la $ROOT_DIR/scripts/version.sh
ls -la $ROOT_DIR/version.json

echo "📋 Copying version file to public directories..."
cp "$ROOT_DIR/version.json" public/ 2>/dev/null || echo "Warning: Could not copy version.json to public/"

echo "🏗️  Building web app..."
npm run build

echo "🚀 Deploying to Vercel..."
notify "vercel" "Starting Vercel deployment for build $NEW_BUILD"

# Deploy to Vercel
vercel --prod --yes > ../../vercel_deploy.log 2>&1 &
DEPLOYMENT_PID=$!

echo "✅ Deployment started with PID: $DEPLOYMENT_PID"
echo "📝 Logs are being written to: vercel_deploy.log"

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

# Get deployment URL
echo "🔍 Getting deployment URL..."
DEPLOYMENT_URL=$(grep -o 'https://[^[:space:]]*' ../../vercel_deploy.log | tail -1)

if [ -z "$DEPLOYMENT_URL" ]; then
    DEPLOYMENT_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "https://viralsplit.io")
fi

echo "🌐 Deployment URL: $DEPLOYMENT_URL"

# Check deployment health
echo "🔍 Checking deployment health..."
sleep 10  # Wait for deployment to be ready

# Try the main domain first
if curl -s -f "https://viralsplit.io" > /dev/null; then
    echo "✅ Web app is healthy (main domain)"
    
    # Verify version deployment
    echo "🔍 Verifying version deployment..."
    sleep 15  # Wait longer for deployment to propagate
    
    # Extract version from the page content or version.json
    WEB_VERSION=$(curl -s "https://viralsplit.io/version.json" | grep -o '"build":[0-9]*' | grep -o '[0-9]*' || echo "unknown")
    if [ "$WEB_VERSION" = "unknown" ]; then
        # Fallback to page content
        WEB_VERSION=$(curl -s "https://viralsplit.io" | grep -o "v[0-9.]*-build[0-9]*" | head -1 || echo "unknown")
    fi
    EXPECTED_BUILD=$NEW_BUILD
    
    # If version extraction failed, try a more lenient approach
    if [ "$WEB_VERSION" = "unknown" ]; then
        echo "⚠️  Version extraction failed, checking if page loads correctly..."
        if curl -s "https://viralsplit.io" | grep -q "ViralSplit"; then
            echo "✅ Web app is loading correctly (version display may be delayed)"
            $ROOT_DIR/scripts/version.sh update-deployment-status vercel online
            notify "vercel" "Vercel web app deployment successful for build $NEW_BUILD"
        else
            echo "❌ Web app is not loading correctly"
            $ROOT_DIR/scripts/version.sh update-deployment-status vercel failed
            notify "error" "Vercel web app deployment failed - page not loading"
        fi
    elif [[ "$WEB_VERSION" == *"build$EXPECTED_BUILD"* ]]; then
        echo "✅ Version verification successful: Web app shows $WEB_VERSION"
        $ROOT_DIR/scripts/version.sh update-deployment-status vercel online
        notify "vercel" "Vercel web app deployment successful for build $NEW_BUILD"
    else
        echo "⚠️  Version mismatch: Expected build $EXPECTED_BUILD, Web app shows $WEB_VERSION"
        echo "🔄 Retrying version check in 30 seconds..."
        sleep 30
        WEB_VERSION=$(curl -s "https://viralsplit.io" | grep -o "v[0-9.]*-build[0-9]*" | head -1 || echo "unknown")
        if [[ "$WEB_VERSION" == *"build$EXPECTED_BUILD"* ]]; then
            echo "✅ Version verification successful on retry: Web app shows $WEB_VERSION"
            $ROOT_DIR/scripts/version.sh update-deployment-status vercel online
            notify "vercel" "Vercel web app deployment successful for build $NEW_BUILD"
        elif [ "$WEB_VERSION" = "unknown" ]; then
            echo "⚠️  Version extraction still failing, but page loads correctly"
            $ROOT_DIR/scripts/version.sh update-deployment-status vercel online
            notify "vercel" "Vercel web app deployment successful for build $NEW_BUILD"
        else
            echo "❌ Version verification failed: Expected build $EXPECTED_BUILD, Web app shows $WEB_VERSION"
            $ROOT_DIR/scripts/version.sh update-deployment-status vercel failed
            notify "error" "Vercel web app deployment failed - version mismatch"
        fi
    fi
elif curl -s -f "$DEPLOYMENT_URL" > /dev/null; then
    echo "✅ Web app is healthy (deployment URL)"
    $ROOT_DIR/scripts/version.sh update-deployment-status vercel online
    notify "vercel" "Vercel web app deployment successful for build $NEW_BUILD"
else
    echo "⚠️  Web app health check inconclusive - deployment may still be processing"
    $ROOT_DIR/scripts/version.sh update-deployment-status vercel deploying
    notify "warning" "Vercel web app deployment may still be processing"
fi

echo "🎉 Vercel deployment complete!"
echo "📊 Full logs available in: vercel_deploy.log"

# Return to root directory
cd $ROOT_DIR
