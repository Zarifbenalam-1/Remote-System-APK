const redis = require('redis');
const Bull = require('bull');
const config = require('../config/config');
const logger = require('../utils/logger');

class QueueService {
  constructor() {
    this.redisClient = null;
    this.commandQueue = null;
    this.fileQueue = null;
    this.connected = false;
    this.enabled = config.redis.enabled;
  }

  async initialize() {
    if (!this.enabled) {
      logger.info('Redis/Queue service disabled - running in memory mode');
      this.connected = false;
      return true;
    }

    try {
      // Initialize Redis client
      this.redisClient = redis.createClient({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
        retryDelayOnFailover: config.redis.retryDelayOnFailover,
        maxRetriesPerRequest: config.redis.maxRetriesPerRequest
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.connected = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        this.connected = true;
      });

      await this.redisClient.connect();

      // Initialize Bull queues
      this.commandQueue = new Bull('command processing', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password
        }
      });

      this.fileQueue = new Bull('file processing', {
        redis: {
          host: config.redis.host,
          port: config.redis.port,
          password: config.redis.password
        }
      });

      // Setup queue processors
      this.setupQueueProcessors();

      logger.info('Queue service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue service', { error: error.message });
      this.connected = false;
    }
  }

  setupQueueProcessors() {
    // Command queue processor
    this.commandQueue.process('device_command', async (job) => {
      const { deviceId, command, clientSocketId } = job.data;
      
      try {
        logger.info('Processing command from queue', { 
          deviceId, 
          command: command.action,
          jobId: job.id 
        });

        // Command processing logic would go here
        // For now, we'll just log and return success
        return { success: true, processed: true };
      } catch (error) {
        logger.error('Command processing failed', { 
          error: error.message, 
          jobId: job.id 
        });
        throw error;
      }
    });

    // File queue processor
    this.fileQueue.process('file_upload', async (job) => {
      const { filename, originalName, size } = job.data;
      
      try {
        logger.info('Processing file upload from queue', { 
          filename, 
          originalName, 
          size,
          jobId: job.id 
        });

        // File processing logic (virus scan, compression, etc.)
        return { success: true, processed: true };
      } catch (error) {
        logger.error('File processing failed', { 
          error: error.message, 
          jobId: job.id 
        });
        throw error;
      }
    });

    // Queue event handlers
    this.commandQueue.on('completed', (job) => {
      logger.info('Command job completed', { jobId: job.id });
    });

    this.commandQueue.on('failed', (job, err) => {
      logger.error('Command job failed', { jobId: job.id, error: err.message });
    });

    this.fileQueue.on('completed', (job) => {
      logger.info('File job completed', { jobId: job.id });
    });

    this.fileQueue.on('failed', (job, err) => {
      logger.error('File job failed', { jobId: job.id, error: err.message });
    });
  }

  // Add command to queue
  async queueCommand(deviceId, command, clientSocketId, options = {}) {
    if (!this.enabled || !this.connected) {
      logger.warn('Queue service not connected, processing command directly');
      return false;
    }

    try {
      const job = await this.commandQueue.add('device_command', {
        deviceId,
        command,
        clientSocketId,
        timestamp: new Date().toISOString()
      }, {
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });

      logger.info('Command queued successfully', { 
        deviceId, 
        command: command.action, 
        jobId: job.id 
      });

      return job.id;
    } catch (error) {
      logger.error('Failed to queue command', { error: error.message });
      return false;
    }
  }

  // Add file processing to queue
  async queueFileProcessing(fileData, options = {}) {
    if (!this.enabled || !this.connected) {
      logger.warn('Queue service not connected, skipping file processing');
      return false;
    }

    try {
      const job = await this.fileQueue.add('file_upload', fileData, {
        delay: options.delay || 0,
        attempts: options.attempts || 2
      });

      logger.info('File processing queued', { 
        filename: fileData.filename, 
        jobId: job.id 
      });

      return job.id;
    } catch (error) {
      logger.error('Failed to queue file processing', { error: error.message });
      return false;
    }
  }

  // Get queue statistics
  async getQueueStats() {
    if (!this.enabled || !this.connected) {
      return {
        connected: false,
        enabled: this.enabled,
        queues: {
          commands: { waiting: 0, active: 0, completed: 0, failed: 0 },
          files: { waiting: 0, active: 0, completed: 0, failed: 0 }
        }
      };
    }

    try {
      const commandStats = await this.commandQueue.getJobCounts();
      const fileStats = await this.fileQueue.getJobCounts();

      return {
        connected: this.connected,
        enabled: this.enabled,
        queues: {
          commands: commandStats,
          files: fileStats
        }
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { error: error.message });
      return null;
    }
  }

  // Cache device data
  async cacheDeviceData(deviceId, data, ttl = 3600) {
    if (!this.enabled || !this.connected) return false;

    try {
      await this.redisClient.setEx(`device:${deviceId}`, ttl, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('Failed to cache device data', { error: error.message });
      return false;
    }
  }

  // Get cached device data
  async getCachedDeviceData(deviceId) {
    if (!this.enabled || !this.connected) return null;

    try {
      const data = await this.redisClient.get(`device:${deviceId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Failed to get cached device data', { error: error.message });
      return null;
    }
  }

  // Cleanup
  async cleanup() {
    try {
      if (this.commandQueue) await this.commandQueue.close();
      if (this.fileQueue) await this.fileQueue.close();
      if (this.redisClient) await this.redisClient.disconnect();
      
      logger.info('Queue service cleaned up successfully');
    } catch (error) {
      logger.error('Error during queue service cleanup', { error: error.message });
    }
  }

  // Check if Redis is connected
  isRedisConnected() {
    return this.enabled && this.connected && this.redisClient && this.redisClient.isReady;
  }

  // Connect method (alias for initialize)
  async connect() {
    return await this.initialize();
  }

  // Disconnect method (alias for cleanup)
  async disconnect() {
    return await this.cleanup();
  }
}

module.exports = new QueueService();
