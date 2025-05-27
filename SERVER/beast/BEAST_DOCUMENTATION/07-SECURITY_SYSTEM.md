# 🛡️ Security System - The Beast's Defense Mechanisms

## Table of Contents
- [Security Overview](#security-overview)
- [Authentication System](#authentication-system)
- [Authorization & Access Control](#authorization--access-control)
- [Transport Security](#transport-security)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [Rate Limiting & DDoS Protection](#rate-limiting--ddos-protection)
- [File Upload Security](#file-upload-security)
- [Security Headers](#security-headers)
- [Audit Logging](#audit-logging)
- [Encryption](#encryption)
- [Security Best Practices](#security-best-practices)

## Security Overview

The Beast implements enterprise-grade security with multiple layers of protection. Security is built into every component from the ground up.

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────┤
│  🌐 Network Layer    │  🔒 Transport Security (TLS/SSL)     │
├─────────────────────────────────────────────────────────────┤
│  🚪 Application Layer │  🔐 Authentication & Authorization  │
├─────────────────────────────────────────────────────────────┤
│  📝 Data Layer       │  🔒 Encryption & Validation         │
├─────────────────────────────────────────────────────────────┤
│  📊 Monitoring Layer │  🛡️ Audit Logging & Threat Detection│
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth**: Multiple security layers
2. **Zero Trust**: Never trust, always verify
3. **Least Privilege**: Minimum necessary access
4. **Fail Secure**: Secure defaults and failure modes
5. **Security by Design**: Built-in from the start

## Authentication System

### 1. JWT (JSON Web Token) Authentication

**Implementation**: Token-based stateless authentication

```javascript
// JWT Configuration
const jwtConfig = {
    secret: process.env.JWT_SECRET,
    expiresIn: '24h',
    issuer: 'beast-server',
    audience: 'beast-clients',
    algorithm: 'HS256'
};

// Token Generation
function generateToken(payload) {
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithm: jwtConfig.algorithm
    });
}

// Token Validation
function validateToken(token) {
    try {
        return jwt.verify(token, jwtConfig.secret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
            algorithms: [jwtConfig.algorithm]
        });
    } catch (error) {
        throw new AuthenticationError('Invalid token');
    }
}
```

### 2. Device Authentication

**Device Registration Flow**:
```javascript
// Device registration with pre-shared key
async function registerDevice(deviceInfo, preSharedKey) {
    // 1. Validate pre-shared key
    if (!validatePreSharedKey(preSharedKey)) {
        throw new Error('Invalid registration key');
    }
    
    // 2. Generate device-specific credentials
    const deviceCredentials = {
        deviceId: generateDeviceId(),
        apiKey: generateApiKey(),
        secret: generateDeviceSecret()
    };
    
    // 3. Store device credentials securely
    await storeDeviceCredentials(deviceCredentials);
    
    // 4. Generate JWT for device
    const token = generateToken({
        deviceId: deviceCredentials.deviceId,
        type: 'device',
        capabilities: deviceInfo.capabilities
    });
    
    return { token, deviceCredentials };
}
```

### 3. Session Management

```javascript
// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only
        httpOnly: true, // Prevent XSS
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict' // CSRF protection
    },
    store: redisStore // Redis session store
};
```

### 4. Multi-Factor Authentication (MFA)

```javascript
// TOTP (Time-based One-Time Password) implementation
const speakeasy = require('speakeasy');

class MFAService {
    generateSecret(user) {
        return speakeasy.generateSecret({
            name: `Beast Server (${user.email})`,
            issuer: 'Beast Remote Management'
        });
    }
    
    verifyToken(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps tolerance
        });
    }
    
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }
        return codes;
    }
}
```

## Authorization & Access Control

### 1. Role-Based Access Control (RBAC)

```javascript
// User roles and permissions
const roles = {
    SUPER_ADMIN: {
        permissions: '*', // All permissions
        description: 'Full system access'
    },
    ADMIN: {
        permissions: [
            'devices.*',
            'users.create',
            'users.read',
            'users.update',
            'system.read',
            'files.*',
            'commands.*'
        ],
        description: 'Administrative access'
    },
    MANAGER: {
        permissions: [
            'devices.read',
            'devices.update',
            'commands.execute',
            'files.upload',
            'files.download'
        ],
        description: 'Management access'
    },
    OPERATOR: {
        permissions: [
            'devices.read',
            'commands.execute.basic',
            'files.download'
        ],
        description: 'Operational access'
    },
    VIEWER: {
        permissions: [
            'devices.read',
            'system.read'
        ],
        description: 'Read-only access'
    }
};
```

### 2. Permission Middleware

```javascript
// Permission checking middleware
function requirePermission(permission) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            
            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            
            const hasPermission = await checkPermission(user, permission);
            
            if (!hasPermission) {
                auditLogger.warn('Unauthorized access attempt', {
                    userId: user.id,
                    permission: permission,
                    ip: req.ip,
                    userAgent: req.get('User-Agent')
                });
                
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
            
            next();
        } catch (error) {
            next(error);
        }
    };
}

// Usage examples
app.get('/api/devices', requirePermission('devices.read'), getDevices);
app.post('/api/devices', requirePermission('devices.create'), createDevice);
app.delete('/api/devices/:id', requirePermission('devices.delete'), deleteDevice);
```

### 3. Resource-Based Access Control

```javascript
// Check if user can access specific resource
async function checkResourceAccess(user, resourceType, resourceId, action) {
    // Check role-based permissions
    const hasRolePermission = await checkPermission(user, `${resourceType}.${action}`);
    
    if (!hasRolePermission) {
        return false;
    }
    
    // Check resource ownership or assignment
    switch (resourceType) {
        case 'device':
            return await checkDeviceAccess(user, resourceId);
        case 'file':
            return await checkFileAccess(user, resourceId);
        default:
            return hasRolePermission;
    }
}
```

## Transport Security

### 1. HTTPS/TLS Configuration

```javascript
// HTTPS server configuration
const https = require('https');
const fs = require('fs');

const tlsOptions = {
    key: fs.readFileSync(process.env.TLS_KEY_PATH),
    cert: fs.readFileSync(process.env.TLS_CERT_PATH),
    ca: fs.readFileSync(process.env.TLS_CA_PATH), // Optional CA bundle
    
    // Security options
    secureProtocol: 'TLSv1_2_method',
    honorCipherOrder: true,
    ciphers: [
        'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-SHA256',
        'ECDHE-RSA-AES256-SHA384'
    ].join(':')
};

// Create HTTPS server
const server = https.createServer(tlsOptions, app);
```

### 2. WebSocket Security (WSS)

```javascript
// Secure WebSocket configuration
const io = socketIo(server, {
    transports: ['websocket'], // Only WebSocket, no polling
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
        credentials: true
    },
    
    // Additional security
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 10000,
    maxHttpBufferSize: 1e6 // 1MB max message size
});

// WebSocket authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
            throw new Error('No authentication token provided');
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId || decoded.deviceId;
        socket.userType = decoded.type;
        
        // Rate limiting per socket
        socket.rateLimit = new Map();
        
        next();
    } catch (error) {
        next(new Error('Authentication failed'));
    }
});
```

## Input Validation & Sanitization

### 1. Express Validator Implementation

```javascript
const { body, param, query, validationResult } = require('express-validator');

// Validation rules
const validationRules = {
    deviceRegistration: [
        body('name')
            .trim()
            .isLength({ min: 1, max: 100 })
            .escape()
            .withMessage('Device name must be 1-100 characters'),
        
        body('type')
            .isIn(['mobile', 'desktop', 'server', 'iot'])
            .withMessage('Invalid device type'),
        
        body('platform')
            .trim()
            .isLength({ min: 1, max: 50 })
            .escape()
            .withMessage('Platform must be 1-50 characters'),
        
        body('version')
            .optional()
            .matches(/^\d+\.\d+\.\d+$/)
            .withMessage('Version must be in x.y.z format')
    ],
    
    commandExecution: [
        body('command')
            .trim()
            .isLength({ min: 1, max: 1000 })
            .withMessage('Command must be 1-1000 characters'),
        
        body('deviceId')
            .isUUID()
            .withMessage('Invalid device ID'),
        
        body('timeout')
            .optional()
            .isInt({ min: 1, max: 300 })
            .withMessage('Timeout must be 1-300 seconds'),
        
        body('parameters')
            .optional()
            .isObject()
            .withMessage('Parameters must be an object')
    ],
    
    userCreation: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Invalid email address'),
        
        body('password')
            .isLength({ min: 8, max: 128 })
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain uppercase, lowercase, number, and special character'),
        
        body('role')
            .isIn(['admin', 'manager', 'operator', 'viewer'])
            .withMessage('Invalid role')
    ]
};

// Validation middleware
function validate(rules) {
    return [
        ...rules,
        (req, res, next) => {
            const errors = validationResult(req);
            
            if (!errors.isEmpty()) {
                const errorDetails = errors.array().map(error => ({
                    field: error.param,
                    message: error.msg,
                    value: error.value
                }));
                
                return res.status(400).json({
                    error: 'Validation failed',
                    details: errorDetails
                });
            }
            
            next();
        }
    ];
}
```

### 2. SQL Injection Prevention

```javascript
// Parameterized queries (even though we're not using SQL)
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    return input
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+\s*=/gi, '') // Remove event handlers
        .trim();
}

// Command injection prevention
function sanitizeCommand(command) {
    const dangerousPatterns = [
        /[;&|`$()]/g, // Shell metacharacters
        /\.\./g, // Directory traversal
        /(rm|del|format|shutdown|reboot)\s/gi, // Dangerous commands
        />/g, // Redirections
        /<script/gi // Script tags
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(command)) {
            throw new Error('Command contains potentially dangerous characters');
        }
    }
    
    return command.trim();
}
```

## Rate Limiting & DDoS Protection

### 1. Express Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// General API rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // requests per window
    message: {
        error: 'Too many requests from this IP',
        retryAfter: 15 * 60 // seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    
    // Custom key generator (can include user ID)
    keyGenerator: (req) => {
        return req.user?.id || req.ip;
    }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Only 5 attempts per window
    skipSuccessfulRequests: true,
    message: {
        error: 'Too many authentication attempts',
        retryAfter: 15 * 60
    }
});

// Progressive delay for repeated requests
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100, // After 100 requests
    delayMs: 500, // Delay each request by 500ms
    maxDelayMs: 20000 // Maximum delay of 20 seconds
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/', speedLimiter);
```

### 2. WebSocket Rate Limiting

```javascript
// Per-socket rate limiting
class SocketRateLimiter {
    constructor(options = {}) {
        this.windowMs = options.windowMs || 60000; // 1 minute
        this.max = options.max || 100; // requests per window
        this.requests = new Map();
    }
    
    checkLimit(socketId) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        if (!this.requests.has(socketId)) {
            this.requests.set(socketId, []);
        }
        
        const socketRequests = this.requests.get(socketId);
        
        // Remove old requests
        const validRequests = socketRequests.filter(time => time > windowStart);
        
        if (validRequests.length >= this.max) {
            return false; // Rate limit exceeded
        }
        
        validRequests.push(now);
        this.requests.set(socketId, validRequests);
        
        return true; // Within rate limit
    }
    
    cleanup() {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        for (const [socketId, requests] of this.requests.entries()) {
            const validRequests = requests.filter(time => time > windowStart);
            
            if (validRequests.length === 0) {
                this.requests.delete(socketId);
            } else {
                this.requests.set(socketId, validRequests);
            }
        }
    }
}

const socketRateLimiter = new SocketRateLimiter({ max: 60 }); // 60 messages per minute

// Apply to socket events
io.on('connection', (socket) => {
    socket.on('command', (data) => {
        if (!socketRateLimiter.checkLimit(socket.id)) {
            socket.emit('error', { message: 'Rate limit exceeded' });
            return;
        }
        
        // Process command
        handleCommand(socket, data);
    });
});
```

## File Upload Security

### 1. File Validation

```javascript
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File type validation
const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.doc', '.docx'];

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_PATH || './uploads');
    },
    
    filename: (req, file, cb) => {
        // Generate secure filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `${uniqueSuffix}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
        files: 10 // Maximum 10 files
    },
    
    fileFilter: (req, file, cb) => {
        // Check MIME type
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error('Invalid file type'));
        }
        
        // Check file extension
        const extension = path.extname(file.originalname).toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            return cb(new Error('Invalid file extension'));
        }
        
        cb(null, true);
    }
});
```

### 2. File Content Scanning

```javascript
// Virus scanning (requires ClamAV)
const NodeClam = require('clamscan');

