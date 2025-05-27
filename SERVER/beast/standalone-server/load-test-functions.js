/**
 * =============================================================================
 * ENTERPRISE REMOTE DEVICE MANAGEMENT SERVER - LOAD TEST FUNCTIONS
 * =============================================================================
 * Supporting JavaScript functions for Artillery.js load testing.
 * Provides dynamic data generation, authentication helpers, and custom workflows.
 * =============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// =============================================================================
// AUTHENTICATION HELPERS
// =============================================================================

/**
 * Generate a device authentication token
 */
async function generateDeviceToken(context, events, done) {
  const deviceData = {
    deviceId: `load-test-device-${crypto.randomBytes(8).toString('hex')}`,
    deviceName: `Load Test Device ${Date.now()}`,
    model: getRandomElement(['Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11']),
    androidVersion: getRandomElement(['11', '12', '13', '14']),
    capabilities: ['camera', 'gps', 'sms', 'files']
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(deviceData)
    });

    if (response.ok) {
      const data = await response.json();
      context.vars.deviceToken = data.token;
      context.vars.deviceId = deviceData.deviceId;
    } else {
      console.error('Failed to generate device token:', response.status);
    }
  } catch (error) {
    console.error('Error generating device token:', error.message);
  }

  return done();
}

/**
 * Generate a client authentication token
 */
