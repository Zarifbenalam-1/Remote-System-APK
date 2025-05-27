# 🔧 Troubleshooting Guide

Comprehensive troubleshooting guide for the BEAST Remote Device Management Server.

## 📋 Table of Contents
- [Quick Diagnostic Steps](#quick-diagnostic-steps)
- [Common Issues](#common-issues)
- [Server Issues](#server-issues)
- [Connection Issues](#connection-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Development Issues](#development-issues)
- [Deployment Issues](#deployment-issues)
- [Log Analysis](#log-analysis)
- [Diagnostic Tools](#diagnostic-tools)

## ⚡ Quick Diagnostic Steps

### Initial Health Check
```bash
# 1. Check if server is running
curl http://localhost:3000/health

# 2. Check server logs
tail -f logs/app-$(date +%Y-%m-%d).log

# 3. Check process status
ps aux | grep node

# 4. Check port availability
netstat -tlnp | grep :3000

# 5. Check system resources
free -h && df -h
```

### Environment Verification
```bash
# Check Node.js version
node --version  # Should be 16+

# Check npm version
npm --version

# Check environment variables
printenv | grep -E "NODE_ENV|PORT|JWT_SECRET"

# Verify configuration
npm run config:validate  # If script exists
```

## 🚨 Common Issues

### 1. Server Won't Start

#### Error: `EADDRINUSE`
**Problem:** Port already in use
```bash
# Find process using port
lsof -i :3000
# Or
netstat -tlnp | grep :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### Error: `Module not found`
**Problem:** Missing dependencies
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for peer dependencies
npm ls --depth=0
```

#### Error: `Permission denied`
**Problem:** File permissions
```bash
# Fix permissions
chmod +x server.js
chmod -R 755 standalone-server/
chown -R $USER:$USER standalone-server/

# Create required directories
mkdir -p uploads logs temp
chmod 777 uploads temp
```

### 2. Configuration Issues

#### Error: `JWT_SECRET not provided`
**Problem:** Missing environment variables
```bash
# Check .env file exists
ls -la .env

# Verify contents
cat .env | grep JWT_SECRET

# Create if missing
cp .env.example .env
```

#### Error: `Redis connection failed`
**Problem:** Redis not available
```bash
# Check Redis status
redis-cli ping

# Start Redis (Ubuntu/Debian)
sudo systemctl start redis-server

# Or disable Redis
echo "REDIS_ENABLED=false" >> .env
```

### 3. Authentication Issues

#### Error: `Invalid token`
**Problem:** JWT token issues
```javascript
// Verify token manually
const jwt = require('jsonwebtoken');
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token valid:', decoded);
} catch (error) {
  console.log('Token error:', error.message);
}
```

#### Error: `Unauthorized access`
**Problem:** Authentication middleware
```bash
# Check authentication endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Check token in subsequent requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/devices
```

## 🖥️ Server Issues

### Memory Issues

#### High Memory Usage
```bash
# Monitor memory usage
node --max-old-space-size=4096 server.js

# Or use PM2 with memory limits
pm2 start server.js --max-memory-restart 1G

# Check for memory leaks
node --inspect server.js
# Open chrome://inspect
```

#### Memory Leak Detection
```javascript
// Add to server.js for monitoring
if (process.env.NODE_ENV === 'development') {
  setInterval(() => {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
      rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(usage.external / 1024 / 1024) + 'MB'
    });
  }, 30000);
}
```

### CPU Issues

#### High CPU Usage
```bash
# Profile CPU usage
node --prof server.js

# Generate profile report
node --prof-process isolate-*.log > cpu-profile.txt

# Monitor with top
top -p $(pgrep -f "node.*server.js")
```

#### CPU Optimization
```javascript
// Use clustering for CPU-intensive tasks
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  require('./server.js');
}
```

### File System Issues

#### File Upload Problems
```bash
# Check upload directory permissions
ls -la uploads/
chmod 777 uploads/

# Check disk space
df -h

# Check file size limits
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@large-file.zip"
```

#### Log File Issues
```bash
# Check log directory
ls -la logs/

# Rotate logs if too large
find logs/ -name "*.log" -size +100M -exec mv {} {}.old \;

# Set up log rotation
cat > /etc/logrotate.d/beast << EOF
/path/to/beast/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 644 www-data www-data
}
EOF
```

## 🌐 Connection Issues

### WebSocket Problems

#### WebSocket Connection Failed
```javascript
// Debug WebSocket connection
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.log('Connection Error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### WebSocket Behind Proxy
```nginx
# Nginx configuration for WebSocket
location /socket.io/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_cache_bypass $http_upgrade;
}
```

### Network Connectivity

#### DNS Resolution Issues
```bash
# Test DNS resolution
nslookup your-domain.com
dig your-domain.com

# Check /etc/hosts
cat /etc/hosts

# Test connectivity
ping your-domain.com
telnet your-domain.com 3000
```

#### Firewall Issues
```bash
# Check firewall status (Ubuntu)
sudo ufw status

# Allow port 3000
sudo ufw allow 3000/tcp

# Check iptables
sudo iptables -L

# For AWS, check security groups
# For GCP, check firewall rules
```

## 🚀 Performance Issues

### Slow Response Times

#### Database Performance
```bash
# Check Redis performance
redis-cli --latency-history -i 1

# Monitor Redis memory
redis-cli info memory

# Check slow queries
redis-cli slowlog get 10
```

#### API Performance Monitoring
```javascript
// Add response time monitoring
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.log(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});
```

### Rate Limiting Issues

#### Too Many Requests
```bash
# Check rate limit configuration
grep -i rate .env

# Test rate limiting
for i in {1..20}; do
  curl -w "%{http_code}\n" http://localhost:3000/api/status
  sleep 0.1
done
```

#### Rate Limit Bypass
```javascript
// Custom rate limiting with Redis
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
```

## 🔒 Security Issues

### Authentication Problems

#### Failed Login Attempts
```bash
# Check failed login logs
grep "authentication failed" logs/app-*.log

# Check for brute force attempts
grep -c "failed login" logs/app-$(date +%Y-%m-%d).log
```

#### Session Management Issues
```javascript
// Debug session data
app.use('/debug/session', (req, res) => {
  if (process.env.NODE_ENV === 'development') {
    res.json({
      sessionID: req.sessionID,
      session: req.session,
      user: req.user
    });
  } else {
    res.status(404).send('Not found');
  }
});
```

### SSL/TLS Issues

#### Certificate Problems
```bash
# Check certificate validity
openssl x509 -in cert.pem -text -noout

# Test SSL connection
openssl s_client -connect localhost:443

# Check certificate chain
curl -I https://your-domain.com
```

#### Mixed Content Issues
```javascript
// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## 💻 Development Issues

### Hot Reload Problems

#### Nodemon Not Working
```bash
# Install nodemon globally
npm install -g nodemon

# Check nodemon configuration
cat nodemon.json

# Run with specific file extensions
nodemon --ext js,json,env server.js
```

#### File Watching Issues
```bash
# Increase file watch limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Check current limit
cat /proc/sys/fs/inotify/max_user_watches
```

### Testing Issues

#### Test Failures
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- auth.test.js

# Run tests with debugging
DEBUG=* npm test

# Check test coverage
npm run test:coverage
```

#### Mock Data Issues
```javascript
// Create comprehensive test fixtures
const mockDevice = {
  id: 'test-device-001',
  hostname: 'test-machine',
  platform: 'linux',
  arch: 'x64',
  status: 'online',
  lastSeen: new Date().toISOString(),
  info: {
    cpu: { model: 'Test CPU', cores: 4 },
    memory: { total: 8000000000, free: 4000000000 },
    network: [{ interface: 'eth0', ip: '192.168.1.100' }]
  }
};
```

## 🚀 Deployment Issues

### Render.com Issues

#### Build Failures
```bash
# Check build logs in Render dashboard
# Common issues:
# - Node.js version mismatch
# - Missing environment variables
# - Build timeout

# Fix Node.js version in package.json
{
  "engines": {
    "node": ">=16.0.0",
    "npm": ">=8.0.0"
  }
}
```

#### Environment Variables
```bash
# Verify all required env vars in Render:
# - JWT_SECRET
# - ENCRYPTION_KEY
# - REDIS_ENABLED
# - NODE_ENV=production
```

### Docker Issues

#### Container Build Problems
```bash
# Build with verbose output
docker build --progress=plain -t beast-server .

# Check build logs
docker build --no-cache -t beast-server .

# Debug failed builds
docker run -it --rm beast-server:latest sh
```

#### Container Runtime Issues
```bash
# Check container logs
docker logs beast-server

# Execute shell in container
docker exec -it beast-server sh

# Check container resources
docker stats beast-server

# Check network connectivity
docker exec -it beast-server ping google.com
```

## 📊 Log Analysis

### Log Patterns to Watch

#### Error Patterns
```bash
# Authentication errors
grep -i "auth\|login\|token" logs/app-*.log

# Database errors
grep -i "redis\|connection\|timeout" logs/app-*.log

# Rate limiting
grep -i "rate limit\|too many" logs/app-*.log

# File upload errors
grep -i "upload\|multipart\|file" logs/app-*.log

# WebSocket errors
grep -i "websocket\|socket.io\|disconnect" logs/app-*.log
```

#### Performance Analysis
```bash
# Slow requests (>1000ms)
grep "duration.*[0-9][0-9][0-9][0-9]" logs/app-*.log

# Memory warnings
grep -i "memory\|heap\|gc" logs/app-*.log

# High CPU usage
grep -i "cpu\|load\|performance" logs/app-*.log
```

### Log Analysis Tools

#### Using jq for JSON Logs
```bash
# Filter by log level
cat logs/app.log | jq 'select(.level == "error")'

# Filter by timestamp
cat logs/app.log | jq 'select(.timestamp > "2023-01-01T00:00:00.000Z")'

# Count errors by type
cat logs/app.log | jq -r 'select(.level == "error") | .message' | sort | uniq -c
```

#### Using awk for Analysis
```bash
# Count requests by endpoint
awk '/GET|POST|PUT|DELETE/ {print $6}' logs/access.log | sort | uniq -c

# Find slow responses
awk '$NF > 1000 {print $0}' logs/access.log

# Memory usage trends
awk '/Memory Usage/ {print $3, $4}' logs/app.log
```

## 🛠️ Diagnostic Tools

### Health Check Scripts

#### System Health Check
```bash
#!/bin/bash
# health-check.sh

echo "=== BEAST Health Check ==="
echo "Date: $(date)"
echo

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
fi

# Check system resources
echo "💾 Memory usage:"
free -h

echo "💽 Disk usage:"
df -h /

echo "⚡ CPU load:"
uptime

# Check log errors in last hour
echo "📝 Recent errors:"
grep -c "ERROR" logs/app-$(date +%Y-%m-%d).log || echo "No error log found"

# Check process
echo "🔄 Process status:"
ps aux | grep -E "node.*server.js" | grep -v grep || echo "Process not found"

echo "=== End Health Check ==="
```

#### Network Diagnostic
```bash
#!/bin/bash
# network-diagnostic.sh

echo "=== Network Diagnostic ==="

# Check ports
echo "🔌 Port status:"
netstat -tlnp | grep -E ":3000|:6379"

# Check connectivity
echo "🌐 External connectivity:"
ping -c 1 google.com > /dev/null && echo "✅ Internet OK" || echo "❌ No internet"

# Check DNS
echo "🔍 DNS resolution:"
nslookup google.com > /dev/null && echo "✅ DNS OK" || echo "❌ DNS failed"

# Check WebSocket
echo "🔗 WebSocket test:"
node -e "
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {timeout: 5000});
socket.on('connect', () => {console.log('✅ WebSocket OK'); process.exit(0);});
socket.on('connect_error', () => {console.log('❌ WebSocket failed'); process.exit(1);});
setTimeout(() => {console.log('❌ WebSocket timeout'); process.exit(1);}, 6000);
"

echo "=== End Network Diagnostic ==="
```

### Performance Monitoring

#### CPU and Memory Monitor
```javascript
// monitor.js
const os = require('os');

function getSystemStats() {
  const cpuUsage = os.loadavg();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    timestamp: new Date().toISOString(),
    cpu: {
      load1min: cpuUsage[0],
      load5min: cpuUsage[1],
      load15min: cpuUsage[2]
    },
    memory: {
      total: Math.round(totalMem / 1024 / 1024),
      used: Math.round(usedMem / 1024 / 1024),
      free: Math.round(freeMem / 1024 / 1024),
      percentage: Math.round((usedMem / totalMem) * 100)
    },
    uptime: Math.round(os.uptime())
  };
}

// Monitor every 30 seconds
setInterval(() => {
  const stats = getSystemStats();
  console.log(JSON.stringify(stats));
  
  // Alert if memory usage > 80%
  if (stats.memory.percentage > 80) {
    console.log('⚠️  HIGH MEMORY USAGE ALERT:', stats.memory.percentage + '%');
  }
  
  // Alert if load average > CPU count
  if (stats.cpu.load1min > os.cpus().length) {
    console.log('⚠️  HIGH CPU LOAD ALERT:', stats.cpu.load1min);
  }
}, 30000);
```

### Automated Troubleshooting

#### Auto-Recovery Script
```bash
#!/bin/bash
# auto-recovery.sh

LOG_FILE="logs/auto-recovery.log"

log() {
    echo "$(date): $1" >> $LOG_FILE
    echo "$(date): $1"
}

# Check if server is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    log "Server not responding, attempting restart..."
    
    # Kill existing process
    pkill -f "node.*server.js"
    sleep 5
    
    # Start server
    cd /path/to/beast
    npm start &
    
    log "Server restart initiated"
    
    # Wait and verify
    sleep 10
    if curl -s http://localhost:3000/health > /dev/null; then
        log "Server restart successful"
    else
        log "Server restart failed - manual intervention required"
        # Send alert (email, webhook, etc.)
    fi
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log "Disk usage high: ${DISK_USAGE}%"
    
    # Clean old logs
    find logs/ -name "*.log" -mtime +7 -delete
    find uploads/ -name "*" -mtime +30 -delete
    
    log "Cleanup completed"
fi

# Check memory usage
MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEM_USAGE -gt 80 ]; then
    log "Memory usage high: ${MEM_USAGE}%"
    
    # Restart server to free memory
    log "Restarting server due to high memory usage"
    pkill -f "node.*server.js"
    sleep 5
    npm start &
fi
```

---

## 📚 Related Documentation
- [Installation Guide](03-INSTALLATION_GUIDE.md)
- [Configuration Guide](13-CONFIGURATION.md)
- [Monitoring & Logging](08-MONITORING_LOGGING.md)
- [Performance Tuning](15-PERFORMANCE_TUNING.md)

> **Need Help?** Check our [FAQ](18-FREQUENTLY_ASKED_QUESTIONS.md) or join our support community!
