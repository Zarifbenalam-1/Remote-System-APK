# ⚙️ Configuration Guide

Comprehensive configuration guide for the BEAST Remote Device Management Server.

## 📋 Table of Contents
- [Configuration Overview](#configuration-overview)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Security Configuration](#security-configuration)
- [Performance Configuration](#performance-configuration)
- [Development vs Production](#development-vs-production)
- [Advanced Configuration](#advanced-configuration)

## 🔧 Configuration Overview

The BEAST system uses multiple configuration layers:

1. **Environment Variables** (.env files)
2. **Configuration Files** (JSON/JS files)
3. **Runtime Configuration** (Dynamic settings)
4. **Command Line Arguments**

### Configuration Priority
```
Command Line Args > Environment Variables > Config Files > Defaults
```

## 🌍 Environment Variables

### Core Server Configuration
```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================

# Node.js Environment
NODE_ENV=production                    # development, production, test
PORT=3000                             # Server port
HOST=0.0.0.0                         # Bind address (0.0.0.0 for all interfaces)

# Application Name and Version
APP_NAME=BEAST-Remote-Device-Manager
APP_VERSION=1.0.0
```

### Security Configuration
```env
# ===========================================
# SECURITY CONFIGURATION
# ===========================================

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d                     # 1h, 1d, 7d, 30d
JWT_ISSUER=beast-server
JWT_AUDIENCE=beast-clients

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_ALGORITHM=aes-256-gcm

# Password Security
BCRYPT_ROUNDS=12                      # 10-15 recommended
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=true

# Session Management
SESSION_SECRET=your-session-secret-key
SESSION_MAX_AGE=86400000             # 24 hours in milliseconds
SESSION_SECURE=true                   # HTTPS only
SESSION_HTTP_ONLY=true               # No client-side access
```

### Rate Limiting Configuration
```env
# ===========================================
# RATE LIMITING
# ===========================================

RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000         # Requests per window
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# API Specific Rate Limits
API_RATE_LIMIT_MAX=100               # API requests per window
API_RATE_LIMIT_WINDOW=60000          # 1 minute

# WebSocket Rate Limits
WS_RATE_LIMIT_MAX=50                 # WebSocket messages per window
WS_RATE_LIMIT_WINDOW=60000           # 1 minute
```

### Database Configuration
```env
# ===========================================
# REDIS CONFIGURATION
# ===========================================

REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0                           # Database number
REDIS_KEY_PREFIX=beast:              # Key prefix
REDIS_CONNECTION_TIMEOUT=5000        # Connection timeout in ms
REDIS_MAX_RETRIES=3                  # Max connection retries

# Redis Cluster (if using)
REDIS_CLUSTER_ENABLED=false
REDIS_CLUSTER_NODES=host1:port1,host2:port2
```

### File Upload Configuration
```env
# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================

MAX_FILE_SIZE=50MB                   # Individual file size limit
MAX_FILES_PER_REQUEST=10             # Number of files per upload
UPLOAD_TIMEOUT=300000                # 5 minutes
ALLOWED_FILE_TYPES=txt,log,json,xml,csv,pdf,doc,docx,zip,tar,gz

# Storage Configuration
UPLOAD_STORAGE_TYPE=local            # local, s3, gcs
UPLOAD_PATH=./uploads               # Local storage path
TEMP_PATH=./temp                    # Temporary files path

# Cleanup Configuration
AUTO_CLEANUP_ENABLED=true
CLEANUP_INTERVAL=3600000            # 1 hour
MAX_FILE_AGE=604800000              # 7 days
```

### Logging Configuration
```env
# ===========================================
# LOGGING CONFIGURATION
# ===========================================

LOG_LEVEL=info                      # error, warn, info, debug, trace
LOG_FORMAT=json                     # json, text
LOG_TIMESTAMP=true
LOG_COLORIZE=false                  # Colors in console output

# File Logging
LOG_TO_FILE=true
LOG_FILE_PATH=./logs
LOG_FILE_NAME=app.log
LOG_FILE_MAX_SIZE=10MB
LOG_FILE_MAX_FILES=5

# Error Logging
ERROR_LOG_ENABLED=true
ERROR_LOG_FILE=error.log
ERROR_STACK_TRACE=true

# Access Logging
ACCESS_LOG_ENABLED=true
ACCESS_LOG_FILE=access.log
ACCESS_LOG_FORMAT=combined
```

### Monitoring Configuration
```env
# ===========================================
# MONITORING CONFIGURATION
# ===========================================

# Health Checks
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30000         # 30 seconds
HEALTH_CHECK_TIMEOUT=5000           # 5 seconds

# Metrics
ENABLE_METRICS=true
METRICS_PORT=9090                   # Prometheus metrics port
METRICS_PATH=/metrics

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
PERFORMANCE_SAMPLE_RATE=0.1         # 10% sampling

# Alerts
ENABLE_ALERTS=true
ALERT_EMAIL_ENABLED=false
ALERT_WEBHOOK_ENABLED=false
ALERT_WEBHOOK_URL=https://your-webhook-url
```

### Network Configuration
```env
# ===========================================
# NETWORK CONFIGURATION
# ===========================================

# CORS
ENABLE_CORS=true
CORS_ORIGIN=*                       # Comma-separated origins
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_HEADERS=Content-Type,Authorization,X-Device-ID
CORS_CREDENTIALS=true

# SSL/TLS
HTTPS_ENABLED=false
SSL_KEY_PATH=./certs/key.pem
SSL_CERT_PATH=./certs/cert.pem
SSL_CA_PATH=./certs/ca.pem
FORCE_HTTPS=false

# Proxy Configuration
TRUST_PROXY=false                   # Set to true if behind proxy
PROXY_TIMEOUT=30000                 # 30 seconds
```

### WebSocket Configuration
```env
# ===========================================
# WEBSOCKET CONFIGURATION
# ===========================================

WS_ENABLED=true
WS_PORT=3000                        # Same as HTTP port
WS_PATH=/socket.io
WS_TRANSPORTS=websocket,polling
WS_PING_TIMEOUT=60000               # 60 seconds
WS_PING_INTERVAL=25000              # 25 seconds
WS_MAX_HTTP_BUFFER_SIZE=1048576     # 1MB

# Connection Limits
WS_MAX_CONNECTIONS=1000
WS_CONNECTION_TIMEOUT=20000         # 20 seconds
WS_HEARTBEAT_INTERVAL=30000         # 30 seconds
```

## 📄 Configuration Files

### Main Configuration File
Create `config/default.json`:
```json
{
  "server": {
    "name": "BEAST Remote Device Manager",
    "version": "1.0.0",
    "description": "Enterprise Remote Device Management Server",
    "author": "BEAST Team"
  },
  "features": {
    "deviceManagement": true,
    "fileTransfer": true,
    "realTimeMonitoring": true,
    "commandExecution": true,
    "userManagement": true,
    "auditLogging": true
  },
  "limits": {
    "maxDevicesPerUser": 100,
    "maxConcurrentConnections": 1000,
    "maxCommandQueueSize": 50,
    "maxSessionDuration": 86400000
  },
  "timeouts": {
    "deviceConnection": 30000,
    "commandExecution": 60000,
    "fileTransfer": 300000,
    "apiRequest": 30000
  },
  "intervals": {
    "heartbeat": 30000,
    "cleanup": 3600000,
    "metrics": 60000,
    "healthCheck": 30000
  }
}
```

### Environment-Specific Configurations

#### Development Configuration
Create `config/development.json`:
```json
{
  "server": {
    "debug": true,
    "verbose": true
  },
  "security": {
    "relaxed": true,
    "allowInsecureConnections": true
  },
  "logging": {
    "level": "debug",
    "colorize": true,
    "pretty": true
  },
  "features": {
    "mockDevices": true,
    "testEndpoints": true
  }
}
```

#### Production Configuration
Create `config/production.json`:
```json
{
  "server": {
    "debug": false,
    "verbose": false
  },
  "security": {
    "strict": true,
    "enforceHttps": true,
    "requireAuthentication": true
  },
  "logging": {
    "level": "info",
    "colorize": false,
    "structured": true
  },
  "features": {
    "mockDevices": false,
    "testEndpoints": false
  },
  "performance": {
    "compression": true,
    "caching": true,
    "clustering": true
  }
}
```

### Database Configuration
Create `config/database.json`:
```json
{
  "redis": {
    "development": {
      "host": "localhost",
      "port": 6379,
      "db": 0,
      "password": null,
      "options": {
        "maxRetriesPerRequest": 3,
        "retryDelayOnFailover": 100,
        "enableReadyCheck": true
      }
    },
    "production": {
      "host": "${REDIS_HOST}",
      "port": "${REDIS_PORT}",
      "db": "${REDIS_DB}",
      "password": "${REDIS_PASSWORD}",
      "options": {
        "maxRetriesPerRequest": 5,
        "retryDelayOnFailover": 1000,
        "enableReadyCheck": true,
        "lazyConnect": true
      }
    }
  }
}
```

## 🔒 Security Configuration

### Authentication Configuration
```javascript
// config/auth.js
module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    options: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'beast-server',
      audience: process.env.JWT_AUDIENCE || 'beast-clients',
      algorithm: 'HS256'
    }
  },
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
    maxAttempts: 5,
    lockoutDuration: 900000 // 15 minutes
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000,
    secure: process.env.SESSION_SECURE === 'true',
    httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
    sameSite: 'strict'
  }
};
```

### Security Headers Configuration
```javascript
// config/security.js
module.exports = {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "same-origin" }
  },
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: process.env.CORS_HEADERS?.split(',') || ['Content-Type', 'Authorization']
  }
};
```

## 🚀 Performance Configuration

### Clustering Configuration
```javascript
// config/cluster.js
const os = require('os');

module.exports = {
  enabled: process.env.CLUSTER_ENABLED === 'true',
  workers: process.env.CLUSTER_WORKERS || os.cpus().length,
  respawn: true,
  maxRespawns: 3,
  respawnDelay: 5000,
  killTimeout: 10000
};
```

### Caching Configuration
```javascript
// config/cache.js
module.exports = {
  redis: {
    enabled: process.env.REDIS_ENABLED === 'true',
    ttl: {
      short: 300,      // 5 minutes
      medium: 3600,    // 1 hour
      long: 86400,     // 24 hours
      session: 604800  // 7 days
    },
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'beast:',
    compression: true
  },
  memory: {
    enabled: true,
    maxSize: 100,     // MB
    ttl: 300,         // 5 minutes
    checkPeriod: 60   // 1 minute
  }
};
```

## 🔄 Development vs Production

### Development Environment
```env
# .env.development
NODE_ENV=development
DEBUG=*
LOG_LEVEL=debug
LOG_COLORIZE=true
REDIS_ENABLED=false
RATE_LIMIT_ENABLED=false
HTTPS_ENABLED=false
CORS_ORIGIN=*
ENABLE_MOCK_DEVICES=true
```

### Production Environment
```env
# .env.production
NODE_ENV=production
DEBUG=
LOG_LEVEL=info
LOG_COLORIZE=false
REDIS_ENABLED=true
RATE_LIMIT_ENABLED=true
HTTPS_ENABLED=true
CORS_ORIGIN=https://your-domain.com
ENABLE_MOCK_DEVICES=false
```

### Test Environment
```env
# .env.test
NODE_ENV=test
DEBUG=
LOG_LEVEL=error
REDIS_ENABLED=false
RATE_LIMIT_ENABLED=false
PORT=3001
ENABLE_METRICS=false
```

## 🔧 Advanced Configuration

### Custom Configuration Loader
```javascript
// config/loader.js
const fs = require('fs');
const path = require('path');

class ConfigLoader {
  constructor() {
    this.config = {};
    this.loadDefaults();
    this.loadEnvironment();
    this.loadFiles();
    this.validateConfig();
  }

  loadDefaults() {
    this.config = {
      server: {
        port: 3000,
        host: 'localhost'
      },
      security: {
        jwtSecret: 'default-secret-CHANGE-IN-PRODUCTION'
      },
      logging: {
        level: 'info'
      }
    };
  }

  loadEnvironment() {
    // Override with environment variables
    if (process.env.PORT) {
      this.config.server.port = parseInt(process.env.PORT);
    }
    if (process.env.JWT_SECRET) {
      this.config.security.jwtSecret = process.env.JWT_SECRET;
    }
    // ... more environment overrides
  }

  loadFiles() {
    const configDir = path.join(__dirname);
    const env = process.env.NODE_ENV || 'development';
    
    // Load default config
    const defaultPath = path.join(configDir, 'default.json');
    if (fs.existsSync(defaultPath)) {
      const defaultConfig = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
      this.config = { ...this.config, ...defaultConfig };
    }

    // Load environment-specific config
    const envPath = path.join(configDir, `${env}.json`);
    if (fs.existsSync(envPath)) {
      const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8'));
      this.config = { ...this.config, ...envConfig };
    }
  }

  validateConfig() {
    const required = [
      'server.port',
      'security.jwtSecret'
    ];

    for (const key of required) {
      if (!this.get(key)) {
        throw new Error(`Required configuration missing: ${key}`);
      }
    }

    // Validate JWT secret length
    if (this.get('security.jwtSecret').length < 32) {
      throw new Error('JWT secret must be at least 32 characters long');
    }
  }

  get(key) {
    return key.split('.').reduce((obj, k) => obj?.[k], this.config);
  }

  set(key, value) {
    const keys = key.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, k) => {
      if (!obj[k]) obj[k] = {};
      return obj[k];
    }, this.config);
    target[lastKey] = value;
  }

  getAll() {
    return { ...this.config };
  }
}

module.exports = new ConfigLoader();
```

### Dynamic Configuration Updates
```javascript
// config/dynamic.js
const EventEmitter = require('events');

class DynamicConfig extends EventEmitter {
  constructor(initialConfig) {
    super();
    this.config = initialConfig;
    this.watchers = new Map();
  }

  update(key, value) {
    const oldValue = this.get(key);
    this.set(key, value);
    this.emit('configChanged', { key, oldValue, newValue: value });
  }

  watch(key, callback) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key).add(callback);

    this.on('configChanged', ({ key: changedKey, oldValue, newValue }) => {
      if (changedKey === key) {
        callback(newValue, oldValue);
      }
    });
  }

  unwatch(key, callback) {
    if (this.watchers.has(key)) {
      this.watchers.get(key).delete(callback);
    }
  }
}

module.exports = DynamicConfig;
```

### Configuration Validation Schema
```javascript
// config/schema.js
const Joi = require('joi');

const configSchema = Joi.object({
  server: Joi.object({
    port: Joi.number().port().required(),
    host: Joi.string().required(),
    name: Joi.string().required()
  }).required(),
  
  security: Joi.object({
    jwtSecret: Joi.string().min(32).required(),
    encryptionKey: Joi.string().length(32).required(),
    bcryptRounds: Joi.number().min(10).max(15).default(12)
  }).required(),
  
  redis: Joi.object({
    enabled: Joi.boolean().default(false),
    host: Joi.string().when('enabled', { is: true, then: Joi.required() }),
    port: Joi.number().port().when('enabled', { is: true, then: Joi.required() }),
    password: Joi.string().allow(null, ''),
    db: Joi.number().min(0).max(15).default(0)
  }),
  
  logging: Joi.object({
    level: Joi.string().valid('error', 'warn', 'info', 'debug', 'trace').required(),
    format: Joi.string().valid('json', 'text').default('json'),
    file: Joi.object({
      enabled: Joi.boolean().default(true),
      path: Joi.string().default('./logs'),
      maxSize: Joi.string().default('10MB'),
      maxFiles: Joi.number().default(5)
    })
  })
});

function validateConfig(config) {
  const { error, value } = configSchema.validate(config, {
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    throw new Error(`Configuration validation error: ${error.message}`);
  }
  
  return value;
}

module.exports = { configSchema, validateConfig };
```

## 📝 Configuration Templates

### Complete .env Template
```env
# ===========================================
# BEAST CONFIGURATION TEMPLATE
# Copy this file to .env and customize
# ===========================================

# SERVER
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_NAME=BEAST-Remote-Device-Manager

# SECURITY (CHANGE THESE!)
JWT_SECRET=CHANGE_THIS_TO_SUPER_SECURE_SECRET_MIN_32_CHARS
ENCRYPTION_KEY=CHANGE_THIS_TO_32_CHAR_SECRET_KEY
SESSION_SECRET=CHANGE_THIS_SESSION_SECRET

# REDIS
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# RATE LIMITING
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# FILE UPLOAD
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=txt,log,json,xml,csv,pdf,doc,docx,zip

# LOGGING
LOG_LEVEL=info
LOG_TO_FILE=true

# MONITORING
ENABLE_HEALTH_CHECKS=true
ENABLE_METRICS=true

# NETWORK
ENABLE_CORS=true
CORS_ORIGIN=https://your-domain.com
HTTPS_ENABLED=false

# WEBSOCKET
WS_ENABLED=true
WS_MAX_CONNECTIONS=1000
```

---

## 📚 Related Documentation
- [Installation Guide](03-INSTALLATION_GUIDE.md)
- [Security System](07-SECURITY_SYSTEM.md)
- [Performance Tuning](15-PERFORMANCE_TUNING.md)
- [Troubleshooting](14-TROUBLESHOOTING.md)

> **Next:** Learn troubleshooting techniques in [Troubleshooting Guide](14-TROUBLESHOOTING.md)
