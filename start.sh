#!/bin/bash

# ViralSplit Railway Startup Script

echo "🚀 Starting ViralSplit API and Celery Workers on Railway..."

# Set default port if not provided
PORT=${PORT:-8000}
echo "Using port: $PORT"

# Change to the API directory
cd apps/api

# Start Redis if not running (for local development)
if ! pgrep redis-server > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A main.celery_app worker --loglevel=info --concurrency=1 &
CELERY_PID=$!

# Start the FastAPI application
echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
