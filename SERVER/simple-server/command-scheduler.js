/**
 * Command Scheduler for Ghost Resurrection System Phase 3
 * 
 * Handles scheduled commands, automated responses, and time-based zombie operations
 * with military-precision timing and Hollywood-level sophistication.
 */

const cron = require('node-cron');

class CommandScheduler {
    constructor(ghostManager) {
        this.ghostManager = ghostManager;
        this.scheduledJobs = new Map(); // jobId -> job info
        this.recurringJobs = new Map(); // jobId -> cron job
        this.jobHistory = new Map(); // jobId -> execution history
        this.automatedResponses = new Map(); // triggerId -> response config
        this.jobCounter = 0;
        
        this.initializeScheduler();
        console.log('⏰ Command Scheduler v3.0 initialized');
        console.log('📅 Automated zombie operations and time-based commands ready');
    }

    /**
     * Initialize command scheduler
     */
    initializeScheduler() {
        // Set up default automated responses
        this.createDefaultAutomatedResponses();
        
        // Start cleanup job for old completed jobs
        this.startCleanupJob();
        
        console.log('✅ Command Scheduler ready for time-based zombie operations');
    }

    /**
     * Schedule a one-time command
     */
    scheduleCommand(config) {
        const {
            deviceId,
            command,
            executeAt,
            priority = 'normal',
            timeout = 30,
            parameters = {},
            description = 'Scheduled Command'
        } = config;

        if (!deviceId || !command || !executeAt) {
            throw new Error('Device ID, command, and execution time are required');
        }

        const jobId = `sched_${++this.jobCounter}_${Date.now()}`;
        const executeTime = new Date(executeAt);
        
        if (executeTime <= new Date()) {
            throw new Error('Execution time must be in the future');
        }

        const job = {
            id: jobId,
            deviceId,
            command,
            executeAt: executeTime,
            priority,
            timeout,
            parameters,
            description,
            status: 'scheduled',
            createdAt: new Date(),
            type: 'one-time'
        };

        // Calculate delay in milliseconds
        const delay = executeTime.getTime() - Date.now();
        
        // Schedule the command
        const timeoutId = setTimeout(async () => {
            await this.executeScheduledCommand(jobId);
        }, delay);

        job.timeoutId = timeoutId;
        this.scheduledJobs.set(jobId, job);

        console.log(`⏰ Command scheduled: ${description} for ${deviceId} at ${executeTime.toISOString()}`);
        
        return { success: true, jobId, job };
    }

    /**
     * Schedule recurring command using cron syntax
     */
    scheduleRecurringCommand(config) {
        const {
            deviceId,
            command,
            cronExpression,
            priority = 'normal',
            timeout = 30,
            parameters = {},
            description = 'Recurring Command',
            maxExecutions = null
        } = config;

        if (!deviceId || !command || !cronExpression) {
            throw new Error('Device ID, command, and cron expression are required');
        }

        // Validate cron expression
        if (!cron.validate(cronExpression)) {
            throw new Error('Invalid cron expression');
        }

        const jobId = `recur_${++this.jobCounter}_${Date.now()}`;
        
        const job = {
            id: jobId,
            deviceId,
            command,
            cronExpression,
            priority,
            timeout,
            parameters,
            description,
            status: 'active',
            createdAt: new Date(),
            type: 'recurring',
            executionCount: 0,
            maxExecutions,
            lastExecution: null,
            nextExecution: null
        };

        // Create cron job
        const cronJob = cron.schedule(cronExpression, async () => {
            await this.executeRecurringCommand(jobId);
        }, {
            scheduled: true
        });

        job.cronJob = cronJob;
        this.recurringJobs.set(jobId, job);

        console.log(`🔄 Recurring command scheduled: ${description} for ${deviceId} (${cronExpression})`);
        
        return { success: true, jobId, job };
    }

    /**
     * Execute scheduled one-time command
     */
    async executeScheduledCommand(jobId) {
        try {
            const job = this.scheduledJobs.get(jobId);
            if (!job) {
                console.error(`⏰ Scheduled job not found: ${jobId}`);
                return;
            }

            console.log(`⏰ Executing scheduled command: ${job.description} (${jobId})`);
            job.status = 'executing';
            job.executionStarted = new Date();

            // Execute the command
            const result = await this.ghostManager.executeAdvancedCommand(job.deviceId, {
                command: job.command,
                priority: job.priority,
                timeout: job.timeout,
                parameters: job.parameters
            });

            // Update job status
            job.status = result.success ? 'completed' : 'failed';
            job.executionCompleted = new Date();
            job.result = result;
            job.executionTime = job.executionCompleted - job.executionStarted;

            // Store in history
            this.addToHistory(jobId, job, result);

            console.log(`⏰ Scheduled command ${result.success ? 'completed' : 'failed'}: ${job.description}`);

        } catch (error) {
            console.error(`💥 Error executing scheduled command ${jobId}:`, error);
            
            const job = this.scheduledJobs.get(jobId);
            if (job) {
                job.status = 'error';
                job.error = error.message;
                job.executionCompleted = new Date();
            }
        }
    }

