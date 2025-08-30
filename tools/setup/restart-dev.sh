#!/bin/bash

# ViralSplit Development Server Restart Script
# This script kills all processes on ports used by the app and restarts development servers

echo "🔄 Restarting ViralSplit Development Environment..."

# Define ports used by the application
PORTS=(3000 3001 3002 8000 6379)

echo "📋 Ports to check: ${PORTS[*]}"

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "🔍 Checking port $port..."
    
    # Find processes using the port
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "🔪 Killing processes on port $port: $pids"
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 0.5
        
        # Verify processes are killed
        local remaining=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$remaining" ]; then
            echo "⚠️  Some processes still running on port $port, force killing..."
            echo "$remaining" | xargs kill -KILL 2>/dev/null
        else
            echo "✅ Port $port cleared"
        fi
    else
        echo "✅ Port $port already free"
    fi
}

# Kill processes on all application ports
for port in "${PORTS[@]}"; do
    kill_port $port
done

# Kill any remaining Next.js development processes
echo "🔍 Killing any remaining Next.js processes..."
pkill -f "next dev" 2>/dev/null && echo "✅ Next.js processes killed" || echo "✅ No Next.js processes found"

# Kill any remaining Node.js processes that might be our servers
echo "🔍 Killing ViralSplit-related Node.js processes..."
pkill -f "viralsplit" 2>/dev/null && echo "✅ ViralSplit processes killed" || echo "✅ No ViralSplit processes found"

# Wait for processes to fully terminate
echo "⏳ Waiting for processes to terminate..."
sleep 2

# Verify ports are free
echo "🔍 Verifying all ports are free..."
all_clear=true
for port in "${PORTS[@]}"; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "❌ Port $port still in use!"
        all_clear=false
    else
        echo "✅ Port $port is free"
    fi
done

if [ "$all_clear" = false ]; then
    echo "⚠️  Some ports are still in use. You may need to manually kill processes or restart your system."
    echo "📝 Use 'lsof -ti:PORT' to find processes and 'kill -9 PID' to kill them"
    exit 1
fi

echo ""
echo "🚀 Starting development servers..."

# Navigate to the project directory
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo "📁 Project directory: $PROJECT_DIR"

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Start ViralSplit frontend (Next.js)
echo "🌟 Starting ViralSplit frontend on port 3000..."
cd "$PROJECT_DIR/apps/viralsplit"
if [ -f "package.json" ]; then
    echo "📦 Found package.json, starting server..."
    npm run dev > "$PROJECT_DIR/logs/viralsplit.log" 2>&1 &
    VIRALSPLIT_PID=$!
    echo "✅ ViralSplit started (PID: $VIRALSPLIT_PID)"
else
    echo "❌ No package.json found in apps/viralsplit"
fi

# Start ContentMulti frontend (Next.js) on port 3001
echo "💼 Starting ContentMulti frontend on port 3001..."
cd "$PROJECT_DIR/apps/contentmulti"
if [ -f "package.json" ]; then
    echo "📦 Found package.json, starting server..."
    npm run dev -- --port 3001 > "$PROJECT_DIR/logs/contentmulti.log" 2>&1 &
    CONTENTMULTI_PID=$!
    echo "✅ ContentMulti started (PID: $CONTENTMULTI_PID)"
else
    echo "❌ No package.json found in apps/contentmulti"
fi

# Start API server (FastAPI) on port 8000 if available
echo "🔧 Checking for API server..."
cd "$PROJECT_DIR/apps/api"
if [ -f "main.py" ] && [ -f "requirements.txt" ]; then
    echo "🐍 Starting FastAPI server on port 8000..."
    # Check if virtual environment exists
    if [ -d "venv" ]; then
        source venv/bin/activate
        uvicorn main:app --reload --port 8000 > "$PROJECT_DIR/logs/api.log" 2>&1 &
        API_PID=$!
        echo "✅ API server started (PID: $API_PID)"
    else
        echo "⚠️  Virtual environment not found. Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    fi
else
    echo "ℹ️  API server files not found, skipping..."
fi

# Wait a moment for servers to start
echo "⏳ Waiting for servers to initialize..."
sleep 3

# Check if servers are responding
echo "🏥 Health check..."

# Check ViralSplit (port 3000)
if curl -s -I http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ ViralSplit responding on http://localhost:3000"
else
    echo "⚠️  ViralSplit not responding yet (may still be starting)"
fi

# Check ContentMulti (port 3001)
if curl -s -I http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ ContentMulti responding on http://localhost:3001"
else
    echo "⚠️  ContentMulti not responding yet (may still be starting)"
fi

# Check API (port 8000)
if curl -s -I http://localhost:8000 >/dev/null 2>&1; then
    echo "✅ API server responding on http://localhost:8000"
else
    echo "ℹ️  API server not available"
fi

echo ""
echo "🎉 Development environment restart complete!"
echo ""
echo "📍 Access your applications:"
echo "   🌟 ViralSplit (B2C):     http://localhost:3000"
echo "   🍎 Apple Design:         http://localhost:3000/apple"
echo "   💼 ContentMulti (B2B):   http://localhost:3001"
echo "   🔧 API Server:           http://localhost:8000 (if available)"
echo "   📚 API Docs:             http://localhost:8000/docs (if available)"
echo ""
echo "📊 Process IDs:"
[ ! -z "$VIRALSPLIT_PID" ] && echo "   ViralSplit:   $VIRALSPLIT_PID"
[ ! -z "$CONTENTMULTI_PID" ] && echo "   ContentMulti: $CONTENTMULTI_PID"  
[ ! -z "$API_PID" ] && echo "   API Server:   $API_PID"
echo ""
echo "📝 Logs available in:"
echo "   $(pwd)/logs/"
echo ""
echo "🛑 To stop all servers:"
echo "   kill $VIRALSPLIT_PID $CONTENTMULTI_PID $API_PID 2>/dev/null"
echo "   or run this script again to restart"