class FileScanner {
    constructor() {
        this.clamscan = new NodeClam().init({
            removeInfected: true,
            quarantineInfected: './quarantine/',
            scanLog: './logs/scan.log',
            debugMode: false
        });
    }
    
    async scanFile(filePath) {
        try {
            const result = await this.clamscan.scanFile(filePath);
            
            if (result.isInfected) {
                throw new Error(`File infected: ${result.viruses.join(', ')}`);
            }
            
            return true;
        } catch (error) {
            throw new Error(`Scan failed: ${error.message}`);
        }
    }
    
    // Content-based validation
    validateFileContent(filePath, expectedType) {
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(filePath);
        
        // Check file signatures (magic numbers)
        const signatures = {
            'image/jpeg': [0xFF, 0xD8, 0xFF],
            'image/png': [0x89, 0x50, 0x4E, 0x47],
            'application/pdf': [0x25, 0x50, 0x44, 0x46]
        };
        
        const signature = signatures[expectedType];
        if (signature) {
            for (let i = 0; i < signature.length; i++) {
                if (fileBuffer[i] !== signature[i]) {
                    throw new Error('File content does not match declared type');
                }
            }
        }
        
        return true;
    }
}
```

## Security Headers

### 1. Helmet.js Configuration

```javascript
const helmet = require('helmet');

