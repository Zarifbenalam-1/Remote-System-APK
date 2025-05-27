require('dotenv').config();

const cluster = require('cluster');
const os = require('os');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import custom modules
const config = require('./config/config');
const logger = require('./utils/logger');
const authService = require('./services/auth');
const queueService = require('./services/queue');
const circuitBreakerService = require('./services/circuitBreaker');
const monitoringService = require('./services/monitoring');
const { 
  validateCommand, 
  validateFileUpload, 
  sanitizeObject 
} = require('./middleware/validation');

// Cluster configuration for load balancing
const numCPUs = process.env.CLUSTER_WORKERS ? parseInt(process.env.CLUSTER_WORKERS) : os.cpus().length;
const enableCluster = process.env.ENABLE_CLUSTER === 'true' && process.env.NODE_ENV === 'production';

if (enableCluster && cluster.isMaster) {
    logger.info(`Master process ${process.pid} starting ${numCPUs} workers`);
    
    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    
    // Handle worker exit
    cluster.on('exit', (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        logger.info('Starting a new worker');
        cluster.fork();
    });
    
    // Graceful shutdown for master
    process.on('SIGINT', () => {
        logger.info('Master received SIGINT, shutting down workers');
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        process.exit(0);
    });
    
} else {
    // Worker process or single process mode
    startServer();
}

function startServer() {

const app = express();
const server = http.createServer(app);

// Security and performance middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

app.use(compression());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Stricter rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 upload requests per windowMs
  skipSuccessfulRequests: false
});

// Configure CORS for Socket.IO with environment-based origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

const io = socketIo(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  req.requestId = requestId;
  
  logger.info('HTTP Request', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Response', {
      requestId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Monitoring middleware
app.use(monitoringService.trackHttpMetrics());

// Enhanced file upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const timestamp = Date.now();
        const uniqueName = `${timestamp}-${sanitizedName}`;
        cb(null, uniqueName);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    // Check file type
    const allowedTypes = config.fileUpload.allowedTypes;
    const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('*')) {
            return file.mimetype.startsWith(type.slice(0, -1));
        }
        return file.mimetype === type;
    });

    if (isAllowed) {
        cb(null, true);
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: config.fileUpload.maxFileSize,
        files: 5, // Maximum 5 files per upload
        fields: 10 // Maximum 10 fields
    },
    fileFilter: fileFilter
});

// Error handling for multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File too large',
                maxSize: '50MB'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Too many files or unexpected field name'
            });
        }
    }
    
    if (error.message.includes('File type')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }
    
    next(error);
});

