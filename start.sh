#!/bin/bash

# ViralSplit API Startup Script
set -e

echo "🚀 Starting ViralSplit API..."

# Check if we're in a container environment
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
    
    # Check if Redis is available (Railway provides Redis as a service)
    if command -v redis-cli &> /dev/null; then
        echo "🔴 Redis CLI available, checking connection..."
        # Try to connect to Redis (Railway provides REDIS_URL)
        if [ -n "$REDIS_URL" ]; then
            echo "✅ Using Redis URL from environment"
        else
            echo "⚠️ No Redis URL found, using in-memory storage"
        fi
    else
        echo "⚠️ Redis CLI not available, using in-memory storage"
    fi
fi

# Check if we need to run migrations or setup
if [ -f "alembic.ini" ]; then
    echo "🗄️ Running database migrations..."
    alembic upgrade head || echo "⚠️ Migration failed, continuing..."
fi

# Start the FastAPI application
echo "🌐 Starting FastAPI server..."
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
