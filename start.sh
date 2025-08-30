#!/bin/bash

# ViralSplit API Startup Script
set -e

echo "🚀 Starting ViralSplit API..."

# Check if we're in a container environment
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    
    # Start Redis if not already running
    if ! pgrep -x "redis-server" > /dev/null; then
        echo "🔴 Starting Redis server..."
        redis-server --daemonize yes
    fi
    
    # Wait for Redis to be ready
    echo "⏳ Waiting for Redis to be ready..."
    until redis-cli ping > /dev/null 2>&1; do
        sleep 1
    done
    echo "✅ Redis is ready"
fi

# Check if we need to run migrations or setup
if [ -f "alembic.ini" ]; then
    echo "🗄️ Running database migrations..."
    alembic upgrade head || echo "⚠️ Migration failed, continuing..."
fi

# Start the FastAPI application
echo "🌐 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
