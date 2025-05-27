# 🏠 Local Deployment Guide

Complete guide for deploying the BEAST locally for development and testing.

## 📋 Table of Contents
- [Development Environment](#development-environment)
- [Quick Local Setup](#quick-local-setup)
- [Advanced Local Configuration](#advanced-local-configuration)
- [Local Testing](#local-testing)
- [Development Tools](#development-tools)
- [Local Troubleshooting](#local-troubleshooting)

## 🔧 Development Environment

### Prerequisites Check
```bash
# Check Node.js version (16+ required)
node --version

# Check npm version
npm --version

# Check Git
git --version

# Check port availability
netstat -an | grep :3000
```

### Environment Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Remote-System-Server

# Switch to standalone server
cd standalone-server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## ⚡ Quick Local Setup

### 1. Basic Configuration
Create `.env` file:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Security
JWT_SECRET=your-super-secret-jwt-key-for-development
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Redis (Optional for local)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=txt,log,json,xml,csv,pdf,doc,docx,zip

# Development Features
DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_CORS=true
```

### 2. Start the Server
```bash
# Development mode with auto-restart
npm run dev

# Or standard start
npm start

# With debug logs
DEBUG=* npm start
```

### 3. Verify Installation
```bash
# Check server health
curl http://localhost:3000/health

# Check API status
curl http://localhost:3000/api/status
```

## 🔧 Advanced Local Configuration

### Database Setup (Optional)
```bash
# Install Redis locally (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable Redis in .env
REDIS_ENABLED=true
```

### SSL Setup for Local Development
```bash
# Generate self-signed certificates
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

Update `.env`:
```env
HTTPS_ENABLED=true
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
```

### Multiple Environment Setup
```bash
# Development environment
cp .env .env.development

# Testing environment
cp .env .env.test

# Staging environment
cp .env .env.staging
```

## 🧪 Local Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Integration Tests
```bash
# API endpoint tests
npm run test:api

# WebSocket tests
npm run test:websocket

# File upload tests
npm run test:uploads
```

### Load Testing
```bash
# Install artillery (if not already installed)
npm install -g artillery

# Run load tests
artillery run load-test-config.yml

# Custom load test
artillery quick --count 10 --num 100 http://localhost:3000/health
```

### Manual Testing Scenarios

#### Device Connection Test
```javascript
// Test WebSocket connection
const socket = io('http://localhost:3000');

socket.emit('register_device', {
  deviceId: 'test-device-001',
  deviceInfo: {
    hostname: 'test-machine',
    platform: 'linux',
    arch: 'x64'
  }
});
```

#### API Testing with curl
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test device commands
curl -X POST http://localhost:3000/api/devices/test-device/command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"system_info"}'

# Test file upload
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-file.txt"
```

## 🛠️ Development Tools

### Hot Reload Setup
```bash
# Install nodemon globally
npm install -g nodemon

# Start with hot reload
nodemon server.js

# Or use npm script
npm run dev
```

### Debug Configuration

#### VS Code Launch Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug BEAST Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/standalone-server/server.js",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      },
      "envFile": "${workspaceFolder}/standalone-server/.env",
      "console": "integratedTerminal",
      "restart": true,
      "runtimeArgs": ["--inspect"]
    }
  ]
}
```

#### Chrome DevTools Debugging
```bash
# Start with inspector
node --inspect server.js

# Open chrome://inspect in Chrome browser
# Click "inspect" on your Node.js target
```

### Development Scripts
Create useful npm scripts in `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "debug": "node --inspect server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "logs": "tail -f logs/app-$(date +%Y-%m-%d).log"
  }
}
```

## 🔍 Local Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### Permission Issues
```bash
# Fix file permissions
chmod +x server.js
chmod -R 755 standalone-server/

# Fix upload directory permissions
mkdir -p uploads
chmod 777 uploads
```

#### Module Not Found
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 server.js

# Monitor memory usage
node --inspect --max-old-space-size=4096 server.js
```

### Log Analysis
```bash
# View real-time logs
tail -f logs/app-$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" logs/app-*.log

# View last 100 lines
tail -n 100 logs/app-$(date +%Y-%m-%d).log

# Monitor error log
tail -f logs/app-error.log
```

### Network Debugging
```bash
# Check if server is listening
netstat -tlnp | grep :3000

# Test local connectivity
curl -v http://localhost:3000/health

# Check firewall (Ubuntu)
sudo ufw status
```

### Performance Monitoring
```bash
# Monitor CPU and memory
top -p $(pgrep -f "node.*server.js")

# Node.js performance monitoring
node --prof server.js

# Generate performance report
node --prof-process isolate-*.log > performance-report.txt
```

## 🎯 Development Best Practices

### Code Organization
```
standalone-server/
├── server.js              # Main entry point
├── config/                 # Configuration files
├── middleware/             # Express middleware
├── services/              # Business logic
├── utils/                 # Helper functions
├── tests/                 # Test files
├── docs/                  # Documentation
└── .env                   # Environment variables
```

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git add .
git commit -m "feat: add new feature"
git push origin feature/new-feature

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

### Environment Management
- Use `.env` files for configuration
- Never commit sensitive data
- Use different configurations for different environments
- Validate environment variables on startup

## 📊 Development Metrics

### Performance Monitoring
```javascript
// Add to server.js for development metrics
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB'
    });
  }, 30000); // Every 30 seconds
}
```

## 🔄 Continuous Development

### File Watching
```bash
# Watch for file changes
npm install -g chokidar-cli
chokidar "**/*.js" -c "npm test"
```

### Automated Testing
```bash
# Set up pre-commit hooks
npm install -g husky
husky install
husky add .husky/pre-commit "npm test"
```

---

## 📚 Related Documentation
- [Installation Guide](03-INSTALLATION_GUIDE.md)
- [Configuration Guide](13-CONFIGURATION.md)
- [Troubleshooting](14-TROUBLESHOOTING.md)
- [Performance Tuning](15-PERFORMANCE_TUNING.md)

> **Next:** Deploy to production with [Render Deployment](11-RENDER_DEPLOYMENT.md) or [Docker Deployment](12-DOCKER_DEPLOYMENT.md)
