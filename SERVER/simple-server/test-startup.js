// Test startup script for Ghost Resurrection System
console.log('🧟 Starting Ghost Resurrection System - TEST MODE');

try {
    // Test basic dependencies
    console.log('📦 Testing core dependencies...');
    const express = require('express');
    const socketIo = require('socket.io');
    const cors = require('cors');
    console.log('✅ Core dependencies loaded');

    // Test Firebase Admin SDK
    console.log('🔥 Testing Firebase Admin SDK...');
    const admin = require('firebase-admin');
    console.log('✅ Firebase Admin SDK loaded');

    // Test Ghost Resurrection Manager
    console.log('👻 Testing Ghost Resurrection Manager...');
    const GhostResurrectionManager = require('./ghost-resurrection-manager');
    console.log('✅ Ghost Resurrection Manager loaded');
    
    console.log('🎯 All dependencies loaded successfully! Starting server...');
    
    // Start the actual server
    require('./server.js');
    
} catch (error) {
    console.error('💥 Error during startup:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
}
