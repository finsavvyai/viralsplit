#!/bin/bash

# Test voice announcements
echo "🎤 Testing voice announcements..."

# Test Railway start
echo "🚂 Testing Railway start announcement:"
source ./notifier.sh
notify "railway" "Starting Railway deployment"

sleep 3

# Test Vercel start
echo "▲ Testing Vercel start announcement:"
notify "vercel" "Starting Vercel deployment"

sleep 3

# Test Railway completion
echo "🚂 Testing Railway completion announcement:"
notify "railway" "Railway deployment completed successfully"

sleep 3

# Test Vercel completion
echo "▲ Testing Vercel completion announcement:"
notify "vercel" "Vercel deployment completed successfully"

sleep 3

# Test success
echo "✅ Testing success announcement:"
notify "success" "All deployments completed successfully"

echo "🎤 Voice tests completed!"