    /**
     * Execute recurring command
     */
    async executeRecurringCommand(jobId) {
        try {
            const job = this.recurringJobs.get(jobId);
            if (!job) {
                console.error(`🔄 Recurring job not found: ${jobId}`);
                return;
            }

            // Check if max executions reached
            if (job.maxExecutions && job.executionCount >= job.maxExecutions) {
                console.log(`🔄 Max executions reached for recurring job: ${job.description}`);
                this.stopRecurringCommand(jobId);
                return;
            }

            console.log(`🔄 Executing recurring command: ${job.description} (${jobId}) - Execution #${job.executionCount + 1}`);
            
            const executionStart = new Date();

            // Execute the command
            const result = await this.ghostManager.executeAdvancedCommand(job.deviceId, {
                command: job.command,
                priority: job.priority,
                timeout: job.timeout,
                parameters: job.parameters
            });

            // Update job statistics
            job.executionCount++;
            job.lastExecution = executionStart;
            job.lastResult = result;

            // Store in history
            this.addToHistory(jobId, job, result, job.executionCount);

            console.log(`🔄 Recurring command ${result.success ? 'completed' : 'failed'}: ${job.description} (#${job.executionCount})`);

        } catch (error) {
            console.error(`💥 Error executing recurring command ${jobId}:`, error);
        }
    }

    /**
     * Cancel scheduled command
     */
    cancelScheduledCommand(jobId) {
        const job = this.scheduledJobs.get(jobId);
        if (!job) {
            throw new Error(`Scheduled job not found: ${jobId}`);
        }

        if (job.timeoutId) {
            clearTimeout(job.timeoutId);
        }

        job.status = 'cancelled';
        job.cancelledAt = new Date();

        console.log(`⏰ Scheduled command cancelled: ${job.description}`);
        
        return { success: true, jobId, status: 'cancelled' };
    }

    /**
     * Stop recurring command
     */
    stopRecurringCommand(jobId) {
        const job = this.recurringJobs.get(jobId);
        if (!job) {
            throw new Error(`Recurring job not found: ${jobId}`);
        }

        if (job.cronJob) {
            job.cronJob.stop();
            job.cronJob.destroy();
        }

        job.status = 'stopped';
        job.stoppedAt = new Date();

        console.log(`🔄 Recurring command stopped: ${job.description}`);
        
        return { success: true, jobId, status: 'stopped' };
    }

    /**
     * Create automated response trigger
     */
    createAutomatedResponse(config) {
        const {
            triggerId,
            triggerType,
            conditions,
            response,
            priority = 'high',
            description = 'Automated Response'
        } = config;

        if (!triggerId || !triggerType || !conditions || !response) {
            throw new Error('Trigger ID, type, conditions, and response are required');
        }

        const trigger = {
            id: triggerId,
            type: triggerType,
            conditions,
            response,
            priority,
            description,
            enabled: true,
            createdAt: new Date(),
            triggerCount: 0,
            lastTriggered: null
        };

        this.automatedResponses.set(triggerId, trigger);

        console.log(`🤖 Automated response created: ${description} (${triggerId})`);
        
        return { success: true, triggerId, trigger };
    }

    /**
     * Check and trigger automated responses
     */
    checkAutomatedResponses(eventType, eventData) {
        this.automatedResponses.forEach(async (trigger, triggerId) => {
            if (!trigger.enabled || trigger.type !== eventType) {
                return;
            }

            // Check if conditions are met
            const conditionsMet = this.evaluateConditions(trigger.conditions, eventData);
            
            if (conditionsMet) {
                console.log(`🤖 Automated response triggered: ${trigger.description}`);
                
                // Execute automated response
                await this.executeAutomatedResponse(triggerId, eventData);
            }
        });
    }

    /**
     * Execute automated response
     */
    async executeAutomatedResponse(triggerId, eventData) {
        try {
            const trigger = this.automatedResponses.get(triggerId);
            if (!trigger) {
                return;
            }

            trigger.triggerCount++;
            trigger.lastTriggered = new Date();

            const response = trigger.response;

            // Execute response commands
            if (response.commands) {
                for (const cmd of response.commands) {
                    await this.ghostManager.executeAdvancedCommand(cmd.deviceId || eventData.deviceId, {
                        command: cmd.command,
                        priority: trigger.priority,
                        timeout: cmd.timeout || 30,
                        parameters: cmd.parameters || {}
                    });
                }
            }

            // Execute formation deployment if specified
            if (response.formation) {
                await this.ghostManager.deployFormation(response.formation, response.formationCommands);
            }

            // Send notifications if specified
            if (response.notifications) {
                response.notifications.forEach(notification => {
                    console.log(`📢 Automated notification: ${notification.message}`);
                    // Could integrate with external notification systems here
                });
            }

            console.log(`🤖 Automated response executed: ${trigger.description} (Trigger #${trigger.triggerCount})`);

        } catch (error) {
            console.error(`💥 Error executing automated response ${triggerId}:`, error);
        }
    }

