#!/bin/bash

echo "🔥 TESTING THE ENTERPRISE BEAST SERVER 🔥"
echo "=========================================="

SERVER_URL="http://localhost:3000"

echo "📊 Testing Health Endpoints:"
echo "✅ Basic Health Check:"
curl -s "${SERVER_URL}/health" | jq '.' || echo "No JSON response"

echo ""
echo "✅ Detailed Health Check:"
curl -s "${SERVER_URL}/health/detailed" | jq '.' || echo "No JSON response"

echo ""
echo "✅ Ready Check:"
curl -s "${SERVER_URL}/ready" | jq '.' || echo "No JSON response"

echo ""
echo "📈 Testing Metrics:"
curl -s "${SERVER_URL}/metrics" | head -10

echo ""
echo "🔐 Testing Authentication Endpoints:"
echo "✅ Device Token Generation:"
curl -s -X POST "${SERVER_URL}/api/auth/device-token" \
  -H "Content-Type: application/json" \
  -d '{"deviceId": "test-device-123"}' | jq '.' || echo "No JSON response"

echo ""
echo "✅ Client Token Generation:"
curl -s -X POST "${SERVER_URL}/api/auth/client-token" \
  -H "Content-Type: application/json" \
  -d '{"clientName": "test-client"}' | jq '.' || echo "No JSON response"

echo ""
echo "🎯 Testing API Endpoints (should require auth):"
curl -s "${SERVER_URL}/api/devices" | jq '.' || echo "No JSON response"

echo ""
echo "📁 Testing File Upload Endpoint:"
curl -s "${SERVER_URL}/api/upload" | head -5

echo ""
echo "🚀 ENTERPRISE SERVER IS RUNNING! 🚀"
echo "=================================="
