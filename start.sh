#!/bin/bash

# Debug: Print all environment variables
echo "Environment variables:"
env | sort

# Try different ways to get the port
PORT=${PORT:-8000}
RAILWAY_PORT=${RAILWAY_PORT:-8000}
PORT_NUM=${PORT_NUM:-8000}

echo "PORT=$PORT"
echo "RAILWAY_PORT=$RAILWAY_PORT"
echo "PORT_NUM=$PORT_NUM"

# Use the first available port variable
FINAL_PORT=${PORT:-${RAILWAY_PORT:-${PORT_NUM:-8000}}}

echo "Starting ViralSplit API on port $FINAL_PORT"

# Start the application
exec uvicorn main:app --host 0.0.0.0 --port $FINAL_PORT --workers 4
