# 📁 Generated Files and Directories Guide

## Overview

When you run the **Remote Device Management Server** (The Beast), it automatically generates various files and directories to support its operation. This guide explains what gets created, where it's stored, what each file contains, and how to manage them.

## 🗂️ Generated Directory Structure

```
project-root/
├── logs/                    # ✅ Generated automatically
│   ├── app-YYYY-MM-DD.log  # Daily application logs
│   ├── app-error.log       # Error-specific logs
│   ├── access.log          # HTTP access logs
│   └── security.log        # Security event logs
├── uploads/                 # ✅ Generated automatically
│   ├── devices/            # Device-specific uploads
│   ├── temp/               # Temporary file storage
│   └── archives/           # Archived files
├── sessions/               # ✅ Generated automatically (if file store used)
│   └── *.json             # Session files
├── cache/                  # ✅ Generated automatically
│   ├── responses/          # API response cache
│   └── static/             # Static file cache
├── monitoring/             # ✅ Generated automatically
│   ├── metrics.json        # Performance metrics
│   ├── health.json         # Health check results
│   └── alerts/             # Alert history
└── config/                 # ✅ Created if missing
    └── runtime.json        # Runtime configuration
```

## 📋 Detailed File Breakdown

### 1. Log Files (`logs/` directory)

#### **Daily Application Log**
- **File**: `logs/app-YYYY-MM-DD.log`
- **Created**: Automatically on first startup each day
- **Contains**:
  ```
  2025-05-26 10:15:23 [INFO] Server started on port 3000
  2025-05-26 10:15:24 [INFO] Database connection established
  2025-05-26 10:16:45 [INFO] Device 'laptop-001' connected from 192.168.1.100
  2025-05-26 10:17:12 [DEBUG] Command executed: ls -la
  2025-05-26 10:18:33 [INFO] File uploaded: document.pdf (2.5 MB)
  ```
- **Rotation**: New file created daily, old files archived after 30 days
- **Size**: Typically 10-100 MB per day (depending on activity)

#### **Error Log**
- **File**: `logs/app-error.log`
- **Created**: When first error occurs
- **Contains**:
  ```
  2025-05-26 10:20:15 [ERROR] Failed to connect to device 'server-002': Connection timeout
  2025-05-26 10:21:33 [ERROR] Authentication failed for IP 192.168.1.200
  2025-05-26 10:22:45 [ERROR] File upload failed: Disk space full
  ```
- **Rotation**: Rotated when exceeds 50 MB
- **Purpose**: Critical for debugging issues

#### **Access Log**
- **File**: `logs/access.log`
- **Created**: On first HTTP request
- **Contains**:
  ```
  192.168.1.100 - - [26/May/2025:10:15:23 +0000] "GET /api/devices HTTP/1.1" 200 1523
  192.168.1.100 - - [26/May/2025:10:16:45 +0000] "POST /api/command HTTP/1.1" 200 89
  192.168.1.200 - - [26/May/2025:10:17:12 +0000] "GET /api/unauthorized HTTP/1.1" 401 65
  ```
- **Format**: Common Log Format (CLF)
- **Purpose**: HTTP request tracking and analysis

#### **Security Log**
- **File**: `logs/security.log`
- **Created**: On first security event
- **Contains**:
  ```
  2025-05-26 10:18:00 [SECURITY] Rate limit exceeded for IP 192.168.1.200
  2025-05-26 10:19:15 [SECURITY] Invalid API key used: key_abc123...
  2025-05-26 10:20:30 [SECURITY] Suspicious file upload blocked: malware.exe
  ```
- **Purpose**: Security monitoring and incident response

### 2. Upload Files (`uploads/` directory)

#### **Device Uploads**
- **Directory**: `uploads/devices/[device-id]/`
- **Created**: When device first uploads a file
- **Structure**:
  ```
  uploads/devices/
  ├── laptop-001/
  │   ├── screenshots/
  │   │   ├── 2025-05-26_10-15-23.png
  │   │   └── 2025-05-26_10-16-45.png
  │   ├── documents/
  │   │   ├── report.pdf
  │   │   └── config.json
  │   └── logs/
  │       └── system.log
  └── server-002/
      ├── backups/
      │   └── database.sql
      └── configs/
          └── nginx.conf
  ```
- **Cleanup**: Files older than 90 days automatically archived

#### **Temporary Files**
- **Directory**: `uploads/temp/`
- **Created**: During file upload process
- **Contains**: Incomplete uploads, processing files
- **Cleanup**: Automatically cleaned every hour

#### **Archives**
- **Directory**: `uploads/archives/`
- **Created**: When files are archived
- **Contains**: Compressed old files
- **Format**: `.tar.gz` files with timestamps

### 3. Session Files (`sessions/` directory)

> **Note**: Only created if using file-based session storage

#### **Session Storage**
- **Files**: `sessions/*.json`
- **Created**: When user/device establishes session
- **Contains**:
  ```json
  {
    "sessionId": "sess_abc123def456",
    "deviceId": "laptop-001",
    "ipAddress": "192.168.1.100",
    "createdAt": "2025-05-26T10:15:23.000Z",
    "lastAccess": "2025-05-26T10:20:15.000Z",
    "data": {
      "authenticated": true,
      "permissions": ["read", "write", "execute"]
    }
  }
  ```
- **Cleanup**: Expired sessions removed automatically

### 4. Cache Files (`cache/` directory)

#### **Response Cache**
- **Directory**: `cache/responses/`
- **Created**: When response caching is enabled
- **Contains**: Cached API responses
- **Format**: JSON files with hash-based names
- **Expiry**: Automatically cleaned based on TTL

