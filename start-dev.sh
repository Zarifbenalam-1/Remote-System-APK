#!/bin/bash

# Ghost Squared - Development Setup Script

echo "🔧 Setting up Ghost Squared development environment..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js 16+ is required. Current version: $(node --version)"
    exit 1
fi

# Navigate to server directory
cd SERVER/simple-server

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories
mkdir -p uploads
mkdir -p logs

# Set proper permissions
chmod 755 uploads
chmod 755 logs

# Copy example config if it doesn't exist
if [ ! -f "firebase-service-account.json" ]; then
    echo "⚠️  Firebase service account not found."
    echo "📋 Please add your firebase-service-account.json file to SERVER/simple-server/"
fi

# Start development server
echo "🚀 Starting Ghost Squared development server..."
echo "🌐 Server will be available at: http://localhost:3000"
echo "🏠 Command Center: http://localhost:3000/ghost-squared-command-center.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev 2>/dev/null || node server.js