app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    
    // HTTP Strict Transport Security
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    
    // Other security headers
    noSniff: true, // X-Content-Type-Options
    frameguard: { action: 'deny' }, // X-Frame-Options
    xssFilter: true, // X-XSS-Protection
    referrerPolicy: { policy: 'same-origin' }
}));
```

## Audit Logging

### 1. Security Event Logging

```javascript
const winston = require('winston');

// Security-specific logger
const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ 
            filename: 'logs/security.log',
            level: 'info'
        }),
        new winston.transports.File({ 
            filename: 'logs/security-errors.log',
            level: 'error'
        })
    ]
});

// Security events to log
const securityEvents = {
    AUTHENTICATION_SUCCESS: 'auth.success',
    AUTHENTICATION_FAILURE: 'auth.failure',
    AUTHORIZATION_FAILURE: 'auth.unauthorized',
    DEVICE_REGISTERED: 'device.registered',
    DEVICE_DISCONNECTED: 'device.disconnected',
    COMMAND_EXECUTED: 'command.executed',
    FILE_UPLOADED: 'file.uploaded',
    FILE_DOWNLOADED: 'file.downloaded',
    RATE_LIMIT_EXCEEDED: 'security.rate_limit',
    INVALID_INPUT: 'security.invalid_input',
    SUSPICIOUS_ACTIVITY: 'security.suspicious'
};

