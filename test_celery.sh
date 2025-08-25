#!/bin/bash

# Test Celery Task Execution
echo "🧪 Testing Celery Task Execution"
echo "================================"

# Create a test project
echo "1. Creating test project..."
response=$(curl -s -X POST "https://api.viralsplit.io/api/upload/youtube" \
    -H "Content-Type: application/json" \
    -d '{
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "agreed_to_terms": true,
        "is_trial": true
    }')

if [ $? -ne 0 ]; then
    echo "❌ Failed to create project"
    exit 1
fi

echo "Response: $response"

# Extract project ID
project_id=$(echo "$response" | grep -o '"project_id":"[^"]*"' | cut -d'"' -f4)
task_id=$(echo "$response" | grep -o '"task_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$project_id" ]; then
    echo "❌ Could not extract project ID"
    exit 1
fi

echo "✅ Project created: $project_id"
echo "✅ Task ID: $task_id"

# Monitor progress
echo ""
echo "2. Monitoring progress..."
for i in {1..15}; do
    echo "Poll $i:"
    status_response=$(curl -s "https://api.viralsplit.io/api/projects/$project_id/status")
    
    if [ $? -eq 0 ]; then
        progress=$(echo "$status_response" | grep -o '"progress":[0-9]*' | cut -d':' -f2)
        status=$(echo "$status_response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        message=$(echo "$status_response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
        
        echo "   Progress: ${progress:-0}%"
        echo "   Status: ${status:-unknown}"
        echo "   Message: ${message:-none}"
        
        if [ "$status" = "ready_for_processing" ]; then
            echo "✅ Task completed successfully!"
            break
        elif [ "$status" = "failed" ]; then
            echo "❌ Task failed!"
            break
        fi
    else
        echo "   ❌ Status check failed"
    fi
    
    sleep 3
done

echo ""
echo "🎯 Test completed!"
