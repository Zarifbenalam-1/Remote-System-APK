# ⚡ Performance Tuning Guide

Comprehensive guide for optimizing the BEAST Remote Device Management Server performance.

## 📋 Table of Contents
- [Performance Overview](#performance-overview)
- [Node.js Optimization](#nodejs-optimization)
- [Memory Management](#memory-management)
- [CPU Optimization](#cpu-optimization)
- [Database Performance](#database-performance)
- [Network Optimization](#network-optimization)
- [Caching Strategies](#caching-strategies)
- [Load Balancing](#load-balancing)
- [Monitoring Performance](#monitoring-performance)
- [Production Optimizations](#production-optimizations)

## 📊 Performance Overview

### Performance Metrics to Track
- **Response Time**: API endpoints < 200ms
- **Throughput**: > 1000 requests/second
- **Memory Usage**: < 80% of available RAM
- **CPU Usage**: < 70% average load
- **WebSocket Connections**: > 1000 concurrent
- **Error Rate**: < 0.1%

### Performance Targets
```javascript
// Performance benchmarks
const PERFORMANCE_TARGETS = {
  api: {
    responseTime: 200,      // milliseconds
    throughput: 1000,       // requests/second
    errorRate: 0.001        // 0.1%
  },
  websocket: {
    connectionTime: 100,    // milliseconds
    maxConnections: 1000,   // concurrent
    messageLatency: 50      // milliseconds
  },
  system: {
    memoryUsage: 0.8,       // 80% of available
    cpuUsage: 0.7,          // 70% average
    diskIO: 1000            // MB/s
  }
};
```

## 🚀 Node.js Optimization

### Event Loop Optimization

#### Avoid Blocking Operations
```javascript
// ❌ Bad: Blocking operation
const fs = require('fs');
const data = fs.readFileSync('large-file.txt'); // Blocks event loop

// ✅ Good: Non-blocking operation
const fs = require('fs').promises;
const data = await fs.readFile('large-file.txt');

// ✅ Better: Stream for large files
const fs = require('fs');
const stream = fs.createReadStream('large-file.txt');
```

#### Optimize Asynchronous Operations
```javascript
// ❌ Bad: Sequential async operations
async function processDevices(devices) {
  const results = [];
  for (const device of devices) {
    const result = await processDevice(device);
    results.push(result);
  }
  return results;
}

// ✅ Good: Parallel async operations
async function processDevices(devices) {
  const promises = devices.map(device => processDevice(device));
  return Promise.all(promises);
}

// ✅ Better: Controlled concurrency
async function processDevices(devices, concurrency = 10) {
  const results = [];
  for (let i = 0; i < devices.length; i += concurrency) {
    const batch = devices.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(device => processDevice(device))
    );
    results.push(...batchResults);
  }
  return results;
}
```

### V8 Engine Optimization

#### Memory Settings
```bash
# Increase heap size for large applications
node --max-old-space-size=4096 server.js

# Optimize garbage collection
node --expose-gc --optimize-for-size server.js

# Enable performance profiling
node --prof server.js
node --prof-process isolate-*.log > performance-report.txt
```

#### Code Optimization
```javascript
// Use Map for better performance with dynamic keys
const deviceCache = new Map();

// Prefer const and let over var
const CONFIG = Object.freeze({
  MAX_CONNECTIONS: 1000,
  TIMEOUT: 30000
});

// Use object destructuring efficiently
const { deviceId, status, lastSeen } = deviceData;

// Optimize loops
// ❌ Slow: for...in
for (const key in object) {
  // Process
}

// ✅ Fast: Object.keys()
for (const key of Object.keys(object)) {
  // Process
}

// ✅ Fastest: for loop for arrays
for (let i = 0; i < array.length; i++) {
  // Process array[i]
}
```

## 💾 Memory Management

### Memory Leak Prevention

#### Proper Event Listener Management
```javascript
// ❌ Bad: Memory leak
const eventEmitter = new EventEmitter();
setInterval(() => {
  eventEmitter.on('data', handleData); // Accumulates listeners
}, 1000);

// ✅ Good: Clean up listeners
const eventEmitter = new EventEmitter();
const handler = handleData;
eventEmitter.on('data', handler);

// Clean up when done
eventEmitter.removeListener('data', handler);
```

#### WeakMap for Object References
```javascript
// Use WeakMap for temporary object associations
const deviceSessions = new WeakMap();

function associateSession(device, session) {
  deviceSessions.set(device, session);
}

// Objects can be garbage collected when no other references exist
```

#### Memory Monitoring
```javascript
// Memory usage monitoring
function monitorMemory() {
  const usage = process.memoryUsage();
  const stats = {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    timestamp: Date.now()
  };
  
  // Alert if memory usage is high
  if (stats.heapUsed > 1000) { // 1GB
    console.warn('High memory usage detected:', stats);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  return stats;
}

// Monitor every 30 seconds
setInterval(monitorMemory, 30000);
```

### Buffer Optimization

#### Efficient Buffer Usage
```javascript
// ❌ Bad: String concatenation for large data
let data = '';
for (let i = 0; i < 1000000; i++) {
  data += 'some data';
}

// ✅ Good: Use Buffer or Array
const chunks = [];
for (let i = 0; i < 1000000; i++) {
  chunks.push('some data');
}
const data = chunks.join('');

// ✅ Better: Pre-allocate Buffer
const buffer = Buffer.allocUnsafe(expectedSize);
let offset = 0;
// Write to buffer at offset positions
```

## ⚙️ CPU Optimization

### Clustering for Multi-Core Usage

#### Basic Clustering
```javascript
// cluster.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart worker
  });
} else {
  // Workers can share any TCP port
  require('./server.js');
  console.log(`Worker ${process.pid} started`);
}
```

#### Advanced Clustering with PM2
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'beast-server',
    script: 'server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-err.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

### CPU-Intensive Task Optimization

#### Worker Threads for Heavy Computation
```javascript
// worker.js
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  // Main thread
  function runCPUIntensiveTask(data) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: data
      });
      
      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
  
  module.exports = { runCPUIntensiveTask };
} else {
  // Worker thread
  function heavyComputation(data) {
    // CPU-intensive work here
    let result = 0;
    for (let i = 0; i < data.iterations; i++) {
      result += Math.sqrt(i);
    }
    return result;
  }
  
  const result = heavyComputation(workerData);
  parentPort.postMessage(result);
}
```

#### Job Queue for Background Processing
```javascript
// jobQueue.js
const Queue = require('bull');
const redisConfig = require('./config/redis');

const processQueue = new Queue('device processing', redisConfig);

// Define job processor
processQueue.process('device-analysis', async (job) => {
  const { deviceId, data } = job.data;
  
  // CPU-intensive analysis
  const analysis = await performDeviceAnalysis(data);
  
  // Update progress
  job.progress(50);
  
  // Store results
  await storeAnalysisResults(deviceId, analysis);
  
  job.progress(100);
  return analysis;
});

// Add job to queue
async function queueDeviceAnalysis(deviceId, data) {
  const job = await processQueue.add('device-analysis', {
    deviceId,
    data
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  });
  
  return job.id;
}

module.exports = { queueDeviceAnalysis };
```

## 🗄️ Database Performance

### Redis Optimization

#### Connection Pooling
```javascript
// redisPool.js
const Redis = require('ioredis');

class RedisPool {
  constructor(config) {
    this.config = config;
    this.pools = {
      read: new Redis.Cluster(config.nodes, {
        enableReadyCheck: false,
        redisOptions: {
          password: config.password,
          maxRetriesPerRequest: 3
        }
      }),
      write: new Redis.Cluster(config.nodes, {
        enableReadyCheck: false,
        redisOptions: {
          password: config.password,
          maxRetriesPerRequest: 3
        }
      })
    };
  }

  async get(key) {
    return this.pools.read.get(key);
  }

  async set(key, value, ttl) {
    if (ttl) {
      return this.pools.write.setex(key, ttl, value);
    }
    return this.pools.write.set(key, value);
  }

  async del(key) {
    return this.pools.write.del(key);
  }
}

module.exports = RedisPool;
```

#### Redis Pipeline Optimization
```javascript
// Batch operations with pipeline
async function batchUpdateDevices(devices) {
  const pipeline = redis.pipeline();
  
  devices.forEach(device => {
    pipeline.hset(`device:${device.id}`, device);
    pipeline.expire(`device:${device.id}`, 3600);
  });
  
  return pipeline.exec();
}

// Use multi for transactions
async function atomicUpdate(deviceId, updates) {
  const multi = redis.multi();
  
  multi.hgetall(`device:${deviceId}`);
  multi.hmset(`device:${deviceId}`, updates);
  multi.expire(`device:${deviceId}`, 3600);
  
  return multi.exec();
}
```

#### Data Structure Optimization
```javascript
// Use appropriate Redis data structures
class DeviceManager {
  async addDevice(device) {
    // Hash for device data
    await redis.hset(`device:${device.id}`, device);
    
    // Set for device lists
    await redis.sadd('devices:online', device.id);
    
    // Sorted set for rankings
    await redis.zadd('devices:by_performance', device.performance, device.id);
    
    // List for recent events
    await redis.lpush(`device:${device.id}:events`, JSON.stringify({
      type: 'connected',
      timestamp: Date.now()
    }));
    await redis.ltrim(`device:${device.id}:events`, 0, 99); // Keep last 100
  }
}
```

## 🌐 Network Optimization

### HTTP/2 Implementation
```javascript
// http2Server.js
const http2 = require('http2');
const fs = require('fs');

const server = http2.createSecureServer({
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
});

server.on('stream', (stream, headers) => {
  // HTTP/2 server push
  stream.pushStream({ ':path': '/styles.css' }, (err, pushStream) => {
    if (!err) {
      pushStream.respondWithFile('public/styles.css');
    }
  });
  
  stream.respond({
    'content-type': 'text/html',
    ':status': 200
  });
  
  stream.end('<html><body><h1>Hello HTTP/2</h1></body></html>');
});
```

### Connection Keep-Alive
```javascript
// Enable keep-alive for HTTP connections
const http = require('http');

const server = http.createServer();
server.keepAliveTimeout = 65000; // 65 seconds
server.headersTimeout = 66000;   // 66 seconds

// Agent configuration for outgoing requests
const agent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 100,
  maxFreeSockets: 10
});
```

### WebSocket Optimization
```javascript
// Optimize WebSocket connections
const io = require('socket.io')(server, {
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket'],
  compression: true,
  httpCompression: {
    threshold: 1024,
    chunkSize: 1024
  }
});

// Connection pooling
const connectionPool = new Map();

io.on('connection', (socket) => {
  // Optimize event handling
  socket.on('device_data', (data) => {
    // Batch process multiple data points
    if (!socket.dataBatch) {
      socket.dataBatch = [];
      process.nextTick(() => {
        processBatchData(socket.dataBatch);
        socket.dataBatch = [];
      });
    }
    socket.dataBatch.push(data);
  });
});
```

## 🚄 Caching Strategies

### Multi-Level Caching

#### In-Memory Cache
```javascript
// memoryCache.js
class MemoryCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = { hits: 0, misses: 0 };
  }

  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      const item = this.cache.get(key);
      
      // Move to end (LRU)
      this.cache.delete(key);
      this.cache.set(key, item);
      
      return item.value;
    }
    
    this.stats.misses++;
    return null;
  }

  set(key, value, ttl = 300000) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const item = {
      value,
      expires: Date.now() + ttl
    };

    this.cache.set(key, item);

    // Set cleanup timer
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
      ...this.stats
    };
  }
}

module.exports = MemoryCache;
```

#### Cache Warming
```javascript
// cacheWarmer.js
class CacheWarmer {
  constructor(cache, dataSource) {
    this.cache = cache;
    this.dataSource = dataSource;
  }

  async warmCache() {
    console.log('Starting cache warming...');
    
    // Pre-load frequently accessed data
    const criticalDevices = await this.dataSource.getCriticalDevices();
    
    for (const device of criticalDevices) {
      await this.cache.set(`device:${device.id}`, device);
    }

    // Pre-load configuration data
    const config = await this.dataSource.getConfiguration();
    await this.cache.set('system:config', config);

    console.log(`Cache warmed with ${criticalDevices.length} devices`);
  }

  startPeriodicWarming(interval = 3600000) { // 1 hour
    setInterval(() => {
      this.warmCache();
    }, interval);
  }
}
```

### Smart Caching Strategies
```javascript
// smartCache.js
class SmartCache {
  constructor() {
    this.l1 = new MemoryCache(100);    // Fast, small
    this.l2 = new RedisCache();        // Medium, larger
    this.analytics = new Map();        // Track access patterns
  }

  async get(key) {
    // Track access
    this.trackAccess(key);

    // L1 cache (memory)
    let value = this.l1.get(key);
    if (value) return value;

    // L2 cache (Redis)
    value = await this.l2.get(key);
    if (value) {
      // Promote to L1 if frequently accessed
      if (this.isHotData(key)) {
        this.l1.set(key, value);
      }
      return value;
    }

    return null;
  }

  async set(key, value, ttl) {
    // Determine cache level based on data characteristics
    if (this.isCriticalData(key)) {
      this.l1.set(key, value, ttl);
    }
    
    await this.l2.set(key, value, ttl);
  }

  trackAccess(key) {
    const now = Date.now();
    if (!this.analytics.has(key)) {
      this.analytics.set(key, { count: 0, lastAccess: now });
    }
    
    const stats = this.analytics.get(key);
    stats.count++;
    stats.lastAccess = now;
  }

  isHotData(key) {
    const stats = this.analytics.get(key);
    return stats && stats.count > 10; // Accessed more than 10 times
  }
}
```

## ⚖️ Load Balancing

### Application-Level Load Balancing
```javascript
// loadBalancer.js
class LoadBalancer {
  constructor(servers) {
    this.servers = servers;
    this.currentIndex = 0;
    this.healthChecks = new Map();
    this.startHealthChecks();
  }

  // Round-robin algorithm
  getNextServer() {
    const availableServers = this.getHealthyServers();
    if (availableServers.length === 0) {
      throw new Error('No healthy servers available');
    }

    const server = availableServers[this.currentIndex % availableServers.length];
    this.currentIndex++;
    return server;
  }

  // Weighted round-robin
  getWeightedServer() {
    const healthyServers = this.getHealthyServers();
    let totalWeight = healthyServers.reduce((sum, server) => sum + server.weight, 0);
    let random = Math.random() * totalWeight;

    for (const server of healthyServers) {
      random -= server.weight;
      if (random <= 0) {
        return server;
      }
    }

    return healthyServers[0];
  }

  getHealthyServers() {
    return this.servers.filter(server => 
      this.healthChecks.get(server.id) !== false
    );
  }

  async startHealthChecks() {
    setInterval(async () => {
      for (const server of this.servers) {
        try {
          const response = await fetch(`${server.url}/health`, {
            timeout: 5000
          });
          this.healthChecks.set(server.id, response.ok);
        } catch (error) {
          this.healthChecks.set(server.id, false);
        }
      }
    }, 30000); // Check every 30 seconds
  }
}
```

### Session Affinity
```javascript
// sessionAffinity.js
class SessionAffinity {
  constructor(loadBalancer) {
    this.loadBalancer = loadBalancer;
    this.sessionMap = new Map(); // sessionId -> serverId
  }

  getServer(sessionId) {
    // Check for existing session
    if (this.sessionMap.has(sessionId)) {
      const serverId = this.sessionMap.get(sessionId);
      const server = this.loadBalancer.getServerById(serverId);
      
      // Verify server is still healthy
      if (server && this.loadBalancer.isHealthy(serverId)) {
        return server;
      } else {
        // Remove stale session
        this.sessionMap.delete(sessionId);
      }
    }

    // Get new server and create session mapping
    const server = this.loadBalancer.getNextServer();
    this.sessionMap.set(sessionId, server.id);
    
    return server;
  }

  removeSession(sessionId) {
    this.sessionMap.delete(sessionId);
  }
}
```

## 📈 Monitoring Performance

### Real-time Performance Metrics
```javascript
// performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: { total: 0, errors: 0 },
      responseTimes: [],
      activeConnections: 0,
      memoryUsage: [],
      cpuUsage: []
    };
    
    this.startMonitoring();
  }

  recordRequest(responseTime, success = true) {
    this.metrics.requests.total++;
    if (!success) this.metrics.requests.errors++;
    
    this.metrics.responseTimes.push(responseTime);
    
    // Keep only last 1000 response times
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }
  }

  getPerformanceStats() {
    const responseTimes = this.metrics.responseTimes;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    
    return {
      requests: {
        total: this.metrics.requests.total,
        errors: this.metrics.requests.errors,
        errorRate: this.metrics.requests.errors / this.metrics.requests.total,
        rps: this.calculateRPS()
      },
      responseTimes: {
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      },
      system: {
        activeConnections: this.metrics.activeConnections,
        memoryUsage: this.getCurrentMemoryUsage(),
        cpuUsage: this.getCurrentCPUUsage()
      }
    };
  }

  startMonitoring() {
    // Monitor system resources every 10 seconds
    setInterval(() => {
      this.recordSystemMetrics();
    }, 10000);
  }

  recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss
    });

    // Keep only last hour of metrics
    const oneHourAgo = Date.now() - 3600000;
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(
      m => m.timestamp > oneHourAgo
    );
  }
}
```

### Performance Alerts
```javascript
// performanceAlerts.js
class PerformanceAlerts {
  constructor(monitor, thresholds) {
    this.monitor = monitor;
    this.thresholds = thresholds;
    this.alertHistory = new Map();
    this.startAlertChecking();
  }

  startAlertChecking() {
    setInterval(() => {
      this.checkAlerts();
    }, 30000); // Check every 30 seconds
  }

  checkAlerts() {
    const stats = this.monitor.getPerformanceStats();

    // Check response time
    if (stats.responseTimes.p95 > this.thresholds.responseTime) {
      this.triggerAlert('HIGH_RESPONSE_TIME', {
        current: stats.responseTimes.p95,
        threshold: this.thresholds.responseTime
      });
    }

    // Check error rate
    if (stats.requests.errorRate > this.thresholds.errorRate) {
      this.triggerAlert('HIGH_ERROR_RATE', {
        current: stats.requests.errorRate,
        threshold: this.thresholds.errorRate
      });
    }

    // Check memory usage
    const memoryUsage = stats.system.memoryUsage.percentage;
    if (memoryUsage > this.thresholds.memoryUsage) {
      this.triggerAlert('HIGH_MEMORY_USAGE', {
        current: memoryUsage,
        threshold: this.thresholds.memoryUsage
      });
    }
  }

  triggerAlert(type, data) {
    const now = Date.now();
    const lastAlert = this.alertHistory.get(type);

    // Avoid alert spam (minimum 5 minutes between same alerts)
    if (lastAlert && (now - lastAlert) < 300000) {
      return;
    }

    this.alertHistory.set(type, now);

    console.error(`PERFORMANCE ALERT: ${type}`, data);

    // Send notification (implement your notification system)
    this.sendNotification(type, data);
  }

  sendNotification(type, data) {
    // Implement notification logic (email, webhook, etc.)
    // Example webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: Date.now() })
      }).catch(console.error);
    }
  }
}
```

## 🏭 Production Optimizations

### Production Configuration
```javascript
// production.js
const productionOptimizations = {
  // Enable compression
  compression: {
    enabled: true,
    level: 6,
    threshold: 1024
  },

  // Optimize headers
  headers: {
    'Server': false, // Don't reveal server information
    'X-Powered-By': false,
    'Cache-Control': 'public, max-age=31536000', // 1 year for static assets
    'ETag': true
  },

  // Connection settings
  server: {
    keepAliveTimeout: 65000,
    headersTimeout: 66000,
    timeout: 120000
  },

  // Process settings
  process: {
    maxOldSpaceSize: 4096, // 4GB
    exposeGC: true,
    optimizeForSize: false
  }
};

module.exports = productionOptimizations;
```

### Auto-scaling Configuration
```javascript
// autoScaler.js
class AutoScaler {
  constructor(config) {
    this.config = config;
    this.instances = [];
    this.metrics = new Map();
    this.startMonitoring();
  }

  startMonitoring() {
    setInterval(() => {
      this.checkScalingConditions();
    }, 60000); // Check every minute
  }

  async checkScalingConditions() {
    const avgCpuUsage = await this.getAverageCPUUsage();
    const avgMemoryUsage = await this.getAverageMemoryUsage();
    const requestRate = await this.getRequestRate();

    // Scale up conditions
    if (
      avgCpuUsage > this.config.scaleUp.cpuThreshold ||
      avgMemoryUsage > this.config.scaleUp.memoryThreshold ||
      requestRate > this.config.scaleUp.requestThreshold
    ) {
      await this.scaleUp();
    }
    
    // Scale down conditions
    else if (
      avgCpuUsage < this.config.scaleDown.cpuThreshold &&
      avgMemoryUsage < this.config.scaleDown.memoryThreshold &&
      requestRate < this.config.scaleDown.requestThreshold &&
      this.instances.length > this.config.minInstances
    ) {
      await this.scaleDown();
    }
  }

  async scaleUp() {
    if (this.instances.length >= this.config.maxInstances) {
      console.log('Maximum instances reached, cannot scale up');
      return;
    }

    console.log('Scaling up...');
    const newInstance = await this.createInstance();
    this.instances.push(newInstance);
    
    // Wait for instance to be ready
    await this.waitForInstanceReady(newInstance);
    console.log(`Scaled up to ${this.instances.length} instances`);
  }

  async scaleDown() {
    if (this.instances.length <= this.config.minInstances) {
      return;
    }

    console.log('Scaling down...');
    const instanceToRemove = this.instances.pop();
    await this.terminateInstance(instanceToRemove);
    console.log(`Scaled down to ${this.instances.length} instances`);
  }
}
```

## 🎯 Performance Testing

### Load Testing Script
```javascript
// loadTest.js
const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    duration: 60, // 60 seconds
    pipelining: 1,
    requests: [
      {
        method: 'GET',
        path: '/health'
      },
      {
        method: 'GET',
        path: '/api/devices',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    ]
  });

  console.log('Load Test Results:');
  console.log(`Requests per second: ${result.requests.average}`);
  console.log(`Latency (avg): ${result.latency.average}ms`);
  console.log(`Latency (p99): ${result.latency.p99}ms`);
  console.log(`Throughput: ${result.throughput.average} bytes/sec`);
  console.log(`Errors: ${result.errors}`);

  return result;
}

module.exports = { runLoadTest };
```

### Benchmarking Suite
```javascript
// benchmark.js
const Benchmark = require('benchmark');

const suite = new Benchmark.Suite();

// Test different caching strategies
suite.add('Memory Cache', function() {
  memoryCache.get('test-key');
})
.add('Redis Cache', async function() {
  await redisCache.get('test-key');
})
.add('No Cache', async function() {
  await database.query('SELECT * FROM devices WHERE id = ?', ['test-id']);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });
```

---

## 📚 Related Documentation
- [System Architecture](04-SYSTEM_ARCHITECTURE.md)
- [Monitoring & Logging](08-MONITORING_LOGGING.md)
- [Scalability Features](09-SCALABILITY_FEATURES.md)
- [Configuration Guide](13-CONFIGURATION.md)

> **Next:** Explore API details in [API Reference](16-API_REFERENCE.md)
