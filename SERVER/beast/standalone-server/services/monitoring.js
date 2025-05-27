const promClient = require('prom-client');
const logger = require('../utils/logger');

class MonitoringService {
  constructor() {
    this.register = new promClient.Registry();
    this.setupDefaultMetrics();
    this.setupCustomMetrics();
  }

  setupDefaultMetrics() {
    // Collect default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'rds_' // Remote Device Server prefix
    });
  }

  setupCustomMetrics() {
    // Connected devices counter
    this.connectedDevicesGauge = new promClient.Gauge({
      name: 'rds_connected_devices_total',
      help: 'Total number of connected Android devices',
      registers: [this.register]
    });

    // Connected clients counter
    this.connectedClientsGauge = new promClient.Gauge({
      name: 'rds_connected_clients_total',
      help: 'Total number of connected Windows clients',
      registers: [this.register]
    });

    // Commands processed counter
    this.commandsCounter = new promClient.Counter({
      name: 'rds_commands_processed_total',
      help: 'Total number of commands processed',
      labelNames: ['command_type', 'status'],
      registers: [this.register]
    });

    // Command processing time histogram
    this.commandDurationHistogram = new promClient.Histogram({
      name: 'rds_command_duration_seconds',
      help: 'Command processing duration in seconds',
      labelNames: ['command_type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
      registers: [this.register]
    });

    // File uploads counter
    this.fileUploadsCounter = new promClient.Counter({
      name: 'rds_file_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['status'],
      registers: [this.register]
    });

    // File upload size histogram
    this.fileUploadSizeHistogram = new promClient.Histogram({
      name: 'rds_file_upload_size_bytes',
      help: 'File upload size in bytes',
      buckets: [1024, 10240, 102400, 1048576, 10485760, 52428800], // 1KB to 50MB
      registers: [this.register]
    });

    // WebSocket connections counter
    this.websocketConnectionsGauge = new promClient.Gauge({
      name: 'rds_websocket_connections_total',
      help: 'Total number of active WebSocket connections',
      registers: [this.register]
    });

    // Error counter
    this.errorsCounter = new promClient.Counter({
      name: 'rds_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'source'],
      registers: [this.register]
    });

    // Queue depth gauge (if Redis is available)
    this.queueDepthGauge = new promClient.Gauge({
      name: 'rds_queue_depth_total',
      help: 'Number of jobs in queue',
      labelNames: ['queue_name'],
      registers: [this.register]
    });

    // Response time gauge
    this.responseTimeGauge = new promClient.Gauge({
      name: 'rds_response_time_ms',
      help: 'Average response time in milliseconds',
      labelNames: ['endpoint'],
      registers: [this.register]
    });
  }

  // Update connected devices count
  updateConnectedDevices(count) {
    this.connectedDevicesGauge.set(count);
  }

  // Update connected clients count
  updateConnectedClients(count) {
    this.connectedClientsGauge.set(count);
  }

  // Record command processing
  recordCommand(commandType, status, duration = null) {
    this.commandsCounter.inc({ command_type: commandType, status });
    
    if (duration !== null) {
      this.commandDurationHistogram.observe({ command_type: commandType }, duration);
    }
  }

  // Record file upload
  recordFileUpload(status, size = null) {
    this.fileUploadsCounter.inc({ status });
    
    if (size !== null) {
      this.fileUploadSizeHistogram.observe(size);
    }
  }

  // Update WebSocket connections
  updateWebSocketConnections(count) {
    this.websocketConnectionsGauge.set(count);
  }

  // Record error
  recordError(type, source) {
    this.errorsCounter.inc({ type, source });
  }

  // Update queue depth
  updateQueueDepth(queueName, depth) {
    this.queueDepthGauge.set({ queue_name: queueName }, depth);
  }

  // Update response time
  updateResponseTime(endpoint, timeMs) {
    this.responseTimeGauge.set({ endpoint }, timeMs);
  }

  // Start a timer for duration measurement
  startTimer(histogramName, labels = {}) {
    switch (histogramName) {
      case 'command_duration':
        return this.commandDurationHistogram.startTimer(labels);
      default:
        logger.warn('Unknown histogram for timer', { histogramName });
        return () => {}; // Return dummy function
    }
  }

  // Get metrics in Prometheus format
  async getMetrics() {
    try {
      return await this.register.metrics();
    } catch (error) {
      logger.error('Failed to get metrics', { error: error.message });
      return '';
    }
  }

  // Get metrics as JSON
  async getMetricsJSON() {
    try {
      const metrics = await this.register.getMetricsAsJSON();
      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics JSON', { error: error.message });
      return [];
    }
  }

  // Health check
  getHealthStatus() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptime,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      load: process.cpuUsage(),
      pid: process.pid,
      version: process.version
    };
  }

  // Middleware to track HTTP request metrics
  trackHttpMetrics() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.updateResponseTime(req.route?.path || req.path, duration);
      });

      next();
    };
  }

  // Initialize method
  async initialize() {
    logger.info('Monitoring service initialized');
    return true;
  }

  // Get metrics for Prometheus scraping
  async getMetrics() {
    return this.register.metrics();
  }

  // Get average response time
  getAverageResponseTime() {
    // This would be calculated from collected metrics
    return Math.random() * 100; // Placeholder
  }

  // Get error rate
  getErrorRate() {
    // This would be calculated from error metrics
    return Math.random() * 0.1; // Placeholder (0-10% error rate)
  }

  // Get throughput (requests per second)
  getThroughput() {
    // This would be calculated from request metrics
    return Math.random() * 1000; // Placeholder
  }

  // Update WebSocket connections metric
  updateWebSocketConnections(count) {
    // Add a gauge for WebSocket connections if needed
    if (!this.webSocketConnectionsGauge) {
      this.webSocketConnectionsGauge = new promClient.Gauge({
        name: 'rds_websocket_connections_total',
        help: 'Total number of WebSocket connections',
        registers: [this.register]
      });
    }
    this.webSocketConnectionsGauge.set(count);
  }
}

module.exports = new MonitoringService();
