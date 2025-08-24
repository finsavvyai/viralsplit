#!/bin/bash

# ViralSplit Local Development Script

echo "🚀 Starting ViralSplit Local Development Environment"

# Check if .env file exists
if [ ! -f "apps/api/.env" ]; then
    echo "❌ Error: apps/api/.env file not found!"
    echo "Please copy apps/api/env.template to apps/api/.env and fill in your API keys"
    exit 1
fi

# Load environment variables
export $(cat apps/api/.env | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker Desktop and try again"
    exit 1
fi

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if API is responding
echo "🔍 Checking API health..."
for i in {1..30}; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ API is healthy!"
        break
    fi
    echo "⏳ Waiting for API... (attempt $i/30)"
    sleep 2
done

# Show service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 API Documentation:"
echo "   - Swagger UI: http://localhost:8000/docs"
echo "   - ReDoc: http://localhost:8000/redoc"
echo "   - Health Check: http://localhost:8000/health"

echo ""
echo "📱 Mobile App:"
echo "   - Start with: cd apps/viralsplit-mobile && npm start"

echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart API: docker-compose restart api"
echo "   - View Redis: docker-compose exec redis redis-cli"

echo ""
echo "🎉 ViralSplit is running locally!"