class DeviceManager {
    constructor() {
        this.devices = new Map();
        this.clients = new Map();
        this.sessions = new Map();
        this.connectionHealth = new Map();
        this.retryAttempts = new Map();
        
        // Start health monitoring
        this.startHealthMonitoring();
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
            this.updateMetrics();
        }, config.monitoring.healthCheckInterval);
    }

    performHealthChecks() {
        const now = Date.now();
        
        // Check device connections
        for (const [deviceId, device] of this.devices.entries()) {
            const lastSeen = this.connectionHealth.get(deviceId) || now;
            const timeSinceLastSeen = now - lastSeen;
            
            if (timeSinceLastSeen > config.monitoring.connectionTimeout) {
                logger.warn('Device connection timeout detected', { 
                    deviceId, 
                    lastSeen: new Date(lastSeen).toISOString() 
                });
                
                // Attempt to ping the device
                io.to(device.socketId).emit('health_check', { timestamp: now });
            }
        }

        // Check client connections
        for (const [clientId, client] of this.clients.entries()) {
            const lastSeen = this.connectionHealth.get(clientId) || now;
            const timeSinceLastSeen = now - lastSeen;
            
            if (timeSinceLastSeen > config.monitoring.connectionTimeout) {
                logger.warn('Client connection timeout detected', { 
                    clientId, 
                    lastSeen: new Date(lastSeen).toISOString() 
                });
                
                io.to(client.socketId).emit('health_check', { timestamp: now });
            }
        }
    }

    updateMetrics() {
        monitoringService.updateConnectedDevices(this.devices.size);
        monitoringService.updateConnectedClients(this.clients.size);
        monitoringService.updateWebSocketConnections(this.devices.size + this.clients.size);
    }

    markConnectionHealthy(id) {
        this.connectionHealth.set(id, Date.now());
    }

    async addDevice(socketId, deviceInfo) {
        try {
            // Validate and sanitize device info
            const sanitizedInfo = sanitizeObject(deviceInfo);
            
            const device = {
                id: sanitizedInfo.deviceId || uuidv4(),
                socketId: socketId,
                name: sanitizedInfo.name || 'Unknown Device',
                model: sanitizedInfo.model || 'Unknown',
                androidVersion: sanitizedInfo.androidVersion || 'Unknown',
                ipAddress: sanitizedInfo.ipAddress || 'Unknown',
                connectedAt: new Date(),
                status: 'online',
                capabilities: sanitizedInfo.capabilities || [],
                lastHealthCheck: Date.now()
            };
            
            this.devices.set(device.id, device);
            this.markConnectionHealthy(device.id);
            
            // Cache device data in Redis if available
            await circuitBreakerService.execute(
                'redis',
                () => queueService.cacheDeviceData(device.id, device),
                () => logger.warn('Failed to cache device data, continuing without cache')
            );
            
            logger.info('Device connected successfully', { 
                deviceId: device.id, 
                deviceName: device.name,
                socketId: socketId
            });
            
            // Notify all Windows clients about new device
            this.broadcastToClients('device_connected', device);
            
            // Update metrics
            monitoringService.updateConnectedDevices(this.devices.size);
            
            return device;
        } catch (error) {
            logger.error('Failed to add device', { error: error.message, socketId });
            monitoringService.recordError('device_registration', 'device_manager');
            throw error;
        }
    }

    removeDevice(socketId) {
        try {
            for (const [deviceId, device] of this.devices.entries()) {
                if (device.socketId === socketId) {
                    this.devices.delete(deviceId);
                    this.connectionHealth.delete(deviceId);
                    this.retryAttempts.delete(deviceId);
                    
                    logger.info('Device disconnected', { 
                        deviceId, 
                        deviceName: device.name,
                        connectionDuration: Date.now() - device.connectedAt.getTime()
                    });
                    
                    // Notify all Windows clients
                    this.broadcastToClients('device_disconnected', { deviceId });
                    
                    // Update metrics
                    monitoringService.updateConnectedDevices(this.devices.size);
                    break;
                }
            }
        } catch (error) {
            logger.error('Error removing device', { error: error.message, socketId });
            monitoringService.recordError('device_removal', 'device_manager');
        }
    }

    async addClient(socketId, clientInfo) {
        try {
            const sanitizedInfo = sanitizeObject(clientInfo);
            
            const client = {
                id: uuidv4(),
                socketId: socketId,
                name: sanitizedInfo.name || 'Windows Client',
                type: sanitizedInfo.type || 'windows',
                connectedAt: new Date(),
                lastHealthCheck: Date.now()
            };
            
            this.clients.set(client.id, client);
            this.markConnectionHealthy(client.id);
            
            logger.info('Client connected successfully', { 
                clientId: client.id, 
                clientName: client.name,
                socketId: socketId
            });
            
            // Send current device list to new Windows client
            const deviceList = Array.from(this.devices.values());
            io.to(socketId).emit('device_list', deviceList);
            
            // Update metrics
            monitoringService.updateConnectedClients(this.clients.size);
            
            return client;
        } catch (error) {
            logger.error('Failed to add client', { error: error.message, socketId });
            monitoringService.recordError('client_registration', 'device_manager');
            throw error;
        }
    }

    removeClient(socketId) {
        try {
            for (const [clientId, client] of this.clients.entries()) {
                if (client.socketId === socketId) {
                    this.clients.delete(clientId);
                    this.connectionHealth.delete(clientId);
                    
                    logger.info('Client disconnected', { 
                        clientId, 
                        clientName: client.name,
                        connectionDuration: Date.now() - client.connectedAt.getTime()
                    });
                    
                    // Update metrics
                    monitoringService.updateConnectedClients(this.clients.size);
                    break;
                }
            }
        } catch (error) {
            logger.error('Error removing client', { error: error.message, socketId });
            monitoringService.recordError('client_removal', 'device_manager');
        }
    }

    getDeviceBySocketId(socketId) {
        for (const device of this.devices.values()) {
            if (device.socketId === socketId) {
                return device;
            }
        }
        return null;
    }

    getDeviceById(deviceId) {
        return this.devices.get(deviceId);
    }

    broadcastToClients(event, data) {
        try {
            for (const client of this.clients.values()) {
                io.to(client.socketId).emit(event, data);
            }
            
            logger.debug('Broadcast to clients', { event, clientCount: this.clients.size });
        } catch (error) {
            logger.error('Error broadcasting to clients', { error: error.message, event });
            monitoringService.recordError('broadcast', 'device_manager');
        }
    }

    async forwardCommandToDevice(deviceId, command, clientSocketId) {
        const startTime = Date.now();
        const timer = monitoringService.startTimer('command_duration', { 
            command_type: command.action || 'unknown' 
        });
        
        try {
            // Validate command
            const { error, value } = validateCommand({ deviceId, command });
            if (error) {
                logger.warn('Invalid command', { error: error.message, deviceId, command });
                monitoringService.recordCommand(command.action || 'unknown', 'validation_failed');
                return false;
            }

            const device = this.getDeviceById(deviceId);
            if (!device) {
                logger.warn('Device not found for command', { deviceId, command: command.action });
                monitoringService.recordCommand(command.action || 'unknown', 'device_not_found');
                return false;
            }

            const commandWithClientId = {
                ...sanitizeObject(command),
                clientSocketId: clientSocketId,
                timestamp: new Date().toISOString(),
                commandId: uuidv4()
            };

            // Try to queue the command first
            const queueResult = await circuitBreakerService.execute(
                'redis',
                () => queueService.queueCommand(deviceId, commandWithClientId, clientSocketId),
                () => null // Fallback to direct sending
            );

            if (!queueResult) {
                // Direct sending if queue is not available
                io.to(device.socketId).emit('device_command', commandWithClientId);
            }
            
            const duration = (Date.now() - startTime) / 1000;
            timer();
            
            logger.info('Command forwarded to device', { 
                deviceId, 
                deviceName: device.name,
                command: command.action,
                duration: `${duration}s`,
                queued: !!queueResult
            });
            
            monitoringService.recordCommand(command.action || 'unknown', 'sent', duration);
            return true;
            
        } catch (error) {
            timer();
            logger.error('Failed to forward command to device', { 
                error: error.message, 
                deviceId, 
                command: command.action 
            });
            monitoringService.recordCommand(command.action || 'unknown', 'failed');
            monitoringService.recordError('command_forwarding', 'device_manager');
            return false;
        }
    }

    forwardResponseToClient(clientSocketId, response) {
        try {
            const sanitizedResponse = sanitizeObject(response);
            io.to(clientSocketId).emit('device_response', sanitizedResponse);
            
            logger.info('Response forwarded to client', { 
                clientSocketId,
                command: response.command,
                success: response.success
            });
            
            monitoringService.recordCommand(
                response.command || 'unknown', 
                response.success ? 'completed' : 'failed'
            );
            
        } catch (error) {
            logger.error('Failed to forward response to client', { 
                error: error.message, 
                clientSocketId 
            });
            monitoringService.recordError('response_forwarding', 'device_manager');
        }
    }

    // Implement exponential backoff for retries
    async retryWithBackoff(operation, maxAttempts = 3, baseDelay = 1000) {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                const delay = baseDelay * Math.pow(2, attempt - 1);
                logger.warn('Operation failed, retrying', { 
                    attempt, 
                    maxAttempts, 
                    delay,
                    error: error.message 
                });
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    // Get comprehensive statistics
    getStats() {
        return {
            devices: {
                total: this.devices.size,
                online: Array.from(this.devices.values()).filter(d => d.status === 'online').length,
                capabilities: this.getCapabilitiesStats()
            },
            clients: {
                total: this.clients.size,
                types: this.getClientTypesStats()
            },
            health: {
                healthyConnections: this.connectionHealth.size,
                lastHealthCheck: new Date().toISOString()
            }
        };
    }

    getCapabilitiesStats() {
        const capabilities = {};
        for (const device of this.devices.values()) {
            for (const capability of device.capabilities || []) {
                capabilities[capability] = (capabilities[capability] || 0) + 1;
            }
        }
        return capabilities;
    }

    getClientTypesStats() {
        const types = {};
        for (const client of this.clients.values()) {
            types[client.type] = (types[client.type] || 0) + 1;
        }
        return types;
    }
}

