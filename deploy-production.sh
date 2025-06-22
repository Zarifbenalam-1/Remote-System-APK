#!/bin/bash

# Ghost Squared - Production Deployment Script

echo "🚀 Starting Ghost Squared deployment..."

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

# Create necessary directories
mkdir -p uploads
mkdir -p logs

# Set proper permissions
chmod 755 uploads
chmod 755 logs

# Build and start the application
echo "🏗️ Building Docker image..."
docker-compose build ghost-squared-prod

echo "🚀 Starting Ghost Squared in production mode..."
docker-compose --profile production up -d ghost-squared-prod

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 10

# Health check
if curl -f http://localhost:8080/api/status > /dev/null 2>&1; then
    echo "✅ Ghost Squared is running successfully!"
    echo "🌐 Access the dashboard at: http://localhost:8080/ghost-squared-command-center.html"
else
    echo "❌ Ghost Squared failed to start properly."
    echo "📋 Check logs with: docker-compose logs ghost-squared-prod"
    exit 1
fi

echo "🎯 Deployment complete!"
echo ""
echo "📊 Useful commands:"
echo "  View logs: docker-compose logs -f ghost-squared-prod"
echo "  Stop: docker-compose --profile production down"
echo "  Restart: docker-compose --profile production restart ghost-squared-prod"
