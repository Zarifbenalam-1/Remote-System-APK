# 📊 Monitoring & Logging - The Beast's Eyes and Ears

## Table of Contents
- [Monitoring Overview](#monitoring-overview)
- [System Monitoring](#system-monitoring)
- [Performance Metrics](#performance-metrics)
- [Health Checks](#health-checks)
- [Logging System](#logging-system)
- [Error Tracking](#error-tracking)
- [Real-time Monitoring](#real-time-monitoring)
- [Alerting System](#alerting-system)
- [Dashboard Metrics](#dashboard-metrics)
- [Log Analysis](#log-analysis)
- [Monitoring Best Practices](#monitoring-best-practices)

## Monitoring Overview

The Beast includes comprehensive monitoring and logging to provide complete visibility into system performance, device health, and operational metrics.

```
┌─────────────────────────────────────────────────────────────┐
│                   MONITORING ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────┤
│  📈 Metrics Collection │ 📊 Real-time Dashboard              │
├─────────────────────────────────────────────────────────────┤
│  📝 Centralized Logs   │ 🔍 Log Analysis & Search           │
├─────────────────────────────────────────────────────────────┤
│  🚨 Alert Management   │ 📧 Notification System             │
├─────────────────────────────────────────────────────────────┤
│  💾 Data Storage       │ 📉 Historical Analysis             │
└─────────────────────────────────────────────────────────────┘
```

### Key Monitoring Components

1. **System Metrics**: CPU, Memory, Network, Disk usage
2. **Application Metrics**: Response times, throughput, errors
3. **Device Metrics**: Connected devices, health status
4. **Business Metrics**: Commands executed, files transferred
5. **Security Metrics**: Authentication attempts, failed logins

## System Monitoring

### 1. System Resource Monitoring

```javascript
const os = require('os');
const process = require('process');

class SystemMonitor {
    constructor() {
        this.metrics = {
            system: {},
            process: {},
            application: {}
        };
        
        this.startMonitoring();
    }
    
    // Collect system metrics
    collectSystemMetrics() {
        return {
            timestamp: new Date().toISOString(),
            
            // CPU Information
            cpu: {
                usage: this.getCpuUsage(),
                cores: os.cpus().length,
                model: os.cpus()[0].model,
                loadAverage: os.loadavg()
            },
            
            // Memory Information
            memory: {
                total: os.totalmem(),
                free: os.freemem(),
                used: os.totalmem() - os.freemem(),
                usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
            },
            
            // Process Information
            process: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                pid: process.pid,
                version: process.version,
                arch: process.arch
            },
            
            // Network Information
            network: {
                interfaces: Object.keys(os.networkInterfaces()),
                hostname: os.hostname(),
                platform: os.platform(),
                release: os.release()
            }
        };
    }
    
    // CPU usage calculation
    getCpuUsage() {
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            Object.values(cpu.times).forEach(time => totalTick += time);
            totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        
        return 100 - ~~(100 * idle / total);
    }
    
    // Start periodic monitoring
    startMonitoring() {
        setInterval(() => {
            const metrics = this.collectSystemMetrics();
            this.updateMetrics(metrics);
            this.checkThresholds(metrics);
        }, 30000); // Every 30 seconds
    }
    
    // Update metrics store
    updateMetrics(metrics) {
        this.metrics = {
            ...this.metrics,
            system: metrics,
            lastUpdated: new Date().toISOString()
        };
        
        // Emit metrics for real-time dashboard
        global.io?.emit('system.metrics', metrics);
    }
    
    // Check alert thresholds
    checkThresholds(metrics) {
        const alerts = [];
        
        // CPU threshold
        if (metrics.cpu.usage > 80) {
            alerts.push({
                type: 'warning',
                metric: 'cpu',
                value: metrics.cpu.usage,
                threshold: 80,
                message: `High CPU usage: ${metrics.cpu.usage.toFixed(2)}%`
            });
        }
        
        // Memory threshold
        if (metrics.memory.usagePercent > 85) {
            alerts.push({
                type: 'warning',
                metric: 'memory',
                value: metrics.memory.usagePercent,
                threshold: 85,
                message: `High memory usage: ${metrics.memory.usagePercent.toFixed(2)}%`
            });
        }
        
        // Process alerts if any
        if (alerts.length > 0) {
            this.triggerAlerts(alerts);
        }
    }
    
    // Get current metrics
    getMetrics() {
        return this.metrics;
    }
}
```

### 2. Application Performance Monitoring

```javascript
class ApplicationMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                successful: 0,
                failed: 0,
                averageResponseTime: 0
            },
            websockets: {
                totalConnections: 0,
                activeConnections: 0,
                messagesProcessed: 0
            },
            devices: {
                registered: 0,
                online: 0,
                offline: 0
            },
            commands: {
                executed: 0,
                successful: 0,
                failed: 0,
                averageExecutionTime: 0
            },
            files: {
                uploaded: 0,
                downloaded: 0,
                totalSize: 0
            }
        };
        
        this.startTime = Date.now();
        this.requestTimes = [];
        this.commandTimes = [];
    }
    
    // Record HTTP request metrics
    recordRequest(statusCode, responseTime) {
        this.metrics.requests.total++;
        
        if (statusCode >= 200 && statusCode < 400) {
            this.metrics.requests.successful++;
        } else {
            this.metrics.requests.failed++;
        }
        
        this.requestTimes.push(responseTime);
        
        // Keep only last 1000 request times
        if (this.requestTimes.length > 1000) {
            this.requestTimes = this.requestTimes.slice(-1000);
        }
        
        // Update average response time
        this.metrics.requests.averageResponseTime = 
            this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
    }
    
    // Record WebSocket connection
    recordWebSocketConnection(action) {
        if (action === 'connect') {
            this.metrics.websockets.totalConnections++;
            this.metrics.websockets.activeConnections++;
        } else if (action === 'disconnect') {
            this.metrics.websockets.activeConnections--;
        }
    }
    
    // Record device metrics
    recordDeviceMetric(action, deviceData = {}) {
        switch (action) {
            case 'register':
                this.metrics.devices.registered++;
                break;
            case 'online':
                this.metrics.devices.online++;
                break;
            case 'offline':
                this.metrics.devices.offline++;
                this.metrics.devices.online = Math.max(0, this.metrics.devices.online - 1);
                break;
        }
    }
    
    // Record command execution
    recordCommand(success, executionTime) {
        this.metrics.commands.executed++;
        
        if (success) {
            this.metrics.commands.successful++;
        } else {
            this.metrics.commands.failed++;
        }
        
        this.commandTimes.push(executionTime);
        
        // Keep only last 1000 command times
        if (this.commandTimes.length > 1000) {
            this.commandTimes = this.commandTimes.slice(-1000);
        }
        
        // Update average execution time
        this.metrics.commands.averageExecutionTime = 
            this.commandTimes.reduce((a, b) => a + b, 0) / this.commandTimes.length;
    }
    
    // Record file operations
    recordFileOperation(operation, fileSize = 0) {
        switch (operation) {
            case 'upload':
                this.metrics.files.uploaded++;
                this.metrics.files.totalSize += fileSize;
                break;
            case 'download':
                this.metrics.files.downloaded++;
                break;
        }
    }
    
    // Get application metrics
    getMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.startTime,
            timestamp: new Date().toISOString()
        };
    }
    
    // Get performance summary
    getPerformanceSummary() {
        const now = Date.now();
        const uptimeHours = (now - this.startTime) / (1000 * 60 * 60);
        
        return {
            uptime: {
                milliseconds: now - this.startTime,
                hours: uptimeHours,
                formatted: this.formatUptime(now - this.startTime)
            },
            throughput: {
                requestsPerHour: this.metrics.requests.total / uptimeHours,
                commandsPerHour: this.metrics.commands.executed / uptimeHours
            },
            reliability: {
                requestSuccessRate: (this.metrics.requests.successful / this.metrics.requests.total) * 100,
                commandSuccessRate: (this.metrics.commands.successful / this.metrics.commands.executed) * 100
            },
            performance: {
                averageResponseTime: this.metrics.requests.averageResponseTime,
                averageCommandTime: this.metrics.commands.averageExecutionTime
            }
        };
    }
    
    formatUptime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else {
            return `${minutes}m ${seconds % 60}s`;
        }
    }
}
```

## Performance Metrics

### 1. Response Time Monitoring

```javascript
// Express middleware for response time monitoring
function responseTimeMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            
            // Record metrics
            applicationMonitor.recordRequest(res.statusCode, responseTime);
            
            // Log slow requests
            if (responseTime > 5000) { // 5 seconds
                logger.warn('Slow request detected', {
                    method: req.method,
                    url: req.url,
                    responseTime: responseTime,
                    statusCode: res.statusCode,
                    userAgent: req.get('User-Agent'),
                    ip: req.ip
                });
            }
            
            // Set response time header
            res.set('X-Response-Time', `${responseTime}ms`);
        });
        
        next();
    };
}
```

### 2. WebSocket Performance Monitoring

```javascript
// WebSocket performance monitoring
class WebSocketMonitor {
    constructor(io) {
        this.io = io;
        this.connectionMetrics = new Map();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.io.on('connection', (socket) => {
            const connectionStart = Date.now();
            
            // Initialize connection metrics
            this.connectionMetrics.set(socket.id, {
                connectedAt: connectionStart,
                messagesReceived: 0,
                messagesSent: 0,
                bytesReceived: 0,
                bytesSent: 0,
                lastActivity: connectionStart
            });
            
            // Monitor message events
            const originalEmit = socket.emit;
            socket.emit = (event, ...args) => {
                const metrics = this.connectionMetrics.get(socket.id);
                if (metrics) {
                    metrics.messagesSent++;
                    metrics.bytesSent += JSON.stringify(args).length;
                    metrics.lastActivity = Date.now();
                }
                return originalEmit.call(socket, event, ...args);
            };
            
            // Monitor incoming messages
            socket.onAny((event, ...args) => {
                const metrics = this.connectionMetrics.get(socket.id);
                if (metrics) {
                    metrics.messagesReceived++;
                    metrics.bytesReceived += JSON.stringify(args).length;
                    metrics.lastActivity = Date.now();
                }
            });
            
            // Clean up on disconnect
            socket.on('disconnect', () => {
                this.connectionMetrics.delete(socket.id);
                applicationMonitor.recordWebSocketConnection('disconnect');
            });
            
            applicationMonitor.recordWebSocketConnection('connect');
        });
    }
    
    getConnectionMetrics() {
        const metrics = Array.from(this.connectionMetrics.entries()).map(([id, data]) => ({
            socketId: id,
            ...data,
            connectionDuration: Date.now() - data.connectedAt
        }));
        
        return {
            totalConnections: metrics.length,
            averageConnectionDuration: metrics.reduce((sum, m) => sum + m.connectionDuration, 0) / metrics.length,
            totalMessagesReceived: metrics.reduce((sum, m) => sum + m.messagesReceived, 0),
            totalMessagesSent: metrics.reduce((sum, m) => sum + m.messagesSent, 0),
            totalBytesReceived: metrics.reduce((sum, m) => sum + m.bytesReceived, 0),
            totalBytesSent: metrics.reduce((sum, m) => sum + m.bytesSent, 0),
            connections: metrics
        };
    }
}
```

## Health Checks

### 1. System Health Checks

```javascript
class HealthCheckService {
    constructor() {
        this.checks = new Map();
        this.registerDefaultChecks();
    }
    
    registerDefaultChecks() {
        // Database connectivity check
        this.registerCheck('database', async () => {
            try {
                // Check database connection
                // For this system, we check Redis if enabled
                if (process.env.REDIS_ENABLED === 'true') {
                    await redisClient.ping();
                }
                return { status: 'healthy', message: 'Database connection OK' };
            } catch (error) {
                return { status: 'unhealthy', message: error.message };
            }
        });
        
        // File system check
        this.registerCheck('filesystem', async () => {
            try {
                const fs = require('fs').promises;
                const uploadPath = process.env.UPLOAD_PATH || './uploads';
                
                await fs.access(uploadPath, fs.constants.W_OK);
                
                const stats = await fs.stat(uploadPath);
                return { 
                    status: 'healthy', 
                    message: 'File system accessible',
                    details: { uploadPath, writable: true }
                };
            } catch (error) {
                return { 
                    status: 'unhealthy', 
                    message: `File system error: ${error.message}` 
                };
            }
        });
        
        // Memory check
        this.registerCheck('memory', async () => {
            const usage = process.memoryUsage();
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
            
            const status = memoryUsagePercent > 90 ? 'unhealthy' : 'healthy';
            
            return {
                status,
                message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
                details: {
                    total: totalMem,
                    free: freeMem,
                    used: totalMem - freeMem,
                    usagePercent: memoryUsagePercent,
                    processMemory: usage
                }
            };
        });
        
        // External services check
        this.registerCheck('external_services', async () => {
            const results = {};
            let overallStatus = 'healthy';
            
            // Check external dependencies if any
            try {
                // Example: Check if external API is accessible
                // const response = await fetch('https://api.example.com/health');
                // results.externalAPI = response.ok;
                
                results.placeholder = true; // Remove when actual external services exist
                
                return {
                    status: overallStatus,
                    message: 'External services OK',
                    details: results
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    message: `External service error: ${error.message}`,
                    details: results
                };
            }
        });
    }
    
    registerCheck(name, checkFunction) {
        this.checks.set(name, checkFunction);
    }
    
    async runHealthCheck(checkName = null) {
        if (checkName) {
            const check = this.checks.get(checkName);
            if (!check) {
                throw new Error(`Health check '${checkName}' not found`);
            }
            
            const result = await check();
            return {
                [checkName]: {
                    ...result,
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Run all checks
        const results = {};
        let overallStatus = 'healthy';
        
        for (const [name, check] of this.checks) {
            try {
                const result = await check();
                results[name] = {
                    ...result,
                    timestamp: new Date().toISOString()
                };
                
                if (result.status === 'unhealthy') {
                    overallStatus = 'unhealthy';
                }
            } catch (error) {
                results[name] = {
                    status: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                };
                overallStatus = 'unhealthy';
            }
        }
        
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checks: results
        };
    }
    
    // Get health summary for dashboard
    async getHealthSummary() {
        const healthCheck = await this.runHealthCheck();
        const systemMetrics = systemMonitor.getMetrics();
        const appMetrics = applicationMonitor.getMetrics();
        
        return {
            overall: healthCheck.status,
            system: {
                uptime: process.uptime(),
                memory: systemMetrics.system.memory,
                cpu: systemMetrics.system.cpu
            },
            application: {
                uptime: appMetrics.uptime,
                requests: appMetrics.requests,
                devices: appMetrics.devices,
                performance: applicationMonitor.getPerformanceSummary()
            },
            checks: healthCheck.checks,
            timestamp: new Date().toISOString()
        };
    }
}
```

## Logging System

### 1. Winston Logger Configuration

```javascript
const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'beast-server' },
    transports: [
        // Console transport
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        
        // File transports
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 10
        }),
        
        // Application-specific logs
        new winston.transports.File({
            filename: path.join('logs', 'access.log'),
            level: 'info',
            maxsize: 5242880,
            maxFiles: 10
        })
    ]
});

// Separate logger for security events
const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join('logs', 'security.log'),
            maxsize: 5242880,
            maxFiles: 20 // Keep more security logs
        })
    ]
});

// Access logger for HTTP requests
const accessLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({
            filename: path.join('logs', 'access.log'),
            maxsize: 5242880,
            maxFiles: 15
        })
    ]
});

module.exports = { logger, securityLogger, accessLogger };
```

### 2. Structured Logging

```javascript
class StructuredLogger {
    constructor(baseLogger) {
        this.logger = baseLogger;
    }
    
    // Device-related logging
    logDeviceEvent(event, deviceId, details = {}) {
        this.logger.info('Device event', {
            event: event,
            deviceId: deviceId,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
    
    // Command execution logging
    logCommandExecution(commandId, deviceId, command, result, executionTime) {
        this.logger.info('Command executed', {
            commandId: commandId,
            deviceId: deviceId,
            command: command,
            success: !result.error,
            executionTime: executionTime,
            timestamp: new Date().toISOString(),
            result: result.error ? { error: result.error } : { output: result.output }
        });
    }
    
    // File operation logging
    logFileOperation(operation, filename, fileSize, userId, deviceId = null) {
        this.logger.info('File operation', {
            operation: operation,
            filename: filename,
            fileSize: fileSize,
            userId: userId,
            deviceId: deviceId,
            timestamp: new Date().toISOString()
        });
    }
    
    // Performance logging
    logPerformanceMetric(metric, value, threshold = null) {
        const level = threshold && value > threshold ? 'warn' : 'info';
        
        this.logger.log(level, 'Performance metric', {
            metric: metric,
            value: value,
            threshold: threshold,
            exceedsThreshold: threshold ? value > threshold : false,
            timestamp: new Date().toISOString()
        });
    }
    
    // Error logging with context
    logError(error, context = {}) {
        this.logger.error('Application error', {
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString()
        });
    }
    
    // Security event logging
    logSecurityEvent(event, severity, details = {}) {
        securityLogger.log(severity, 'Security event', {
            event: event,
            severity: severity,
            timestamp: new Date().toISOString(),
            ...details
        });
    }
}

const structuredLogger = new StructuredLogger(logger);
```

## Real-time Monitoring

### 1. Live Metrics Dashboard

```javascript
class LiveMetricsService {
    constructor(io) {
        this.io = io;
        this.metricsHistory = [];
        this.maxHistorySize = 1000;
        this.broadcastInterval = 5000; // 5 seconds
        
        this.startBroadcasting();
    }
    
    startBroadcasting() {
        setInterval(() => {
            const metrics = this.collectCurrentMetrics();
            this.addToHistory(metrics);
            this.broadcastMetrics(metrics);
        }, this.broadcastInterval);
    }
    
    collectCurrentMetrics() {
        const systemMetrics = systemMonitor.getMetrics();
        const appMetrics = applicationMonitor.getMetrics();
        const wsMetrics = webSocketMonitor.getConnectionMetrics();
        
        return {
            timestamp: new Date().toISOString(),
            system: {
                cpu: systemMetrics.system.cpu.usage,
                memory: systemMetrics.system.memory.usagePercent,
                uptime: systemMetrics.system.process.uptime
            },
            application: {
                requests: {
                    total: appMetrics.requests.total,
                    successful: appMetrics.requests.successful,
                    failed: appMetrics.requests.failed,
                    averageResponseTime: appMetrics.requests.averageResponseTime
                },
                devices: {
                    online: appMetrics.devices.online,
                    total: appMetrics.devices.registered
                },
                websockets: {
                    connections: wsMetrics.totalConnections,
                    messages: wsMetrics.totalMessagesReceived + wsMetrics.totalMessagesSent
                }
            }
        };
    }
    
    addToHistory(metrics) {
        this.metricsHistory.push(metrics);
        
        if (this.metricsHistory.length > this.maxHistorySize) {
            this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
        }
    }
    
    broadcastMetrics(metrics) {
        // Broadcast to admin dashboard
        this.io.to('admin').emit('metrics.update', metrics);
        
        // Broadcast summary to all connected clients
        this.io.emit('metrics.summary', {
            devices: metrics.application.devices,
            system: {
                cpu: metrics.system.cpu,
                memory: metrics.system.memory
            },
            timestamp: metrics.timestamp
        });
    }
    
    getMetricsHistory(timeRange = 3600) { // Default 1 hour
        const cutoff = Date.now() - (timeRange * 1000);
        
        return this.metricsHistory.filter(metric => 
            new Date(metric.timestamp).getTime() > cutoff
        );
    }
}
```

## Alerting System

### 1. Alert Manager

```javascript
class AlertManager {
    constructor() {
        this.alerts = [];
        this.alertRules = new Map();
        this.alertHandlers = new Map();
        
        this.setupDefaultRules();
        this.setupDefaultHandlers();
    }
    
    setupDefaultRules() {
        // CPU usage alert
        this.addRule('high_cpu', {
            condition: (metrics) => metrics.system.cpu.usage > 80,
            severity: 'warning',
            message: (metrics) => `High CPU usage: ${metrics.system.cpu.usage.toFixed(2)}%`,
            cooldown: 300000, // 5 minutes
            threshold: 80
        });
        
        // Memory usage alert
        this.addRule('high_memory', {
            condition: (metrics) => metrics.system.memory.usagePercent > 85,
            severity: 'warning',
            message: (metrics) => `High memory usage: ${metrics.system.memory.usagePercent.toFixed(2)}%`,
            cooldown: 300000,
            threshold: 85
        });
        
        // Response time alert
        this.addRule('slow_response', {
            condition: (metrics) => metrics.application.requests.averageResponseTime > 5000,
            severity: 'warning',
            message: (metrics) => `Slow response time: ${metrics.application.requests.averageResponseTime.toFixed(0)}ms`,
            cooldown: 600000, // 10 minutes
            threshold: 5000
        });
        
        // Error rate alert
        this.addRule('high_error_rate', {
            condition: (metrics) => {
                const total = metrics.application.requests.total;
                const failed = metrics.application.requests.failed;
                return total > 0 && (failed / total) > 0.05; // 5% error rate
            },
            severity: 'critical',
            message: (metrics) => {
                const errorRate = (metrics.application.requests.failed / metrics.application.requests.total) * 100;
                return `High error rate: ${errorRate.toFixed(2)}%`;
            },
            cooldown: 300000,
            threshold: 5
        });
    }
    
    setupDefaultHandlers() {
        // Console handler
        this.addHandler('console', (alert) => {
            console.log(`[ALERT ${alert.severity.toUpperCase()}] ${alert.message}`);
        });
        
        // File handler
        this.addHandler('file', (alert) => {
            logger.warn('Alert triggered', {
                rule: alert.rule,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp,
                metrics: alert.metrics
            });
        });
        
        // WebSocket handler (for dashboard)
        this.addHandler('websocket', (alert) => {
            global.io?.emit('alert', {
                id: alert.id,
                rule: alert.rule,
                severity: alert.severity,
                message: alert.message,
                timestamp: alert.timestamp
            });
        });
    }
    
    addRule(name, rule) {
        this.alertRules.set(name, {
            ...rule,
            lastTriggered: 0 // Timestamp of last trigger
        });
    }
    
    addHandler(name, handler) {
        this.alertHandlers.set(name, handler);
    }
    
    checkAlerts(metrics) {
        const now = Date.now();
        
        for (const [ruleName, rule] of this.alertRules) {
            // Check cooldown
            if (now - rule.lastTriggered < rule.cooldown) {
                continue;
            }
            
            // Check condition
            if (rule.condition(metrics)) {
                const alert = {
                    id: this.generateAlertId(),
                    rule: ruleName,
                    severity: rule.severity,
                    message: rule.message(metrics),
                    timestamp: new Date().toISOString(),
                    metrics: metrics
                };
                
                this.triggerAlert(alert);
                rule.lastTriggered = now;
            }
        }
    }
    
    triggerAlert(alert) {
        this.alerts.push(alert);
        
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
        
        // Execute all handlers
        for (const handler of this.alertHandlers.values()) {
            try {
                handler(alert);
            } catch (error) {
                logger.error('Alert handler error', { error: error.message });
            }
        }
    }
    
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getActiveAlerts() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        return this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > oneHourAgo
        );
    }
    
    getAlertHistory(timeRange = 86400) { // Default 24 hours
        const cutoff = Date.now() - (timeRange * 1000);
        
        return this.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > cutoff
        );
    }
}
```

## Monitoring Best Practices

### 1. Metric Collection Guidelines

```javascript
// Best practices for metric collection
const monitoringBestPractices = {
    // Collect metrics at appropriate intervals
    intervals: {
        system: 30000,     // 30 seconds for system metrics
        application: 5000,  // 5 seconds for app metrics
        health: 60000,     // 1 minute for health checks
        cleanup: 3600000   // 1 hour for cleanup tasks
    },
    
    // Set appropriate retention periods
    retention: {
        realtime: 3600,    // 1 hour of real-time data
        hourly: 86400,     // 24 hours of hourly aggregates
        daily: 2592000,    // 30 days of daily aggregates
        logs: 604800       // 7 days of detailed logs
    },
    
    // Define meaningful thresholds
    thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        disk: { warning: 85, critical: 95 },
        responseTime: { warning: 2000, critical: 5000 },
        errorRate: { warning: 3, critical: 10 }
    },
    
    // Use structured logging
    logStructure: {
        timestamp: 'ISO 8601',
        level: 'string',
        service: 'string',
        message: 'string',
        context: 'object',
        userId: 'string (optional)',
        deviceId: 'string (optional)',
        requestId: 'string (optional)'
    }
};
```

### 2. Dashboard Integration

```javascript
// API endpoints for monitoring dashboard
app.get('/api/monitoring/metrics', async (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 3600;
        const metrics = liveMetricsService.getMetricsHistory(timeRange);
        
        res.json({
            metrics: metrics,
            summary: await healthCheckService.getHealthSummary(),
            alerts: alertManager.getActiveAlerts()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/monitoring/health', async (req, res) => {
    try {
        const health = await healthCheckService.runHealthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/monitoring/alerts', (req, res) => {
    try {
        const timeRange = parseInt(req.query.timeRange) || 86400;
        const alerts = alertManager.getAlertHistory(timeRange);
        
        res.json({
            alerts: alerts,
            summary: {
                total: alerts.length,
                critical: alerts.filter(a => a.severity === 'critical').length,
                warning: alerts.filter(a => a.severity === 'warning').length
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

---

**Complete Visibility** - The Beast's comprehensive monitoring and logging system for enterprise operations! 📊
