#!/bin/bash

# ViralSplit Development Setup Script

echo "🚀 Starting ViralSplit development environment..."

# Check if we're in the correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the viralsplit root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command_exists redis-server; then
    echo "❌ Redis is not installed. Please install Redis first."
    echo "   macOS: brew install redis"
    echo "   Ubuntu: sudo apt-get install redis-server"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "✅ Dependencies check passed"

# Start Redis in background
echo "🚀 Starting Redis server..."
redis-server --daemonize yes

# Install backend dependencies if needed
if [ ! -d "apps/api/venv" ]; then
    echo "📦 Setting up Python virtual environment..."
    cd apps/api
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../..
fi

# Install frontend dependencies if needed
if [ ! -d "apps/viralsplit/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd apps/viralsplit
    npm install
    cd ../..
fi

# Create environment files if they don't exist
if [ ! -f "apps/api/.env" ]; then
    echo "📝 Creating backend environment file..."
    cp apps/api/.env.example apps/api/.env
    echo "⚠️  Please edit apps/api/.env with your Cloudflare R2 credentials"
fi

if [ ! -f "apps/viralsplit/.env.local" ]; then
    echo "📝 Creating frontend environment file..."
    cp apps/viralsplit/.env.example apps/viralsplit/.env.local
fi

# Start services in background
echo "🚀 Starting backend API server..."
cd apps/api
source venv/bin/activate
python main.py &
API_PID=$!
cd ../..

echo "🚀 Starting Celery worker..."
cd apps/api
source venv/bin/activate
celery -A main.celery_app worker --loglevel=info &
CELERY_PID=$!
cd ../..

# Wait a moment for backend to start
sleep 3

echo "🚀 Starting frontend development server..."
cd apps/viralsplit
npm run dev &
FRONTEND_PID=$!
cd ../..

# Create a function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $API_PID $CELERY_PID $FRONTEND_PID 2>/dev/null
    redis-cli shutdown 2>/dev/null
    exit
}

# Trap SIGINT and SIGTERM to cleanup
trap cleanup SIGINT SIGTERM

echo "✅ All services started!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait