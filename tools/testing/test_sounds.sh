#!/bin/bash

# Test Railway and Vercel sound notifications
source ./notifier.sh

echo "🔊 Testing Railway and Vercel sound notifications..."

echo "🚂 Testing Railway notification:"
notify "railway" "Railway deployment started"

sleep 2

echo "▲ Testing Vercel notification:"
notify "vercel" "Vercel deployment started"

sleep 2

echo "✅ Testing success notification:"
notify "success" "Deployment completed successfully"

sleep 2

echo "❌ Testing error notification:"
notify "error" "Deployment failed"

echo "🎵 Sound tests completed!"