function logSecurityEvent(event, details = {}) {
    securityLogger.info(event, {
        timestamp: new Date().toISOString(),
        event: event,
        ...details
    });
}

// Usage examples
logSecurityEvent(securityEvents.AUTHENTICATION_SUCCESS, {
    userId: user.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
});

logSecurityEvent(securityEvents.RATE_LIMIT_EXCEEDED, {
    ip: req.ip,
    endpoint: req.path,
    attempts: rateLimitData.totalHits
});
```

## Encryption

### 1. Data Encryption

```javascript
const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.tagLength = 16;
        this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    }
    
    encrypt(text) {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipher(this.algorithm, this.key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex')
        };
    }
    
    decrypt(encryptedData) {
        const decipher = crypto.createDecipher(
            this.algorithm,
            this.key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    hashPassword(password) {
        const saltRounds = 12;
        return bcrypt.hash(password, saltRounds);
    }
    
    verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}
```

## Security Best Practices

### 1. Environment Security

```bash
# .env security checklist
# ✓ Strong, random secrets (min 32 characters)
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-super-secure-session-secret-min-32-chars
ENCRYPTION_KEY=64-character-hex-key-for-encryption

# ✓ Secure database credentials
DB_PASSWORD=strong-database-password

# ✓ API keys and tokens
EXTERNAL_API_KEY=secure-api-key

# ✓ Environment-specific settings
NODE_ENV=production
HTTPS_ENABLED=true
LOG_LEVEL=warn
```

### 2. Production Security Checklist

- [ ] **Environment Variables**: All secrets in environment variables
- [ ] **HTTPS Only**: TLS/SSL certificates properly configured
- [ ] **Security Headers**: Helmet.js configured with strict policies
- [ ] **Rate Limiting**: Proper rate limits on all endpoints
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **Authentication**: Strong JWT configuration with proper expiration
- [ ] **Authorization**: Role-based access control implemented
- [ ] **File Upload**: Secure file upload with type and size validation
- [ ] **Audit Logging**: All security events logged
- [ ] **Monitoring**: Security monitoring and alerting in place
- [ ] **Updates**: Dependencies regularly updated
- [ ] **Backups**: Secure backup strategy implemented

### 3. Common Vulnerabilities Prevention

#### XSS (Cross-Site Scripting)
```javascript
// Input sanitization
const xss = require('xss');

function sanitizeHtml(html) {
    return xss(html, {
        whiteList: {}, // No HTML allowed
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script']
    });
}
```

#### CSRF (Cross-Site Request Forgery)
```javascript
const csrf = require('csurf');

// CSRF protection
const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

app.use(csrfProtection);
```

#### Command Injection
```javascript
// Safe command execution
const { spawn } = require('child_process');

function executeCommand(command, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 30000 // 30 second timeout
        });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(stderr));
            }
        });
        
        child.on('error', reject);
    });
}
```

---

**Security Fortress** - The Beast's multi-layered defense system protecting your infrastructure! 🛡️