const deviceManager = new DeviceManager();

// Socket.IO connection handling with authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }

        // Verify token
        const decoded = authService.verifyToken(token);
        socket.userId = decoded.userId;
        socket.userType = decoded.type; // 'device' or 'client'
        
        logger.info('Socket authenticated', { 
            socketId: socket.id, 
            userId: decoded.userId, 
            userType: decoded.type 
        });
        
        next();
    } catch (error) {
        logger.warn('Socket authentication failed', { 
            socketId: socket.id, 
            error: error.message 
        });
        monitoringService.recordError('authentication', 'socket_middleware');
        next(new Error('Authentication failed'));
    }
});

io.on('connection', (socket) => {
    const requestId = uuidv4();
    
    logger.info('Socket connected', {
        requestId,
        socketId: socket.id,
        userId: socket.userId,
        userType: socket.userType,
        ip: socket.handshake.address
    });

    // Mark connection as healthy
    deviceManager.markConnectionHealthy(socket.userId);

    // Device registration (Android app)
    socket.on('device_register', async (deviceInfo) => {
        try {
            // Validate device token
            if (!deviceInfo.deviceToken) {
                socket.emit('registration_error', { 
                    error: 'Device token required',
                    code: 'MISSING_TOKEN'
                });
                return;
            }

            const isValidToken = await authService.validateDeviceToken(deviceInfo.deviceToken);
            if (!isValidToken) {
                socket.emit('registration_error', { 
                    error: 'Invalid device token',
                    code: 'INVALID_TOKEN'
                });
                monitoringService.recordError('invalid_device_token', 'socket_handler');
                return;
            }

            const device = await deviceManager.addDevice(socket.id, {
                ...deviceInfo,
                userId: socket.userId
            });
            
            socket.emit('device_registered', { 
                deviceId: device.id,
                message: 'Device registered successfully',
                serverTime: new Date().toISOString(),
                features: config.features
            });

            monitoringService.recordCommand('device_register', 'success');
            
        } catch (error) {
            logger.error('Device registration failed', { 
                error: error.message, 
                socketId: socket.id,
                requestId
            });
            
            socket.emit('registration_error', { 
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
            monitoringService.recordError('device_registration', 'socket_handler');
        }
    });

    // Client registration (Windows client)
    socket.on('client_register', async (clientInfo) => {
        try {
            // Validate client token
            if (!clientInfo.clientToken) {
                socket.emit('registration_error', { 
                    error: 'Client token required',
                    code: 'MISSING_TOKEN'
                });
                return;
            }

            const isValidToken = await authService.validateClientToken(clientInfo.clientToken);
            if (!isValidToken) {
                socket.emit('registration_error', { 
                    error: 'Invalid client token',
                    code: 'INVALID_TOKEN'
                });
                monitoringService.recordError('invalid_client_token', 'socket_handler');
                return;
            }

            const client = await deviceManager.addClient(socket.id, {
                ...clientInfo,
                userId: socket.userId
            });
            
            socket.emit('client_registered', { 
                clientId: client.id,
                message: 'Client registered successfully',
                serverTime: new Date().toISOString(),
                features: config.features
            });

            monitoringService.recordCommand('client_register', 'success');
            
        } catch (error) {
            logger.error('Client registration failed', { 
                error: error.message, 
                socketId: socket.id,
                requestId
            });
            
            socket.emit('registration_error', { 
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
            monitoringService.recordError('client_registration', 'socket_handler');
        }
    });

    // Command from Windows client to Android device
    socket.on('device_command', async (data) => {
        const timer = monitoringService.startTimer('command_processing');
        
        try {
            const { deviceId, command } = data;
            
            // Validate command structure
            const { error } = validateCommand({ deviceId, command });
            if (error) {
                socket.emit('command_error', {
                    error: 'Invalid command structure',
                    details: error.message,
                    deviceId: deviceId,
                    timestamp: new Date().toISOString()
                });
                monitoringService.recordCommand(command?.action || 'unknown', 'validation_error');
                return;
            }

            const success = await deviceManager.forwardCommandToDevice(deviceId, command, socket.id);
            
            if (!success) {
                socket.emit('command_error', {
                    error: 'Device not found or offline',
                    deviceId: deviceId,
                    timestamp: new Date().toISOString()
                });
                monitoringService.recordCommand(command.action || 'unknown', 'device_not_found');
            }
            
        } catch (error) {
            logger.error('Command processing failed', { 
                error: error.message, 
                socketId: socket.id,
                requestId
            });
            
            socket.emit('command_error', {
                error: 'Command processing failed',
                timestamp: new Date().toISOString()
            });
            monitoringService.recordError('command_processing', 'socket_handler');
        } finally {
            timer();
        }
    });

    // Response from Android device to Windows client
    socket.on('device_response', (response) => {
        try {
            const device = deviceManager.getDeviceBySocketId(socket.id);
            if (device && response.clientSocketId) {
                deviceManager.forwardResponseToClient(response.clientSocketId, response);
                deviceManager.markConnectionHealthy(device.id);
            }
        } catch (error) {
            logger.error('Response forwarding failed', { 
                error: error.message, 
                socketId: socket.id 
            });
            monitoringService.recordError('response_forwarding', 'socket_handler');
        }
    });

    // File stream from device with validation
    socket.on('file_stream', (data) => {
        try {
            const { error } = validateFileUpload(data);
            if (error) {
                socket.emit('file_error', { 
                    error: 'Invalid file data',
                    details: error.message 
                });
                return;
            }

            // Forward file stream to requesting client
            if (data.clientSocketId) {
                io.to(data.clientSocketId).emit('file_stream', sanitizeObject(data));
                monitoringService.recordCommand('file_transfer', 'forwarded');
            }
        } catch (error) {
            logger.error('File stream handling failed', { 
                error: error.message, 
                socketId: socket.id 
            });
            monitoringService.recordError('file_stream', 'socket_handler');
        }
    });

    // Live streams (video, audio, screen) with rate limiting
    socket.on('stream_data', (data) => {
        try {
            const device = deviceManager.getDeviceBySocketId(socket.id);
            if (device) {
                deviceManager.broadcastToClients('stream_data', {
                    deviceId: device.id,
                    streamType: data.streamType,
                    data: data.data,
                    timestamp: data.timestamp || new Date().toISOString()
                });
                
                deviceManager.markConnectionHealthy(device.id);
                monitoringService.recordCommand('stream_data', 'forwarded');
            }
        } catch (error) {
            logger.error('Stream data handling failed', { 
                error: error.message, 
                socketId: socket.id 
            });
            monitoringService.recordError('stream_data', 'socket_handler');
        }
    });

    // Request device list (Windows client)
    socket.on('get_devices', () => {
        try {
            const deviceList = Array.from(deviceManager.devices.values()).map(device => ({
                id: device.id,
                name: device.name,
                model: device.model,
                androidVersion: device.androidVersion,
                status: device.status,
                capabilities: device.capabilities,
                connectedAt: device.connectedAt,
                lastHealthCheck: device.lastHealthCheck
            }));
            
            socket.emit('device_list', {
                devices: deviceList,
                count: deviceList.length,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            logger.error('Get devices failed', { 
                error: error.message, 
                socketId: socket.id 
            });
            socket.emit('error', { message: 'Failed to retrieve device list' });
        }
    });

    // Health check response
    socket.on('health_check_response', (data) => {
        try {
            const device = deviceManager.getDeviceBySocketId(socket.id);
            const client = deviceManager.clients.get(socket.userId);
            
            if (device) {
                deviceManager.markConnectionHealthy(device.id);
                device.lastHealthCheck = Date.now();
            } else if (client) {
                deviceManager.markConnectionHealthy(client.id);
                client.lastHealthCheck = Date.now();
            }
            
            logger.debug('Health check response received', { 
                socketId: socket.id, 
                responseTime: data.responseTime 
            });
            
        } catch (error) {
            logger.error('Health check response handling failed', { 
                error: error.message, 
                socketId: socket.id 
            });
        }
    });

    // Ping/Pong for connection monitoring
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
        
        // Update connection health
        const device = deviceManager.getDeviceBySocketId(socket.id);
        if (device) {
            deviceManager.markConnectionHealthy(device.id);
        }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        logger.info('Socket disconnected', {
            requestId,
            socketId: socket.id,
            userId: socket.userId,
            userType: socket.userType,
            reason
        });
        
        deviceManager.removeDevice(socket.id);
        deviceManager.removeClient(socket.id);
        
        monitoringService.recordCommand('disconnect', 'completed');
    });

    // Error handling
    socket.on('error', (error) => {
        logger.error('Socket error', {
            requestId,
            socketId: socket.id,
            userId: socket.userId,
            error: error.message
        });
        monitoringService.recordError('socket_error', 'socket_handler');
    });
});

// REST API endpoints

// Health check endpoint for load balancers
app.get('/health', (req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: '1.0.0',
        connections: {
            devices: deviceManager.devices.size,
            clients: deviceManager.clients.size,
            total: deviceManager.devices.size + deviceManager.clients.size
        },
        services: {
            redis: queueService.isRedisConnected(),
            monitoring: true
        }
    };

    // Check if critical services are healthy
    const isHealthy = queueService.isRedisConnected() || deviceManager.devices.size < 1000;
    
    if (isHealthy) {
        res.status(200).json(healthStatus);
    } else {
        healthStatus.status = 'unhealthy';
        res.status(503).json(healthStatus);
    }
});

// Detailed health check for monitoring systems
app.get('/health/detailed', (req, res) => {
    const stats = deviceManager.getStats();
    
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: '1.0.0',
            nodeVersion: process.version,
            platform: process.platform
        },
        connections: stats,
        services: {
            redis: {
                connected: queueService.isRedisConnected(),
                queues: queueService.getQueueStats()
            },
            circuitBreakers: circuitBreakerService.getStats(),
            monitoring: {
                metricsCollected: true,
                lastUpdate: new Date().toISOString()
            }
        },
        performance: {
            averageResponseTime: monitoringService.getAverageResponseTime(),
            errorRate: monitoringService.getErrorRate(),
            throughput: monitoringService.getThroughput()
        }
    });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
    try {
        const metrics = await monitoringService.getMetrics();
        res.set('Content-Type', 'text/plain');
        res.send(metrics);
    } catch (error) {
        logger.error('Failed to get metrics', { error: error.message });
        res.status(500).json({ error: 'Failed to retrieve metrics' });
    }
});