    /**
     * Evaluate conditions for automated responses
     */
    evaluateConditions(conditions, eventData) {
        // Simple condition evaluation - can be made more sophisticated
        for (const condition of conditions) {
            const { field, operator, value } = condition;
            const fieldValue = this.getFieldValue(eventData, field);

            switch (operator) {
                case 'equals':
                    if (fieldValue !== value) return false;
                    break;
                case 'greater_than':
                    if (fieldValue <= value) return false;
                    break;
                case 'less_than':
                    if (fieldValue >= value) return false;
                    break;
                case 'contains':
                    if (!fieldValue.toString().includes(value)) return false;
                    break;
                case 'exists':
                    if (fieldValue === undefined || fieldValue === null) return false;
                    break;
                default:
                    return false;
            }
        }
        
        return true;
    }

    /**
     * Get field value from event data
     */
    getFieldValue(data, field) {
        const fields = field.split('.');
        let value = data;
        
        for (const f of fields) {
            if (value && typeof value === 'object') {
                value = value[f];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    /**
     * Add execution to history
     */
    addToHistory(jobId, job, result, executionNumber = null) {
        const historyKey = executionNumber ? `${jobId}_${executionNumber}` : jobId;
        
        const historyEntry = {
            jobId,
            executionId: historyKey,
            jobType: job.type,
            deviceId: job.deviceId,
            command: job.command,
            executedAt: new Date(),
            success: result.success,
            result: result,
            executionTime: job.executionTime || 0,
            parameters: job.parameters
        };

        this.jobHistory.set(historyKey, historyEntry);
    }

    /**
     * Create default automated responses
     */
    createDefaultAutomatedResponses() {
        // Automated response for high threat level
        this.createAutomatedResponse({
            triggerId: 'high_threat_response',
            triggerType: 'security_threat',
            conditions: [
                { field: 'severity', operator: 'equals', value: 'high' }
            ],
            response: {
                commands: [
                    {
                        command: 'enter_stealth_mode',
                        timeout: 20
                    }
                ],
                notifications: [
                    { message: 'High threat detected - Stealth mode activated' }
                ]
            },
            description: 'High Threat Auto-Response'
        });

        // Automated response for device timeout
        this.createAutomatedResponse({
            triggerId: 'device_timeout_response',
            triggerType: 'device_timeout',
            conditions: [
                { field: 'sessionDuration', operator: 'greater_than', value: 1800000 } // 30 minutes
            ],
            response: {
                commands: [
                    {
                        command: 'extend_session_timeout',
                        parameters: { additionalTime: 600000 }, // 10 more minutes
                        timeout: 15
                    }
                ]
            },
            description: 'Session Timeout Extension'
        });

        console.log('🤖 Default automated responses created');
    }

    /**
     * Start cleanup job for old completed jobs
     */
    startCleanupJob() {
        // Run cleanup every hour
        cron.schedule('0 * * * *', () => {
            this.cleanupOldJobs();
        });
    }

    /**
     * Clean up old completed jobs
     */
    cleanupOldJobs() {
        const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        let cleanedCount = 0;

        // Clean scheduled jobs
        for (const [jobId, job] of this.scheduledJobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
                if (job.executionCompleted && job.executionCompleted < cutoffTime) {
                    this.scheduledJobs.delete(jobId);
                    cleanedCount++;
                }
            }
        }

        // Clean job history (keep last 1000 entries)
        const historyEntries = Array.from(this.jobHistory.entries())
            .sort((a, b) => b[1].executedAt - a[1].executedAt);
        
        if (historyEntries.length > 1000) {
            const toRemove = historyEntries.slice(1000);
            toRemove.forEach(([key]) => {
                this.jobHistory.delete(key);
                cleanedCount++;
            });
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleanup completed: ${cleanedCount} old jobs removed`);
        }
    }

    /**
     * Get scheduler statistics
     */
    getSchedulerStats() {
        const activeScheduled = Array.from(this.scheduledJobs.values())
            .filter(job => job.status === 'scheduled').length;
        
        const activeRecurring = Array.from(this.recurringJobs.values())
            .filter(job => job.status === 'active').length;

        const totalExecutions = Array.from(this.recurringJobs.values())
            .reduce((sum, job) => sum + job.executionCount, 0);

        return {
            activeScheduledJobs: activeScheduled,
            activeRecurringJobs: activeRecurring,
            totalScheduledJobs: this.scheduledJobs.size,
            totalRecurringJobs: this.recurringJobs.size,
            totalExecutions,
            historyEntries: this.jobHistory.size,
            automatedResponses: this.automatedResponses.size
        };
    }

    /**
     * Get all scheduled jobs
     */
    getAllScheduledJobs() {
        return {
            scheduled: Array.from(this.scheduledJobs.values()),
            recurring: Array.from(this.recurringJobs.values()),
            automatedResponses: Array.from(this.automatedResponses.values())
        };
    }

    /**
     * Get job history
     */
    getJobHistory(limit = 50) {
        return Array.from(this.jobHistory.values())
            .sort((a, b) => b.executedAt - a.executedAt)
            .slice(0, limit);
    }
}

module.exports = CommandScheduler;
