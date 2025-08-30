#!/bin/bash

# Test script for voice announcements with version numbers
# Usage: ./test_voice_announcements.sh

source ./notifier.sh

echo "🎤 Testing Voice Announcements with Version Numbers"
echo "=================================================="

# Get current version
VERSION=$(./scripts/version.sh get-version)
echo "Current version: $VERSION"
echo ""

echo "🚂 Testing Railway deployment announcements..."
echo "1. Starting Railway deployment..."
notify "railway" "Starting Railway deployment for build 5"

sleep 3

echo "2. Railway deployment successful..."
notify "railway" "Railway deployment successful for build 5"

sleep 3

echo ""
echo "▲ Testing Vercel deployment announcements..."
echo "3. Starting Vercel deployment..."
notify "vercel" "Starting Vercel deployment for build 5"

sleep 3

echo "4. Vercel deployment successful..."
notify "vercel" "Vercel deployment successful for build 5"

sleep 3

echo ""
echo "✅ Testing general success announcement..."
notify "success" "All deployments completed successfully"

echo ""
echo "🎉 Voice announcement tests completed!"
echo "You should have heard:"
echo "- 'Starting Railway deployment for version $VERSION'"
echo "- 'Railway deployment successful. Version $VERSION is now live.'"
echo "- 'Starting Vercel deployment for version $VERSION'"
echo "- 'Vercel deployment successful. Version $VERSION is now live.'"
echo "- 'Deployment successful. Version $VERSION is now live.'"
