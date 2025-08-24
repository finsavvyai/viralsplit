#!/bin/bash

# ViralSplit Railway Startup Script

echo "🚀 Starting ViralSplit API on Railway..."

# Set default port if not provided
PORT=${PORT:-8000}
echo "Using port: $PORT"

# Change to the API directory
cd apps/api

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