// Load balancer ready check
app.get('/ready', (req, res) => {
    const isReady = deviceManager.devices.size < config.maxDevices && 
                   queueService.isRedisConnected();
    
    if (isReady) {
        res.status(200).json({ 
            status: 'ready',
            timestamp: new Date().toISOString(),
            capacity: {
                devices: `${deviceManager.devices.size}/${config.maxDevices}`,
                clients: deviceManager.clients.size
            }
        });
    } else {
        res.status(503).json({ 
            status: 'not ready',
            timestamp: new Date().toISOString(),
            reason: 'Server at capacity or services unavailable'
        });
    }
});

// Root endpoint - Server info (no web interface)
app.get('/', (req, res) => {
    res.json({
        success: true,
        server: 'Remote Device Management Server',
        version: '1.0.0',
        description: 'Production-grade standalone relay server for Android-Windows remote control',
        uptime: process.uptime(),
        stats: {
            connectedDevices: deviceManager.devices.size,
            connectedClients: deviceManager.clients.size,
            totalSessions: deviceManager.sessions.size,
            maxCapacity: config.maxDevices
        },
        features: config.features,
        endpoints: {
            health: '/health',
            detailedHealth: '/health/detailed',
            metrics: '/metrics',
            ready: '/ready',
            status: '/api/status',
            devices: '/api/devices',
            upload: '/api/upload',
            download: '/uploads/:filename'
        },
        websocket: {
            enabled: true,
            authentication: 'JWT + Device/Client tokens',
            events: ['device_register', 'client_register', 'device_command', 'stream_data']
        },
        security: {
            rateLimit: config.rateLimit,
            fileUpload: {
                maxSize: config.fileUpload.maxFileSize,
                allowedTypes: config.fileUpload.allowedTypes
            }
        },
        timestamp: new Date().toISOString()
    });
});

