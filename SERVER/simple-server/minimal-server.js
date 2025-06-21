// Minimal Ghost Resurrection System Server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
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
app.use(express.static(path.join(__dirname, 'public')));

console.log('👻 Ghost Resurrection System - Minimal Mode');
console.log('⚠️  Firebase FCM features disabled');
console.log('🧟 Zombie Dashboard available in simulation mode');

// Simple in-memory storage for demo
const zombieDevices = new Map();
const activeSessions = new Map();

// Mock Ghost Manager for testing
const mockGhostManager = {
    registerZombieDevice: (deviceInfo) => {
        const zombie = {
            deviceId: deviceInfo.deviceId,
            fcmToken: deviceInfo.fcmToken || 'mock-token',
            name: deviceInfo.name || 'Test Zombie',
            model: deviceInfo.model || 'Unknown',
            androidVersion: deviceInfo.androidVersion || 'Unknown',
            registeredAt: new Date(),
            status: 'dormant'
        };
        zombieDevices.set(deviceInfo.deviceId, zombie);
        console.log(`🧟 Mock zombie registered: ${zombie.name}`);
        return zombie;
    },
    
    wakeUpZombie: async (deviceId) => {
        const zombie = zombieDevices.get(deviceId);
        if (!zombie) throw new Error('Zombie not found');
        
        activeSessions.set(deviceId, {
            deviceId,
            startTime: new Date(),
            status: 'active'
        });
        
        console.log(`🧟‍♂️ [SIMULATION] Zombie awakened: ${zombie.name}`);
        return { success: true, messageId: 'simulated', simulation: true };
    },
    
    shutdownZombie: async (deviceId) => {
        const zombie = zombieDevices.get(deviceId);
        if (!zombie) throw new Error('Zombie not found');
        
        activeSessions.delete(deviceId);
        console.log(`💀 [SIMULATION] Zombie shutdown: ${zombie.name}`);
        return { success: true, messageId: 'simulated', simulation: true };
    },
    
    getZombieDevices: () => Array.from(zombieDevices.values()),
    getActiveSessions: () => Array.from(activeSessions.values()),
    
    getDashboardData: () => ({
        totalZombies: zombieDevices.size,
        activeZombies: activeSessions.size,
        dormantZombies: zombieDevices.size - activeSessions.size,
        zombieDevices: Array.from(zombieDevices.values()),
        activeSessions: Array.from(activeSessions.values())
    })
};

// Routes
app.get('/api/zombie/dashboard', (req, res) => {
    res.json(mockGhostManager.getDashboardData());
});

app.post('/api/zombie/register', (req, res) => {
    try {
        const zombie = mockGhostManager.registerZombieDevice(req.body);
        res.json({ success: true, zombie });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/zombie/:id/wake', async (req, res) => {
    try {
        const result = await mockGhostManager.wakeUpZombie(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/zombie/:id/shutdown', async (req, res) => {
    try {
        const result = await mockGhostManager.shutdownZombie(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// Original simple server functionality
const deviceManager = {
    devices: new Map(),
    clients: new Map(),
    
    addDevice: (socketId, deviceInfo) => {
        const device = {
            id: deviceInfo.deviceId || require('uuid').v4(),
            socketId: socketId,
            name: deviceInfo.name || 'Unknown Device',
            model: deviceInfo.model || 'Unknown',
            androidVersion: deviceInfo.androidVersion || 'Unknown',
            connectedAt: new Date(),
            status: 'online',
            capabilities: deviceInfo.capabilities || []
        };
        deviceManager.devices.set(device.id, device);
        console.log(`📱 Device connected: ${device.name} (${device.id})`);
        return device;
    }
};

// Socket.IO handlers
io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('device_register', (deviceInfo) => {
        try {
            const device = deviceManager.addDevice(socket.id, deviceInfo);
            socket.emit('device_registered', { deviceId: device.id });
        } catch (error) {
            socket.emit('registration_error', { error: error.message });
        }
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Ghost Resurrection System server running on port ${PORT}`);
    console.log(`🌐 Zombie Dashboard: http://localhost:${PORT}/zombie-dashboard.html`);
    console.log(`📊 API Dashboard: http://localhost:${PORT}/api/zombie/dashboard`);
    console.log('');
    console.log('🧟 SIMULATION MODE - No real FCM messages will be sent');
    console.log('🔧 To enable FCM: Replace firebase-service-account.json with real credentials');
});
