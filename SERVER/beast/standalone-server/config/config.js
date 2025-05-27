require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
    cluster: process.env.CLUSTER_MODE === 'true'
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    deviceTokens: process.env.DEVICE_TOKENS ? process.env.DEVICE_TOKENS.split(',') : [
      'dev-token-android-123',
      'dev-token-android-456',
      'dev-token-android-789'
    ],
    clientTokens: process.env.CLIENT_TOKENS ? process.env.CLIENT_TOKENS.split(',') : [
      'client-token-windows-abc',
      'client-token-windows-def'
    ]
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  redis: {
    enabled: process.env.ENABLE_REDIS !== 'false',
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },

  fileUpload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  monitoring: {
    metricsPort: process.env.METRICS_PORT || 9090,
    healthCheckInterval: 30000, // 30 seconds
    connectionTimeout: 60000 // 1 minute
  },

  maxDevices: process.env.MAX_DEVICES || 1000,
  
  auth: {
    deviceTokenExpiry: process.env.DEVICE_TOKEN_EXPIRY || '7d',
    clientTokenExpiry: process.env.CLIENT_TOKEN_EXPIRY || '30d',
    jwtExpiry: process.env.JWT_EXPIRY || '24h'
  },

  features: {
    authentication: true,
    rateLimit: true,
    monitoring: true,
    circuitBreaker: true,
    messageQueue: true,
    fileUpload: true,
    clustering: process.env.ENABLE_CLUSTER === 'true',
    cdn: process.env.CDN_ENABLED === 'true',
    autoScaling: process.env.AUTO_SCALING === 'true'
  },

  circuitBreaker: {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxSize: '20m',
    maxFiles: '14d'
  }
};