// API endpoints with authentication middleware
app.use('/api', authService.authenticateToken);

app.get('/api/devices', (req, res) => {
    try {
        const deviceList = Array.from(deviceManager.devices.values()).map(device => ({
            id: device.id,
            name: device.name,
            model: device.model,
            androidVersion: device.androidVersion,
            status: device.status,
            capabilities: device.capabilities,
            connectedAt: device.connectedAt,
            lastHealthCheck: device.lastHealthCheck
        }));
        
        res.json({
            success: true,
            devices: deviceList,
            count: deviceList.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('API devices endpoint failed', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve devices' 
        });
    }
});

app.get('/api/status', (req, res) => {
    try {
        const stats = deviceManager.getStats();
        
        res.json({
            success: true,
            server: 'Remote Device Management Server',
            version: '1.0.0',
            uptime: process.uptime(),
            status: 'operational',
            stats,
            performance: {
                averageResponseTime: monitoringService.getAverageResponseTime(),
                errorRate: monitoringService.getErrorRate(),
                throughput: monitoringService.getThroughput()
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('API status endpoint failed', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to retrieve status' 
        });
    }
});

// Authentication endpoints
app.post('/api/auth/device-token', validateCommand, async (req, res) => {
    try {
        const { deviceId, deviceInfo } = req.body;
        const token = await authService.generateDeviceToken(deviceId, deviceInfo);
        
        res.json({
            success: true,
            token,
            expiresIn: config.auth.deviceTokenExpiry,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Device token generation failed', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate device token' 
        });
    }
});

app.post('/api/auth/client-token', validateCommand, async (req, res) => {
    try {
        const { clientId, clientInfo } = req.body;
        const token = await authService.generateClientToken(clientId, clientInfo);
        
        res.json({
            success: true,
            token,
            expiresIn: config.auth.clientTokenExpiry,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Client token generation failed', { error: error.message });
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate client token' 
        });
    }
});

// File upload endpoint with authentication and validation
app.post('/api/upload', uploadLimiter, authService.authenticateToken, upload.single('file'), validateFileUpload, (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        logger.info('File uploaded successfully', {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            userId: req.userId
        });

        res.json({
            success: true,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            path: `/uploads/${req.file.filename}`,
            uploadedBy: req.userId,
            timestamp: new Date().toISOString()
        });

        monitoringService.recordCommand('file_upload', 'success');
    } catch (error) {
        logger.error('File upload failed', { error: error.message });
        monitoringService.recordError('file_upload', 'api_handler');
        res.status(500).json({ 
            success: false, 
            error: 'File upload failed' 
        });
    }
});

// File download endpoint with authentication
app.get('/uploads/:filename', authService.authenticateToken, (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Validate filename to prevent directory traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid filename' 
            });
        }
        
        const filePath = path.join(__dirname, 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
            logger.info('File downloaded', {
                filename,
                userId: req.userId
            });
            
            res.download(filePath);
            monitoringService.recordCommand('file_download', 'success');
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'File not found' 
            });
            monitoringService.recordCommand('file_download', 'not_found');
        }
    } catch (error) {
        logger.error('File download failed', { 
            error: error.message, 
            filename: req.params.filename 
        });
        monitoringService.recordError('file_download', 'api_handler');
        res.status(500).json({ 
            success: false, 
            error: 'File download failed' 
        });
    }
});

