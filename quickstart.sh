#!/bin/bash
# Quick start script for Image2SVG

set -e

echo "🚀 Image2SVG Quick Start"
echo "========================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi
echo ""

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Wait for backend
echo "   Checking backend..."
timeout 30 sh -c 'until curl -f http://localhost:8000/health > /dev/null 2>&1; do sleep 2; done' && \
    echo "   ✅ Backend is ready" || \
    echo "   ⚠️  Backend may need more time"

# Wait for frontend
echo "   Checking frontend..."
timeout 30 sh -c 'until curl -f http://localhost:3000 > /dev/null 2>&1; do sleep 2; done' && \
    echo "   ✅ Frontend is ready" || \
    echo "   ⚠️  Frontend may need more time"

echo ""
echo "================================"
echo "✅ Image2SVG is running!"
echo ""
echo "📍 Access points:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs:    http://localhost:8000/docs"
echo "   Health:      http://localhost:8000/health"
echo "   Prometheus:  http://localhost:9090"
echo ""
echo "📚 Quick commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Run tests:        make test"
echo "   View help:        make help"
echo ""
echo "📖 Documentation:"
echo "   README.md         - Getting started"
echo "   PERFORMANCE.md    - Performance tuning"
echo "   DEPLOYMENT.md     - Deployment guide"
echo "   TESTING.md        - Testing guide"
echo ""
echo "Happy vectorizing! 🎨"
