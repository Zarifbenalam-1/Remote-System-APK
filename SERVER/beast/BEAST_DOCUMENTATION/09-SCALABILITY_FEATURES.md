# ⚡ Scalability Features - The Beast's Growth Engine

## Table of Contents
- [Scalability Overview](#scalability-overview)
- [Horizontal Scaling](#horizontal-scaling)
- [Load Balancing](#load-balancing)
- [Session Management](#session-management)
- [Queue Management](#queue-management)
- [Caching Strategies](#caching-strategies)
- [Database Scaling](#database-scaling)
- [Auto-Scaling](#auto-scaling)
- [Performance Optimization](#performance-optimization)
- [Capacity Planning](#capacity-planning)
- [Scaling Best Practices](#scaling-best-practices)

## Scalability Overview

The Beast is designed for enterprise-scale deployments, supporting thousands of concurrent devices and high-throughput operations through multiple scaling strategies.

```
┌─────────────────────────────────────────────────────────────┐
│                    SCALING ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────┤
│  🌐 Load Balancer    │  ⚖️ Traffic Distribution            │
├─────────────────────────────────────────────────────────────┤
│  🔄 Beast Instances  │  📊 Auto-Scaling Groups             │
├─────────────────────────────────────────────────────────────┤
│  💾 Shared Storage   │  🗄️ Distributed Cache               │
├─────────────────────────────────────────────────────────────┤
│  📦 Queue System     │  🔧 Background Processing           │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Capabilities

1. **Horizontal Scaling**: Add more server instances
2. **Vertical Scaling**: Increase server resources
3. **Load Distribution**: Intelligent traffic routing
4. **Resource Pooling**: Shared components across instances
5. **Auto-Scaling**: Dynamic instance management

## Horizontal Scaling

### 1. Multi-Instance Architecture

```javascript
// Configuration for multiple instances
const clusterConfig = {
    instances: process.env.CLUSTER_SIZE || 'auto', // 'auto' uses CPU cores
    worker: {
        killTimeout: 5000,
        disableRefork: false
    },
    
    // Shared resources configuration
    shared: {
        redis: {
            enabled: true,
            cluster: process.env.REDIS_CLUSTER === 'true',
            nodes: process.env.REDIS_NODES?.split(',') || ['localhost:6379']
        },
        
        sessions: {
            store: 'redis', // Shared session store
            ttl: 86400 // 24 hours
        },
        
        uploads: {
            path: process.env.SHARED_UPLOAD_PATH || './shared/uploads',
            strategy: 'shared-filesystem' // or 'object-storage'
        }
    }
};

// Cluster setup with PM2 ecosystem
const pm2Config = {
    apps: [{
        name: 'beast-server',
        script: './server.js',
        instances: clusterConfig.instances,
        exec_mode: 'cluster',
        
        // Environment variables
        env: {
            NODE_ENV: 'production',
            PORT: 3000,
            REDIS_ENABLED: 'true',
            CLUSTER_MODE: 'true'
        },
        
        // Auto-restart configuration
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        
        // Logging
        log_file: './logs/combined.log',
        out_file: './logs/out.log',
        error_file: './logs/error.log',
        log_date_format: 'YYYY-MM-DD HH:mm Z',
        
        // Graceful shutdown
        kill_timeout: 5000,
        wait_ready: true,
        listen_timeout: 10000
    }]
};
```

### 2. Load Balancer Configuration

```nginx
# nginx.conf for load balancing
upstream beast_servers {
    # Load balancing method
    least_conn; # or ip_hash, round_robin
    
    # Server instances
    server 127.0.0.1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    keepalive 32;
}

server {
    listen 80;
    listen 443 ssl http2;
    server_name beast.yourdomain.com;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://beast_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeout
        proxy_read_timeout 86400;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://beast_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
    
    # Static files
    location /static/ {
        alias /path/to/static/files/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://beast_servers;
        access_log off;
    }
}

# Rate limiting zones
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;
}
```

### 3. Session Affinity & Sticky Sessions

```javascript
// Socket.IO with Redis adapter for multi-instance support
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

// Redis clients for Socket.IO adapter
const pubClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

const subClient = pubClient.duplicate();

// Setup Socket.IO with Redis adapter
io.adapter(createAdapter(pubClient, subClient));

// Session store configuration
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const sessionMiddleware = session({
    store: new RedisStore({ client: pubClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
});

// Share session middleware with Socket.IO
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});
```

## Load Balancing

### 1. Load Balancing Strategies

```javascript
// Custom load balancer implementation
class LoadBalancer {
    constructor() {
        this.servers = [];
        this.currentIndex = 0;
        this.healthChecks = new Map();
        this.strategies = {
            'round-robin': this.roundRobin.bind(this),
            'least-connections': this.leastConnections.bind(this),
            'weighted': this.weighted.bind(this),
            'health-based': this.healthBased.bind(this)
        };
        
        this.startHealthChecks();
    }
    
    addServer(server) {
        this.servers.push({
            ...server,
            connections: 0,
            weight: server.weight || 1,
            healthy: true,
            lastHealthCheck: Date.now()
        });
    }
    
    // Round robin strategy
    roundRobin() {
        const healthyServers = this.servers.filter(s => s.healthy);
        if (healthyServers.length === 0) return null;
        
        const server = healthyServers[this.currentIndex % healthyServers.length];
        this.currentIndex++;
        return server;
    }
    
    // Least connections strategy
    leastConnections() {
        const healthyServers = this.servers.filter(s => s.healthy);
        if (healthyServers.length === 0) return null;
        
        return healthyServers.reduce((min, server) => 
            server.connections < min.connections ? server : min
        );
    }
    
    // Weighted strategy
    weighted() {
        const healthyServers = this.servers.filter(s => s.healthy);
        if (healthyServers.length === 0) return null;
        
        const totalWeight = healthyServers.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const server of healthyServers) {
            random -= server.weight;
            if (random <= 0) return server;
        }
        
        return healthyServers[0];
    }
    
    // Health-based strategy
    healthBased() {
        const healthyServers = this.servers.filter(s => s.healthy);
        if (healthyServers.length === 0) return null;
        
        // Prefer servers with lower load
        return healthyServers.reduce((best, server) => {
            const serverLoad = server.connections / server.weight;
            const bestLoad = best.connections / best.weight;
            return serverLoad < bestLoad ? server : best;
        });
    }
    
    getServer(strategy = 'round-robin') {
        return this.strategies[strategy]();
    }
    
    // Health check implementation
    async startHealthChecks() {
        setInterval(async () => {
            for (const server of this.servers) {
                try {
                    const response = await fetch(`http://${server.host}:${server.port}/health`);
                    server.healthy = response.ok;
                    server.lastHealthCheck = Date.now();
                } catch (error) {
                    server.healthy = false;
                    server.lastHealthCheck = Date.now();
                }
            }
        }, 30000); // Check every 30 seconds
    }
}
```

### 2. Traffic Routing

```javascript
// Intelligent traffic routing based on request type
class TrafficRouter {
    constructor(loadBalancer) {
        this.loadBalancer = loadBalancer;
        this.routingRules = new Map();
        this.setupDefaultRules();
    }
    
    setupDefaultRules() {
        // File upload requests to high-capacity servers
        this.addRule('file-upload', {
            condition: (req) => req.path.includes('/files/upload'),
            serverFilter: (servers) => servers.filter(s => s.capabilities?.includes('high-storage')),
            strategy: 'least-connections'
        });
        
        // WebSocket connections to sticky sessions
        this.addRule('websocket', {
            condition: (req) => req.headers.upgrade === 'websocket',
            serverFilter: (servers) => servers.filter(s => s.capabilities?.includes('websocket')),
            strategy: 'weighted',
            sticky: true
        });
        
        // API requests to general pool
        this.addRule('api', {
            condition: (req) => req.path.startsWith('/api/'),
            serverFilter: (servers) => servers,
            strategy: 'round-robin'
        });
        
        // Dashboard requests can go anywhere
        this.addRule('dashboard', {
            condition: (req) => req.path === '/' || req.path.startsWith('/static/'),
            serverFilter: (servers) => servers,
            strategy: 'health-based'
        });
    }
    
    addRule(name, rule) {
        this.routingRules.set(name, rule);
    }
    
    route(req) {
        // Find matching rule
        for (const [name, rule] of this.routingRules) {
            if (rule.condition(req)) {
                const availableServers = rule.serverFilter(this.loadBalancer.servers);
                
                if (availableServers.length === 0) {
                    continue; // Try next rule
                }
                
                // Apply sticky sessions if required
                if (rule.sticky && req.session?.serverId) {
                    const stickyServer = availableServers.find(s => s.id === req.session.serverId);
                    if (stickyServer && stickyServer.healthy) {
                        return stickyServer;
                    }
                }
                
                // Get server using specified strategy
                const server = this.loadBalancer.getServer(rule.strategy);
                
                // Store server ID for sticky sessions
                if (rule.sticky && req.session) {
                    req.session.serverId = server.id;
                }
                
                return server;
            }
        }
        
        // Default routing
        return this.loadBalancer.getServer('round-robin');
    }
}
```

## Session Management

### 1. Distributed Session Store

```javascript
// Redis-based session management for scalability
const RedisStore = require('connect-redis')(session);
const redis = require('redis');

class DistributedSessionManager {
    constructor() {
        this.redisClient = redis.createClient({
            url: process.env.REDIS_URL,
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    return new Error('Redis server connection refused');
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return new Error('Retry time exhausted');
                }
                if (options.attempt > 10) {
                    return undefined;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });
        
        this.store = new RedisStore({
            client: this.redisClient,
            prefix: 'beast:session:',
            ttl: 86400 // 24 hours
        });
    }
    
    getSessionMiddleware() {
        return session({
            store: this.store,
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'strict'
            }
        });
    }
    
    // Custom session operations
    async getSession(sessionId) {
        const sessionData = await this.redisClient.get(`beast:session:${sessionId}`);
        return sessionData ? JSON.parse(sessionData) : null;
    }
    
    async setSession(sessionId, data, ttl = 86400) {
        await this.redisClient.setex(
            `beast:session:${sessionId}`,
            ttl,
            JSON.stringify(data)
        );
    }
    
    async deleteSession(sessionId) {
        await this.redisClient.del(`beast:session:${sessionId}`);
    }
    
    // Cleanup expired sessions
    async cleanupSessions() {
        const pattern = 'beast:session:*';
        const keys = await this.redisClient.keys(pattern);
        
        for (const key of keys) {
            const ttl = await this.redisClient.ttl(key);
            if (ttl === -1) { // No TTL set
                await this.redisClient.del(key);
            }
        }
    }
}
```

## Queue Management

### 1. Distributed Queue System

```javascript
const Bull = require('bull');

class ScalableQueueManager {
    constructor() {
        this.queues = new Map();
        this.processors = new Map();
        this.redisConfig = {
            redis: {
                port: process.env.REDIS_PORT || 6379,
                host: process.env.REDIS_HOST || 'localhost',
                password: process.env.REDIS_PASSWORD,
                db: process.env.REDIS_QUEUE_DB || 1
            }
        };
        
        this.setupQueues();
    }
    
    setupQueues() {
        // Command execution queue
        this.createQueue('commands', {
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 50,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });
        
        // File processing queue
        this.createQueue('files', {
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 25,
                attempts: 2,
                delay: 1000
            }
        });
        
        // Monitoring queue
        this.createQueue('monitoring', {
            defaultJobOptions: {
                removeOnComplete: 20,
                removeOnFail: 10,
                attempts: 1
            }
        });
        
        // Notification queue
        this.createQueue('notifications', {
            defaultJobOptions: {
                removeOnComplete: 100,
                removeOnFail: 25,
                attempts: 5,
                backoff: 'fixed',
                delay: 5000
            }
        });
    }
    
    createQueue(name, options = {}) {
        const queue = new Bull(name, {
            ...this.redisConfig,
            ...options
        });
        
        this.queues.set(name, queue);
        
        // Setup event listeners
        queue.on('completed', (job, result) => {
            logger.info(`Job ${job.id} completed in queue ${name}`, { result });
        });
        
        queue.on('failed', (job, err) => {
            logger.error(`Job ${job.id} failed in queue ${name}`, { error: err.message });
        });
        
        queue.on('stalled', (job) => {
            logger.warn(`Job ${job.id} stalled in queue ${name}`);
        });
        
        return queue;
    }
    
    // Add job to queue
    async addJob(queueName, jobName, data, options = {}) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        
        return await queue.add(jobName, data, options);
    }
    
    // Process jobs
    processJobs(queueName, processor, concurrency = 1) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        
        queue.process('*', concurrency, processor);
        this.processors.set(queueName, processor);
    }
    
    // Get queue statistics
    async getQueueStats(queueName) {
        const queue = this.queues.get(queueName);
        if (!queue) {
            throw new Error(`Queue ${queueName} not found`);
        }
        
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaiting(),
            queue.getActive(),
            queue.getCompleted(),
            queue.getFailed(),
            queue.getDelayed()
        ]);
        
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
            delayed: delayed.length
        };
    }
    
    // Cleanup and monitoring
    async cleanupQueues() {
        for (const [name, queue] of this.queues) {
            await queue.clean(24 * 60 * 60 * 1000, 'completed'); // Clean completed jobs older than 24h
            await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // Clean failed jobs older than 7 days
        }
    }
}
```

## Caching Strategies

### 1. Multi-Level Caching

```javascript
class MultiLevelCache {
    constructor() {
        // Memory cache (fastest, smallest)
        this.memoryCache = new Map();
        this.memoryCacheSize = 1000;
        
        // Redis cache (fast, larger)
        this.redisCache = redis.createClient({
            url: process.env.REDIS_URL
        });
        
        // Cache statistics
        this.stats = {
            hits: { memory: 0, redis: 0 },
            misses: { memory: 0, redis: 0 },
            sets: { memory: 0, redis: 0 }
        };
        
        this.setupCacheStrategies();
    }
    
    setupCacheStrategies() {
        // Cache strategies for different data types
        this.strategies = {
            // Device information - frequently accessed
            device: {
                memoryTTL: 300,  // 5 minutes
                redisTTL: 3600,  // 1 hour
                refreshThreshold: 0.8 // Refresh when 80% of TTL elapsed
            },
            
            // System metrics - very frequently accessed
            metrics: {
                memoryTTL: 60,   // 1 minute
                redisTTL: 300,   // 5 minutes
                refreshThreshold: 0.5
            },
            
            // File metadata - moderately accessed
            files: {
                memoryTTL: 600,  // 10 minutes
                redisTTL: 7200,  // 2 hours
                refreshThreshold: 0.9
            },
            
            // Configuration - rarely changes
            config: {
                memoryTTL: 1800, // 30 minutes
                redisTTL: 86400, // 24 hours
                refreshThreshold: 0.9
            }
        };
    }
    
    // Get data with multi-level fallback
    async get(key, type = 'default') {
        const strategy = this.strategies[type] || this.strategies.device;
        
        // Try memory cache first
        const memoryResult = this.getFromMemory(key);
        if (memoryResult.hit) {
            this.stats.hits.memory++;
            return memoryResult.data;
        }
        this.stats.misses.memory++;
        
        // Try Redis cache
        const redisResult = await this.getFromRedis(key);
        if (redisResult.hit) {
            this.stats.hits.redis++;
            
            // Populate memory cache
            this.setInMemory(key, redisResult.data, strategy.memoryTTL);
            
            return redisResult.data;
        }
        this.stats.misses.redis++;
        
        return null;
    }
    
    // Set data in all cache levels
    async set(key, data, type = 'default') {
        const strategy = this.strategies[type] || this.strategies.device;
        
        // Set in memory cache
        this.setInMemory(key, data, strategy.memoryTTL);
        this.stats.sets.memory++;
        
        // Set in Redis cache
        await this.setInRedis(key, data, strategy.redisTTL);
        this.stats.sets.redis++;
    }
    
    // Memory cache operations
    getFromMemory(key) {
        const item = this.memoryCache.get(key);
        
        if (!item) {
            return { hit: false };
        }
        
        if (Date.now() > item.expiry) {
            this.memoryCache.delete(key);
            return { hit: false };
        }
        
        return { hit: true, data: item.data };
    }
    
    setInMemory(key, data, ttl) {
        // LRU eviction if cache is full
        if (this.memoryCache.size >= this.memoryCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        
        this.memoryCache.set(key, {
            data: data,
            expiry: Date.now() + (ttl * 1000)
        });
    }
    
    // Redis cache operations
    async getFromRedis(key) {
        try {
            const data = await this.redisCache.get(key);
            
            if (!data) {
                return { hit: false };
            }
            
            return { hit: true, data: JSON.parse(data) };
        } catch (error) {
            logger.error('Redis cache get error', { key, error: error.message });
            return { hit: false };
        }
    }
    
    async setInRedis(key, data, ttl) {
        try {
            await this.redisCache.setex(key, ttl, JSON.stringify(data));
        } catch (error) {
            logger.error('Redis cache set error', { key, error: error.message });
        }
    }
    
    // Cache invalidation
    async invalidate(key) {
        this.memoryCache.delete(key);
        await this.redisCache.del(key);
    }
    
    async invalidatePattern(pattern) {
        // Memory cache pattern invalidation
        for (const key of this.memoryCache.keys()) {
            if (key.includes(pattern)) {
                this.memoryCache.delete(key);
            }
        }
        
        // Redis pattern invalidation
        const keys = await this.redisCache.keys(`*${pattern}*`);
        if (keys.length > 0) {
            await this.redisCache.del(...keys);
        }
    }
    
    // Cache statistics and monitoring
    getStats() {
        const totalHits = this.stats.hits.memory + this.stats.hits.redis;
        const totalMisses = this.stats.misses.memory + this.stats.misses.redis;
        const totalRequests = totalHits + totalMisses;
        
        return {
            ...this.stats,
            hitRate: totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0,
            memoryHitRate: (this.stats.hits.memory + this.stats.misses.memory) > 0 
                ? (this.stats.hits.memory / (this.stats.hits.memory + this.stats.misses.memory)) * 100 
                : 0,
            memoryCacheSize: this.memoryCache.size,
            totalRequests: totalRequests
        };
    }
}
```

## Auto-Scaling

### 1. Auto-Scaling Manager

```javascript
class AutoScalingManager {
    constructor() {
        this.config = {
            minInstances: parseInt(process.env.MIN_INSTANCES) || 2,
            maxInstances: parseInt(process.env.MAX_INSTANCES) || 10,
            scaleUpThreshold: {
                cpu: 70,      // CPU percentage
                memory: 80,   // Memory percentage
                connections: 1000, // Active connections
                responseTime: 2000 // Average response time in ms
            },
            scaleDownThreshold: {
                cpu: 30,
                memory: 40,
                connections: 200,
                responseTime: 500
            },
            scaleUpCooldown: 300000,   // 5 minutes
            scaleDownCooldown: 600000, // 10 minutes
            checkInterval: 60000       // 1 minute
        };
        
        this.lastScaleAction = 0;
        this.instances = [];
        this.metrics = [];
        
        this.startMonitoring();
    }
    
    startMonitoring() {
        setInterval(() => {
            this.checkScalingConditions();
        }, this.config.checkInterval);
    }
    
    async checkScalingConditions() {
        const currentMetrics = await this.collectMetrics();
        this.metrics.push(currentMetrics);
        
        // Keep only last 10 minutes of metrics
        this.metrics = this.metrics.slice(-10);
        
        const shouldScaleUp = this.shouldScaleUp(currentMetrics);
        const shouldScaleDown = this.shouldScaleDown(currentMetrics);
        
        const now = Date.now();
        
        if (shouldScaleUp && (now - this.lastScaleAction) > this.config.scaleUpCooldown) {
            await this.scaleUp();
            this.lastScaleAction = now;
        } else if (shouldScaleDown && (now - this.lastScaleAction) > this.config.scaleDownCooldown) {
            await this.scaleDown();
            this.lastScaleAction = now;
        }
    }
    
    shouldScaleUp(metrics) {
        const thresholds = this.config.scaleUpThreshold;
        
        return (
            metrics.cpu > thresholds.cpu ||
            metrics.memory > thresholds.memory ||
            metrics.connections > thresholds.connections ||
            metrics.responseTime > thresholds.responseTime
        ) && this.instances.length < this.config.maxInstances;
    }
    
    shouldScaleDown(metrics) {
        const thresholds = this.config.scaleDownThreshold;
        
        // Need sustained low usage for scale down
        const recentMetrics = this.metrics.slice(-5); // Last 5 minutes
        const sustainedLowUsage = recentMetrics.every(m => 
            m.cpu < thresholds.cpu &&
            m.memory < thresholds.memory &&
            m.connections < thresholds.connections &&
            m.responseTime < thresholds.responseTime
        );
        
        return sustainedLowUsage && this.instances.length > this.config.minInstances;
    }
    
    async scaleUp() {
        logger.info('Scaling up - adding new instance');
        
        try {
            const newPort = await this.findAvailablePort();
            const instance = await this.startNewInstance(newPort);
            
            this.instances.push(instance);
            
            // Add to load balancer
            await this.addToLoadBalancer(instance);
            
            logger.info('Successfully scaled up', { 
                instanceCount: this.instances.length,
                newInstance: instance.id 
            });
            
        } catch (error) {
            logger.error('Scale up failed', { error: error.message });
        }
    }
    
    async scaleDown() {
        logger.info('Scaling down - removing instance');
        
        try {
            // Find instance with least connections
            const instanceToRemove = this.instances.reduce((min, instance) => 
                instance.connections < min.connections ? instance : min
            );
            
            // Remove from load balancer first
            await this.removeFromLoadBalancer(instanceToRemove);
            
            // Gracefully shutdown instance
            await this.shutdownInstance(instanceToRemove);
            
            // Remove from instances array
            this.instances = this.instances.filter(i => i.id !== instanceToRemove.id);
            
            logger.info('Successfully scaled down', { 
                instanceCount: this.instances.length,
                removedInstance: instanceToRemove.id 
            });
            
        } catch (error) {
            logger.error('Scale down failed', { error: error.message });
        }
    }
    
    async collectMetrics() {
        // Collect metrics from all instances
        const instanceMetrics = await Promise.all(
            this.instances.map(instance => this.getInstanceMetrics(instance))
        );
        
        // Calculate aggregate metrics
        const totalConnections = instanceMetrics.reduce((sum, m) => sum + m.connections, 0);
        const avgCpu = instanceMetrics.reduce((sum, m) => sum + m.cpu, 0) / instanceMetrics.length;
        const avgMemory = instanceMetrics.reduce((sum, m) => sum + m.memory, 0) / instanceMetrics.length;
        const avgResponseTime = instanceMetrics.reduce((sum, m) => sum + m.responseTime, 0) / instanceMetrics.length;
        
        return {
            cpu: avgCpu,
            memory: avgMemory,
            connections: totalConnections,
            responseTime: avgResponseTime,
            instances: instanceMetrics.length,
            timestamp: new Date().toISOString()
        };
    }
    
    async getInstanceMetrics(instance) {
        try {
            const response = await fetch(`http://${instance.host}:${instance.port}/api/metrics`);
            const metrics = await response.json();
            
            return {
                instanceId: instance.id,
                cpu: metrics.system.cpu,
                memory: metrics.system.memory,
                connections: metrics.websockets.active,
                responseTime: metrics.requests.averageResponseTime
            };
        } catch (error) {
            logger.warn('Failed to get instance metrics', { 
                instanceId: instance.id, 
                error: error.message 
            });
            
            return {
                instanceId: instance.id,
                cpu: 0,
                memory: 0,
                connections: 0,
                responseTime: 0
            };
        }
    }
}
```

## Scaling Best Practices

### 1. Monitoring & Alerts for Scaling

```javascript
// Scaling-specific monitoring
const scalingMonitor = {
    thresholds: {
        warningCpu: 60,
        criticalCpu: 80,
        warningMemory: 70,
        criticalMemory: 90,
        maxResponseTime: 3000,
        maxConnections: 5000
    },
    
    checkThresholds(metrics) {
        const alerts = [];
        
        if (metrics.cpu > this.thresholds.criticalCpu) {
            alerts.push({
                severity: 'critical',
                metric: 'cpu',
                value: metrics.cpu,
                message: 'Critical CPU usage - immediate scaling required'
            });
        }
        
        if (metrics.memory > this.thresholds.criticalMemory) {
            alerts.push({
                severity: 'critical',
                metric: 'memory',
                value: metrics.memory,
                message: 'Critical memory usage - immediate scaling required'
            });
        }
        
        if (metrics.responseTime > this.thresholds.maxResponseTime) {
            alerts.push({
                severity: 'warning',
                metric: 'responseTime',
                value: metrics.responseTime,
                message: 'High response time detected'
            });
        }
        
        return alerts;
    }
};
```

### 2. Scaling Configuration

```yaml
# docker-compose.yml for auto-scaling setup
version: '3.8'
services:
  beast-server:
    image: beast-server:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 30s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - REDIS_ENABLED=true
      - CLUSTER_MODE=true
    networks:
      - beast-network

  redis:
    image: redis:alpine
    deploy:
      replicas: 1
    networks:
      - beast-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 1
    depends_on:
      - beast-server
    networks:
      - beast-network

networks:
  beast-network:
    driver: overlay
```

---

**Infinite Growth** - The Beast's enterprise-scale architecture ready for thousands of devices! ⚡