async function generateClientToken(context, events, done) {
  const clientData = {
    clientId: `load-test-client-${crypto.randomBytes(8).toString('hex')}`,
    clientName: `Load Test Client ${Date.now()}`,
    platform: 'Windows 11',
    version: '1.0.0'
  };

  try {
    const response = await fetch('http://localhost:3000/api/auth/client-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });

    if (response.ok) {
      const data = await response.json();
      context.vars.clientToken = data.token;
      context.vars.clientId = clientData.clientId;
    } else {
      console.error('Failed to generate client token:', response.status);
    }
  } catch (error) {
    console.error('Error generating client token:', error.message);
  }

  return done();
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

/**
 * Generate a test file for upload testing
 */
function generateTestFile(requestParams, context, ee, next) {
  const testContent = `Test file generated at ${new Date().toISOString()}\n` +
                     `Device ID: ${context.vars.deviceId || 'unknown'}\n` +
                     `Random data: ${crypto.randomBytes(1024).toString('hex')}\n`;
  
  const filename = 'test-file.txt';
  fs.writeFileSync(filename, testContent);
  
  // Clean up file after upload
  setTimeout(() => {
    try {
      fs.unlinkSync(filename);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 5000);

  return next();
}

/**
 * Generate large test file for stress testing
 */
function generateLargeTestFile(requestParams, context, ee, next) {
  const fileSize = 1024 * 1024; // 1MB
  const buffer = crypto.randomBytes(fileSize);
  const filename = `large-test-file-${Date.now()}.bin`;
  
  fs.writeFileSync(filename, buffer);
  
  context.vars.testFileName = filename;
  
  // Clean up after test
  setTimeout(() => {
    try {
      fs.unlinkSync(filename);
    } catch (error) {
      // Ignore cleanup errors
    }
  }, 10000);

  return next();
}

// =============================================================================
// RANDOM WORKLOAD SIMULATION
// =============================================================================

/**
 * Simulate mixed workload patterns
 */
function randomWorkload(context, events, done) {
  const workloadTypes = [
    'authentication',
    'health_check',
    'device_list',
    'file_upload',
    'websocket_connection'
  ];

  const selectedWorkload = getRandomElement(workloadTypes);
  context.vars.workloadType = selectedWorkload;

  // Set different probabilities for different operations
  switch (selectedWorkload) {
    case 'authentication':
      context.vars.operationWeight = 0.3; // 30% probability
      break;
    case 'health_check':
      context.vars.operationWeight = 0.2; // 20% probability
      break;
    case 'device_list':
      context.vars.operationWeight = 0.25; // 25% probability
      break;
    case 'file_upload':
      context.vars.operationWeight = 0.1; // 10% probability
      break;
    case 'websocket_connection':
      context.vars.operationWeight = 0.15; // 15% probability
      break;
  }

  return done();
}

// =============================================================================
// WEBSOCKET MESSAGE GENERATORS
// =============================================================================

/**
 * Generate realistic device command for testing
 */
function generateDeviceCommand(context, events, done) {
  const commands = [
    { command: 'get_device_info', params: {} },
    { command: 'get_location', params: { accuracy: 'high' } },
    { command: 'take_screenshot', params: { quality: 80 } },
    { command: 'list_files', params: { path: '/sdcard/Download' } },
    { command: 'get_battery_status', params: {} },
    { command: 'get_network_info', params: {} },
    { command: 'send_notification', params: { title: 'Test', message: 'Load test notification' } }
  ];

  const selectedCommand = getRandomElement(commands);
  context.vars.testCommand = JSON.stringify(selectedCommand);

  return done();
}

/**
 * Generate WebSocket message for device registration
 */
function generateDeviceRegistration(context, events, done) {
  const registration = {
    deviceId: `ws-device-${crypto.randomBytes(6).toString('hex')}`,
    name: `WebSocket Device ${Date.now()}`,
    model: getRandomElement(['Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11', 'Xiaomi 13']),
    androidVersion: getRandomElement(['11', '12', '13', '14']),
    capabilities: getRandomElement([
      ['camera', 'gps'],
      ['camera', 'gps', 'sms'],
      ['camera', 'gps', 'sms', 'files'],
      ['camera', 'gps', 'sms', 'files', 'sensors']
    ])
  };

  context.vars.deviceRegistration = JSON.stringify(registration);
  context.vars.deviceId = registration.deviceId;

  return done();
}

// =============================================================================
// PERFORMANCE METRICS COLLECTION
// =============================================================================

/**
 * Custom metric collection for business KPIs
 */
function collectCustomMetrics(context, events, done) {
  const startTime = Date.now();
  
  // Simulate metric collection
  events.emit('counter', 'custom.operations.total', 1);
  events.emit('histogram', 'custom.operation.duration', Date.now() - startTime);
  
  // Collect memory usage
  const memUsage = process.memoryUsage();
  events.emit('gauge', 'custom.memory.heap_used', memUsage.heapUsed);
  events.emit('gauge', 'custom.memory.heap_total', memUsage.heapTotal);

  return done();
}

/**
 * Track authentication success/failure rates
 */
function trackAuthMetrics(context, events, done) {
  if (context.vars.authToken) {
    events.emit('counter', 'auth.success', 1);
  } else {
    events.emit('counter', 'auth.failure', 1);
  }

  return done();
}

// =============================================================================
// DATA VALIDATION HELPERS
// =============================================================================

/**
 * Validate API response structure
 */
function validateApiResponse(requestParams, response, context, ee, next) {
  if (response.statusCode === 200) {
    try {
      const body = JSON.parse(response.body);
      
      // Validate required fields based on endpoint
      if (requestParams.url.includes('/auth/')) {
        if (!body.token || !body.expiresIn) {
          ee.emit('counter', 'validation.auth.missing_fields', 1);
        } else {
          ee.emit('counter', 'validation.auth.success', 1);
        }
      } else if (requestParams.url.includes('/health')) {
        if (!body.status || !body.timestamp) {
          ee.emit('counter', 'validation.health.missing_fields', 1);
        } else {
          ee.emit('counter', 'validation.health.success', 1);
        }
      }
    } catch (error) {
      ee.emit('counter', 'validation.json_parse_error', 1);
    }
  }

  return next();
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get random element from array
 */
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate random string
 */
function randomString(length = 8) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate realistic user agent
 */
function generateUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ];
  return getRandomElement(userAgents);
}

// =============================================================================
// ERROR HANDLING AND RECOVERY
// =============================================================================

/**
 * Handle connection errors gracefully
 */
function handleConnectionError(context, events, done) {
  console.log(`Connection error for user ${context.vars.$uuid}: retrying...`);
  
  // Emit error metric
  events.emit('counter', 'errors.connection', 1);
  
  // Implement exponential backoff
  const retryDelay = Math.min(1000 * Math.pow(2, context.vars.retryCount || 0), 10000);
  context.vars.retryCount = (context.vars.retryCount || 0) + 1;
  
  setTimeout(() => {
    done();
  }, retryDelay);
}

/**
 * Reset user context for clean retry
 */
function resetUserContext(context, events, done) {
  // Clear authentication tokens
  delete context.vars.deviceToken;
  delete context.vars.clientToken;
  delete context.vars.authToken;
  
  // Reset retry counter
  context.vars.retryCount = 0;
  
  return done();
}

// =============================================================================
// EXPORT FUNCTIONS
// =============================================================================

module.exports = {
  // Authentication
  generateDeviceToken,
  generateClientToken,
  
  // File operations
  generateTestFile,
  generateLargeTestFile,
  
  // Workload simulation
  randomWorkload,
  
  // WebSocket helpers
  generateDeviceCommand,
  generateDeviceRegistration,
  
  // Metrics collection
  collectCustomMetrics,
  trackAuthMetrics,
  
  // Validation
  validateApiResponse,
  
  // Error handling
  handleConnectionError,
  resetUserContext,
  
  // Utilities
  getRandomElement,
  randomString,
  sleep,
  generateUserAgent
};
