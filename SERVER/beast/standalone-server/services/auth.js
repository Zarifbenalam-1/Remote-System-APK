const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.deviceTokens = new Set(config.security.deviceTokens);
    this.clientTokens = new Set(config.security.clientTokens);
  }

  // Validate device token
  validateDeviceToken(token) {
    return this.deviceTokens.has(token);
  }

  // Validate client token
  validateClientToken(token) {
    return this.clientTokens.has(token);
  }

  // Generate JWT token for authenticated sessions
  generateSessionToken(payload, expiresIn = '24h') {
    return jwt.sign(payload, config.security.jwtSecret, { expiresIn });
  }

  // Verify JWT token
  verifySessionToken(token) {
    try {
      return jwt.verify(token, config.security.jwtSecret);
    } catch (error) {
      logger.warn('Invalid JWT token', { error: error.message });
      return null;
    }
  }

  // Middleware for device authentication
  authenticateDevice(socket, data, callback) {
    const { token } = data;
    
    if (!token) {
      logger.warn('Device registration attempt without token', { socketId: socket.id });
      return callback({ error: 'Authentication token required' });
    }

    if (!this.validateDeviceToken(token)) {
      logger.warn('Device registration with invalid token', { 
        socketId: socket.id, 
        token: token.substring(0, 10) + '...' 
      });
      return callback({ error: 'Invalid authentication token' });
    }

    // Generate session token
    const sessionToken = this.generateSessionToken({
      type: 'device',
      socketId: socket.id,
      deviceId: data.deviceId
    });

    socket.sessionToken = sessionToken;
    socket.authenticated = true;
    socket.userType = 'device';

    logger.info('Device authenticated successfully', { 
      socketId: socket.id, 
      deviceId: data.deviceId 
    });

    callback({ success: true, sessionToken });
  }

  // Middleware for client authentication
  authenticateClient(socket, data, callback) {
    const { token } = data;
    
    if (!token) {
      logger.warn('Client registration attempt without token', { socketId: socket.id });
      return callback({ error: 'Authentication token required' });
    }

    if (!this.validateClientToken(token)) {
      logger.warn('Client registration with invalid token', { 
        socketId: socket.id, 
        token: token.substring(0, 10) + '...' 
      });
      return callback({ error: 'Invalid authentication token' });
    }

    // Generate session token
    const sessionToken = this.generateSessionToken({
      type: 'client',
      socketId: socket.id,
      clientName: data.name
    });

    socket.sessionToken = sessionToken;
    socket.authenticated = true;
    socket.userType = 'client';

    logger.info('Client authenticated successfully', { 
      socketId: socket.id, 
      clientName: data.name 
    });

    callback({ success: true, sessionToken });
  }

  // Middleware to check if socket is authenticated
  requireAuth(socket, callback) {
    if (!socket.authenticated) {
      logger.warn('Unauthorized socket operation', { socketId: socket.id });
      return callback({ error: 'Authentication required' });
    }
    callback({ success: true });
  }

  // Add new device token (for dynamic token management)
  addDeviceToken(token) {
    this.deviceTokens.add(token);
    logger.info('Device token added', { token: token.substring(0, 10) + '...' });
  }

  // Add new client token
  addClientToken(token) {
    this.clientTokens.add(token);
    logger.info('Client token added', { token: token.substring(0, 10) + '...' });
  }

  // Remove device token
  removeDeviceToken(token) {
    this.deviceTokens.delete(token);
    logger.info('Device token removed', { token: token.substring(0, 10) + '...' });
  }

  // Remove client token
  removeClientToken(token) {
    this.clientTokens.delete(token);
    logger.info('Client token removed', { token: token.substring(0, 10) + '...' });
  }

  // Express middleware for token authentication (bound method)
  authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = this.verifySessionToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = decoded;
    next();
  }
}

module.exports = new AuthService();