// Global error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled API error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        requestId: req.requestId
    });
    
    monitoringService.recordError('unhandled_api_error', 'global_handler');
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
    });
});

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize services
async function initializeServices() {
    try {
        await queueService.connect();
        await monitoringService.initialize();
        logger.info('All services initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize services', { error: error.message });
        // Continue without services if they fail
    }
}

// Start server
const PORT = process.env.PORT || 3000;

async function startServerInstance() {
    await initializeServices();
    
    server.listen(PORT, () => {
        const workerId = cluster.worker ? cluster.worker.id : 'single';
        const processId = process.pid;
        
        logger.info('Server started', {
            port: PORT,
            workerId,
            processId,
            nodeEnv: process.env.NODE_ENV,
            clusterEnabled: enableCluster
        });
        
        console.log('🚀 Remote Device Management Server Started');
        console.log(`📡 Production-grade standalone server running on port ${PORT}`);
        console.log(`🔧 Worker ID: ${workerId} | Process ID: ${processId}`);
        console.log(`🌐 Server info: http://localhost:${PORT}`);
        console.log(`📱 Android devices connect via WebSocket with authentication`);
        console.log(`💻 Windows client connects via WebSocket with authentication`);
        console.log(`⚡ Enterprise features: Rate limiting, monitoring, circuit breakers`);
        console.log('');
        console.log('📋 Available endpoints:');
        console.log(`   GET  /           - Server information`);
        console.log(`   GET  /health     - Health check for load balancers`);
        console.log(`   GET  /health/detailed - Detailed health information`);
        console.log(`   GET  /metrics    - Prometheus metrics`);
        console.log(`   GET  /ready      - Load balancer ready check`);
        console.log(`   GET  /api/status - Server status (requires auth)`);
        console.log(`   GET  /api/devices - Connected devices (requires auth)`);
        console.log(`   POST /api/upload - File upload (requires auth)`);
        console.log(`   GET  /uploads/:filename - File download (requires auth)`);
        console.log(`   POST /api/auth/device-token - Generate device token`);
        console.log(`   POST /api/auth/client-token - Generate client token`);
        console.log('');
        console.log('🔒 Security features:');
        console.log(`   • JWT Authentication for API endpoints`);
        console.log(`   • Device/Client token validation for WebSocket`);
        console.log(`   • Rate limiting: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 60000} minutes`);
        console.log(`   • File upload limits: ${config.fileUpload.maxFileSize / (1024 * 1024)}MB max size`);
        console.log(`   • CORS protection with environment-based origins`);
        console.log(`   • Helmet security headers`);
        console.log('');
        console.log('📊 Monitoring:');
        console.log(`   • Prometheus metrics at /metrics`);
        console.log(`   • Health checks at /health and /health/detailed`);
        console.log(`   • Circuit breakers for Redis and external services`);
        console.log(`   • Structured logging with request tracking`);
        console.log('');
        console.log('⚖️ Load balancing:');
        if (enableCluster) {
            console.log(`   • Cluster mode enabled with ${numCPUs} workers`);
            console.log(`   • Ready check at /ready for load balancer`);
            console.log(`   • Redis-based session sharing`);
        } else {
            console.log(`   • Single process mode (set ENABLE_CLUSTER=true for cluster mode)`);
        }
    });
}

startServerInstance().catch(error => {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    logger.info('Received SIGINT, starting graceful shutdown');
    
    console.log('\n🛑 Shutting down server...');
    
    // Close server
    server.close(async () => {
        console.log('✅ HTTP server closed');
        
        // Close Socket.IO connections
        io.close(() => {
            console.log('✅ Socket.IO server closed');
        });
        
        // Close services
        try {
            await queueService.disconnect();
            console.log('✅ Queue service disconnected');
        } catch (error) {
            logger.error('Error disconnecting queue service', { error: error.message });
        }
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        console.log('⚠️ Force shutdown after 30s timeout');
        process.exit(1);
    }, 30000);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, starting graceful shutdown');
    process.emit('SIGINT');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { 
        error: error.message, 
        stack: error.stack 
    });
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection', { 
        reason: reason?.message || reason,
        promise: promise?.toString() 
    });
    console.error('💥 Unhandled Promise Rejection:', reason);
    process.exit(1);
});

} // End of startServer function
