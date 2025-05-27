const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

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

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`🔌 Disconnected: ${socket.id}`);
        deviceManager.removeDevice(socket.id);
        deviceManager.removeClient(socket.id);
    });
});

// REST API endpoints

// Root endpoint - Server info (no web interface)
app.get('/', (req, res) => {
    res.json({
        success: true,
        server: 'Remote Device Management Server',
        version: '1.0.0',
        description: 'Standalone relay server for Android-Windows remote control',
        uptime: process.uptime(),
        stats: {
            connectedDevices: deviceManager.devices.size,
            connectedClients: deviceManager.clients.size,
            totalSessions: deviceManager.sessions.size
        },
        endpoints: {
            status: '/api/status',
            devices: '/api/devices',
            upload: '/api/upload',
            download: '/uploads/:filename'
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
    console.log('🚀 Remote Device Management Server Started');
    console.log(`📡 Standalone server running on port ${PORT}`);
    console.log(`🌐 Server info: http://localhost:${PORT}`);
    console.log(`📱 Android devices connect via WebSocket`);
    console.log(`💻 Windows client connects via WebSocket`);
    console.log(`⚡ No web interface - API and WebSocket only`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   GET  /           - Server information`);
    console.log(`   GET  /api/status - Server status`);
    console.log(`   GET  /api/devices - Connected devices`);
    console.log(`   POST /api/upload - File upload`);
    console.log(`   GET  /uploads/:filename - File download`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed.');
        process.exit(0);
    });
});
