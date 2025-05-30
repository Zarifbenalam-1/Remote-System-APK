# 10. Server Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Server Architecture](#server-architecture)
3. [Simple Server Setup](#simple-server-setup)
4. [Beast Server Setup](#beast-server-setup)
5. [Network Configuration](#network-configuration)
6. [Security Configuration](#security-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring Setup](#monitoring-setup)
9. [Troubleshooting](#troubleshooting)

## Overview

This comprehensive guide covers the setup and configuration of both server implementations in the Remote System APK project: the Simple Server and the Beast Server. Each server provides different capabilities and is suited for different use cases.

### Server Comparison

| Feature | Simple Server | Beast Server |
|---------|---------------|--------------|
| **Complexity** | Basic | Advanced |
| **Setup Time** | 5 minutes | 15-30 minutes |
| **Features** | Core functionality | Enterprise-grade |
| **Scalability** | Limited | High |
| **Security** | Basic | Advanced |
| **Monitoring** | None | Comprehensive |
| **Use Case** | Development/Testing | Production/Academic |

## Server Architecture

### System Requirements

**Minimum Requirements:**
- **OS**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **RAM**: 2GB available
- **Storage**: 1GB free space
- **Network**: Internet connection
- **Node.js**: Version 16.0 or higher

**Recommended Requirements:**
- **OS**: Latest versions of supported OS
- **RAM**: 4GB+ available
- **Storage**: 5GB+ free space
- **Network**: Stable broadband connection
- **Node.js**: Version 18.0 or higher
- **CPU**: Multi-core processor

## Simple Server Setup

### Step 1: Prerequisites

```bash
# Check Node.js version
node --version
npm --version

# If Node.js is not installed, install it
# Visit: https://nodejs.org/
```

### Step 2: Navigate to Simple Server Directory

```bash
cd /workspaces/Remote-System-APK/SERVER/simple-server
```

### Step 3: Install Dependencies

```bash
# Install required packages
npm install

# Verify installation
npm list
```

### Step 4: Configure Simple Server

```javascript
// server.js configuration options
const CONFIG = {
    PORT: process.env.PORT || 3000,
    HOST: process.env.HOST || 'localhost',
    UPLOAD_DIR: './uploads',
    MAX_FILE_SIZE: '50mb',
    CORS_ORIGIN: '*'
};
```

### Step 5: Start Simple Server

```bash
# Start the server
npm start

# Alternative: Start with nodemon for development
npx nodemon server.js
```

### Step 6: Verify Simple Server

```bash
# Test server is running
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"2025-05-30T10:00:00.000Z"}
```

## Beast Server Setup

### Step 1: Navigate to Beast Server Directory

```bash
cd /workspaces/Remote-System-APK/SERVER/beast/standalone-server
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Install development dependencies (optional)
npm install --include=dev
```

### Step 3: Configure Environment

```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

**Environment Configuration:**

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-here
API_KEY=your-api-key-here
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Database Configuration (if applicable)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=remote_system
DB_USER=admin
DB_PASSWORD=secure_password

# Monitoring Configuration
ENABLE_MONITORING=true
LOG_LEVEL=info
METRICS_PORT=9090

# File Upload Configuration
MAX_FILE_SIZE=100mb
UPLOAD_TIMEOUT=30000
```

### Step 4: Database Setup (Optional)

```bash
# If using database features
npm run db:migrate
npm run db:seed
```

### Step 5: Start Beast Server

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start

# Start with PM2 (recommended for production)
npm install -g pm2
pm2 start ecosystem.config.js
```

### Step 6: Verify Beast Server

```bash
# Health check
curl http://localhost:3001/api/health

# API status
curl http://localhost:3001/api/status

# Metrics endpoint
curl http://localhost:3001/metrics
```

## Network Configuration

### Firewall Settings

**Windows Firewall:**
```powershell
# Allow Node.js through firewall
netsh advfirewall firewall add rule name="Remote System Server" dir=in action=allow protocol=TCP localport=3000,3001
```

**Linux UFW:**
```bash
# Enable required ports
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw reload
```

**macOS:**
```bash
# Check if firewall is enabled
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Add Node.js to allowed applications if needed
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
```

### Port Configuration

| Server | Default Port | Alternative Port | Purpose |
|--------|--------------|------------------|---------|
| Simple Server | 3000 | 8080, 8000 | HTTP API |
| Beast Server | 3001 | 8081, 8001 | HTTP API |
| Metrics | 9090 | 9091 | Monitoring |
| Admin Panel | 9000 | 9001 | Management |

### Network Access

**Local Network Access:**
```javascript
// Bind to all interfaces
const HOST = '0.0.0.0';

// Or bind to specific interface
const HOST = '192.168.1.100';
```

**External Access Configuration:**
```bash
# Update server configuration
# Change localhost to 0.0.0.0 in server files

# Test external access
curl http://YOUR_IP_ADDRESS:3000/health
```

## Security Configuration

### SSL/TLS Setup

**Generate Self-Signed Certificate:**
```bash
# Create SSL directory
mkdir ssl

# Generate private key
openssl genrsa -out ssl/private-key.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/private-key.pem -out ssl/certificate.pem -days 365
```

**HTTPS Configuration:**
```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem')
};

https.createServer(options, app).listen(443, () => {
    console.log('HTTPS Server running on port 443');
});
```

### Authentication Setup

**API Key Authentication:**
```javascript
// Add to server configuration
const API_KEYS = [
    'development-key-12345',
    'production-key-67890'
];

// Middleware
function authenticateAPI(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    if (!API_KEYS.includes(apiKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    next();
}
```

### CORS Configuration

```javascript
// CORS setup for security
const cors = require('cors');

const corsOptions = {
    origin: [
        'http://localhost:3000',
        'https://yourdomain.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true
};

app.use(cors(corsOptions));
```

## Performance Optimization

### Server Optimization

**Memory Management:**
```javascript
// Increase Node.js memory limit
node --max-old-space-size=4096 server.js

// Use clustering for multi-core systems
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
} else {
    require('./server.js');
}
```

**Caching Strategy:**
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

// Memory caching
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 600 });
```

### Load Balancing

**Nginx Configuration:**
```nginx
upstream remote_system {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
}

server {
    listen 80;
    location / {
        proxy_pass http://remote_system;
    }
}
```

## Monitoring Setup

### Health Monitoring

**Health Check Endpoint:**
```javascript
app.get('/health', (req, res) => {
    const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version
    };
    res.json(health);
});
```

### Logging Configuration

**Winston Logger Setup:**
```javascript
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
```

### Metrics Collection

**Prometheus Metrics:**
```javascript
const promClient = require('prom-client');

// Create metrics
const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code']
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(promClient.register.metrics());
});
```

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find process using port
netstat -tulpn | grep :3000
lsof -i :3000

# Kill process
kill -9 PID_NUMBER
```

**Permission Denied:**
```bash
# Linux/macOS: Use sudo for ports < 1024
sudo node server.js

# Or use port > 1024
PORT=3000 node server.js
```

**Module Not Found:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Performance Issues

**High Memory Usage:**
```javascript
// Monitor memory usage
setInterval(() => {
    const usage = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(usage.rss / 1024 / 1024)} MB`);
}, 5000);
```

**Slow Responses:**
```javascript
// Add request timing middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${duration}ms`);
    });
    next();
});
```

### Network Issues

**Test Connectivity:**
```bash
# Test local connectivity
curl -v http://localhost:3000/health

# Test external connectivity
curl -v http://YOUR_IP:3000/health

# Check DNS resolution
nslookup your-domain.com
```

**Debug Network Configuration:**
```bash
# Check listening ports
netstat -tulpn | grep node

# Check network interfaces
ip addr show  # Linux
ifconfig      # macOS/BSD
```

## Academic Learning Objectives

Upon completion of this server setup guide, students will be able to:

1. **Configure Production Servers**: Set up robust server environments suitable for production use
2. **Implement Security Best Practices**: Apply authentication, encryption, and access controls
3. **Optimize Performance**: Configure caching, clustering, and load balancing
4. **Monitor System Health**: Implement comprehensive monitoring and logging
5. **Troubleshoot Issues**: Diagnose and resolve common server problems

## Best Practices

1. **Always use environment variables** for sensitive configuration
2. **Implement proper logging** for debugging and monitoring
3. **Use HTTPS in production** environments
4. **Monitor resource usage** continuously
5. **Keep dependencies updated** for security
6. **Document all configuration changes**
7. **Test server setup** in staging before production
8. **Implement graceful shutdown** procedures

---

**Navigation:**
- [← Previous: Testing Guide](09-TESTING_GUIDE.md)
- [→ Next: Deployment Guide](11-DEPLOYMENT_GUIDE.md)
- [📖 Documentation Home](README.md)