#### **Static File Cache**
- **Directory**: `cache/static/`
- **Created**: When serving static files
- **Contains**: Compressed versions of CSS, JS, images
- **Purpose**: Improved performance

### 5. Monitoring Files (`monitoring/` directory)

#### **Performance Metrics**
- **File**: `monitoring/metrics.json`
- **Created**: On server startup
- **Updated**: Every 30 seconds
- **Contains**:
  ```json
  {
    "timestamp": "2025-05-26T10:20:15.000Z",
    "cpu": {
      "usage": 15.6,
      "load": [0.8, 0.9, 1.1]
    },
    "memory": {
      "used": 512000000,
      "total": 2048000000,
      "percentage": 25.0
    },
    "connections": {
      "active": 23,
      "total": 156
    },
    "requests": {
      "perSecond": 12.5,
      "total": 1567
    }
  }
  ```

#### **Health Check Results**
- **File**: `monitoring/health.json`
- **Created**: On first health check
- **Updated**: Every 60 seconds
- **Contains**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-05-26T10:20:15.000Z",
    "checks": {
      "database": "healthy",
      "memory": "healthy",
      "disk": "warning",
      "network": "healthy"
    },
    "uptime": 3600,
    "version": "1.0.0"
  }
  ```

### 6. Configuration Files

#### **Runtime Configuration**
- **File**: `config/runtime.json`
- **Created**: If custom runtime config needed
- **Contains**: Dynamic configuration overrides
- **Purpose**: Runtime behavior modification

## 🔄 File Lifecycle Management

### Automatic Cleanup

The system automatically manages generated files:

```javascript
// Log rotation schedule
Daily logs:     Keep 30 days, then archive
Error logs:     Rotate at 50 MB, keep 10 files
Access logs:    Keep 7 days of detailed logs
Security logs:  Keep 90 days (compliance)

// Upload cleanup
Temp files:     Delete after 1 hour
Device files:   Archive after 90 days
Archives:       Keep for 1 year
```

### Manual Cleanup Commands

```bash
# Clean temporary files
npm run clean:temp

# Archive old logs
npm run archive:logs

# Clean old uploads
npm run clean:uploads --older-than=30d

# Clear all caches
npm run clear:cache
```

## 📊 Monitoring Generated Files

### Disk Space Monitoring

The system monitors disk usage for generated directories:

```javascript
// Disk space alerts
uploads/ > 1GB:     Warning notification
logs/ > 500MB:      Automatic cleanup
cache/ > 200MB:     Cache purge
temp/ > 100MB:      Emergency cleanup
```

### File Size Tracking

```bash
# Check generated file sizes
du -sh logs/ uploads/ cache/ sessions/ monitoring/

# Monitor in real-time
watch -n 5 'du -sh logs/ uploads/ cache/'
```

## 🛠️ Managing Generated Files

### Configuration Options

Control file generation in your configuration:

```javascript
// In your config file
{
  "logging": {
    "enabled": true,
    "level": "info",
    "maxFileSize": "50MB",
    "maxFiles": 10,
    "rotateDaily": true
  },
  "uploads": {
    "enabled": true,
    "maxFileSize": "100MB",
    "allowedTypes": [".pdf", ".jpg", ".png", ".txt"],
    "autoCleanup": true,
    "cleanupInterval": "24h"
  },
  "cache": {
    "enabled": true,
    "maxSize": "200MB",
    "ttl": "1h"
  },
  "monitoring": {
    "enabled": true,
    "updateInterval": "30s",
    "retentionPeriod": "7d"
  }
}
```

### Environment Variables

```bash
# Control file generation
export DISABLE_LOGGING=false
export MAX_UPLOAD_SIZE=104857600  # 100MB
export CACHE_ENABLED=true
export CLEANUP_INTERVAL=3600      # 1 hour

# Custom directories
export LOGS_DIR=/custom/logs
export UPLOADS_DIR=/custom/uploads
export CACHE_DIR=/custom/cache
```

## 🚨 Troubleshooting File Issues

### Common Problems

#### **Disk Space Full**
```bash
# Check disk usage
df -h

# Find large files
find . -type f -size +100M

# Clean temporary files
rm -rf uploads/temp/*
```

#### **Permission Issues**
```bash
# Fix permissions
chmod 755 logs/ uploads/ cache/
chown -R app:app logs/ uploads/ cache/
```

#### **Log Rotation Not Working**
```bash
# Check logrotate configuration
cat /etc/logrotate.d/beast-server

# Manual rotation
logrotate -f /etc/logrotate.d/beast-server
```

### Monitoring Commands

```bash
# Watch file creation
watch -n 1 'ls -la logs/ uploads/'

# Monitor disk usage
watch -n 5 'du -sh logs/ uploads/ cache/'

# Check file permissions
find . -type f -not -perm 644 -ls
find . -type d -not -perm 755 -ls
```

## 📚 Related Documentation

- **[13-CONFIGURATION.md](13-CONFIGURATION.md)** - Configuration options for file management
- **[08-MONITORING_LOGGING.md](08-MONITORING_LOGGING.md)** - Detailed logging configuration
- **[14-TROUBLESHOOTING.md](14-TROUBLESHOOTING.md)** - File-related troubleshooting
- **[15-PERFORMANCE_TUNING.md](15-PERFORMANCE_TUNING.md)** - Optimizing file operations

---

**Next**: [18-FREQUENTLY_ASKED_QUESTIONS.md](18-FREQUENTLY_ASKED_QUESTIONS.md) - Common questions and answers

**Previous**: [16-API_REFERENCE.md](16-API_REFERENCE.md) - Complete API documentation
