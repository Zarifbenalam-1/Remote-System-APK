# 👻 Ghost² Server Documentation

**Version:** 3.0.0  
**Date:** June 22, 2025  
**Status:** Production Ready  

## 🎯 **Overview**

Ghost² is a sophisticated remote device management and monitoring system with real-time alerts, email notifications, and comprehensive control dashboards. This server provides the backbone for Android device management, real-time surveillance, and system monitoring.

## 📁 **File Structure & Purpose**

### 🔧 **Core Server Files**

#### `server.js` - Main Server Application
- **Purpose:** Primary Express.js server with Socket.IO integration
- **Features:**
  - Real-time WebSocket connections for device communication
  - Gmail-based email alert system with dashboard configuration
  - File upload/download capabilities
  - RESTful API endpoints for all system operations
  - Firebase Cloud Messaging integration
  - Persistent email configuration storage
- **Key Endpoints:**
  - `/api/system-status` - Real system health and metrics
  - `/api/configure-alerts` - Email recipient configuration
  - `/api/configure-gmail` - Gmail SMTP setup
  - `/api/send-test-alert` - Test email functionality
  - `/api/clear-alerts` - Reset system alerts
  - `/api/upload` - File upload handling
- **Port:** 3000 (configurable)

#### `package.json` - Dependencies & Scripts
- **Purpose:** Node.js package configuration
- **Key Dependencies:**
  - `express` - Web server framework
  - `socket.io` - Real-time communication
  - `nodemailer` - Gmail email sending
  - `multer` - File upload handling
  - `uuid` - Unique ID generation
  - `cors` - Cross-origin resource sharing
- **Scripts:**
  - `npm start` - Start production server
  - `npm run dev` - Development with nodemon

#### `email-config.json` - Email Configuration Storage
- **Purpose:** Persistent storage for email settings
- **Contents:**
  - Email recipient addresses
  - Gmail SMTP credentials (encrypted in production)
  - Configuration timestamps
  - Alert preferences

### 🧠 **Core System Modules**

#### `ghost-resurrection-manager.js` - Core Device Management
- **Purpose:** Central hub for Android device control and management
- **Features:**
  - Device registration and authentication
  - Session management with smart timeouts
  - Formation templates for device grouping
  - Security monitoring and threat analysis
  - Real-time device statistics
- **Key Functions:**
  - Device wake/sleep operations
  - Silent command execution
  - Zombie army coordination
  - Automated threat responses

#### `zombie-routes.js` - API Route Definitions
- **Purpose:** RESTful API endpoints for device operations
- **Endpoints:**
  - `/api/zombie/register` - Device registration
  - `/api/zombie/:id/wake` - Wake specific device
  - `/api/zombie/:id/shutdown` - Shutdown device
  - `/api/zombie/:id/command` - Execute commands
  - `/api/zombie/army/wake` - Mass wake operations
  - `/api/zombie/list` - List all devices
  - `/api/zombie/sessions` - Active sessions

#### `advanced-analytics-api.js` - System Analytics
- **Purpose:** Advanced metrics collection and analysis
- **Features:**
  - Real-time device performance tracking
  - Session analytics and patterns
  - Command execution statistics
  - System health metrics
  - Performance trend analysis

#### `live-streaming-manager.js` - Real-time Streaming
- **Purpose:** Live video/audio streaming from devices
- **Features:**
  - Multi-camera surveillance grid
  - Real-time audio monitoring
  - Stream quality management
  - Automated recording capabilities
  - WebRTC integration for low-latency streaming

#### `command-scheduler.js` - Automated Operations
- **Purpose:** Time-based command scheduling and automation
- **Features:**
  - Scheduled device operations
  - Recurring task management
  - Automated response triggers
  - Session timeout handling
  - Smart retry mechanisms

### 🎛️ **Dashboard Files (public/)**

#### `ghost-mission-report.html` - **PRIMARY DASHBOARD** ⭐
- **Purpose:** Main monitoring and alert management interface
- **Features:**
  - Real-time system status monitoring
  - Gmail email configuration interface
  - Alert recipient management
  - System health metrics display
  - Email alert testing and verification
- **Status:** **PRODUCTION READY - MAIN INTERFACE**

#### `ghost-squared-command-center.html` - Central Control Hub
- **Purpose:** Main operational control interface
- **Features:**
  - Device overview and status
  - Quick action buttons
  - System navigation hub
  - Real-time notifications

#### `zombie-army-manager.html` - Device Management
- **Purpose:** Android device fleet management
- **Features:**
  - Device registration and pairing
  - Bulk device operations
  - Formation management
  - Device health monitoring

#### `ghost-analytics.html` - Analytics Dashboard
- **Purpose:** System performance and usage analytics
- **Features:**
  - Real-time metrics visualization
  - Performance trend charts
  - Device usage statistics
  - System optimization insights

#### `live-surveillance-grid.html` - Surveillance Interface
- **Purpose:** Multi-device live streaming and monitoring
- **Features:**
  - Multiple video stream display
  - Audio monitoring controls
  - Recording management
  - Stream quality controls

#### `quick-strike-panel.html` - Rapid Operations
- **Purpose:** Fast-access control panel for urgent operations
- **Features:**
  - Emergency device controls
  - Quick command execution
  - Mass operations interface
  - Alert triggers

#### `remote-operations.html` - Remote Device Control
- **Purpose:** Direct device interaction and control
- **Features:**
  - Individual device control
  - File transfer interface
  - Command execution terminal
  - Device interaction tools

#### `security-shield.html` - Security Management
- **Purpose:** System security monitoring and management
- **Features:**
  - Threat detection interface
  - Security alert management
  - Access control settings
  - Security audit logs

#### `ghost-config.html` - System Configuration
- **Purpose:** Server and system configuration interface
- **Features:**
  - Server settings management
  - User preference configuration
  - System parameter tuning
  - Advanced options

### 📂 **Additional Directories**

#### `node_modules/` - NPM Dependencies
- **Purpose:** Installed Node.js packages
- **Status:** Auto-generated, don't modify

#### `uploads/` - File Storage
- **Purpose:** Temporary file storage for uploads/downloads
- **Features:**
  - Automatic file cleanup
  - Size limitations enforced
  - Secure file handling

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ installed
- Gmail account with App Password enabled
- Port 3000 available

### Installation
```bash
cd /workspaces/Remote-System-APK/SERVER/simple-server
npm install
```

### Configuration
1. **Gmail Setup:**
   - Enable 2-Factor Authentication on Gmail
   - Generate App Password
   - Configure via Mission Report dashboard

2. **Firebase Setup:**
   - Place `firebase-service-account.json` in server directory
   - Ensure Firebase project is configured

### Running the Server
```bash
npm start
```

### Access Points
- **Main Dashboard:** http://localhost:3000/ghost-mission-report.html
- **Command Center:** http://localhost:3000/ghost-squared-command-center.html
- **API Documentation:** http://localhost:3000/api/status

## 📧 **Email Alert System**

### Features
- **Real Gmail Integration:** Uses actual Gmail SMTP
- **Dashboard Configuration:** Set up email credentials via web interface
- **Persistent Storage:** Configuration survives server restarts
- **Real-time Testing:** Send test emails from dashboard
- **Error Handling:** Comprehensive error reporting and retry logic

### Alert Types
- **Errors:** Critical system failures (always emailed)
- **Warnings:** System warnings (always emailed)
- **Info:** Informational messages (dashboard only)
- **Success:** Success confirmations (dashboard only)

## 🔒 **Security Features**

### Authentication
- Firebase-based device authentication
- Session-based access control
- Automated threat detection

### Data Protection
- Encrypted credential storage
- Secure file upload handling
- Cross-origin protection

## 🔧 **API Reference**

### System Status
```
GET /api/system-status
Returns: Real-time server health, uptime, memory usage, alert counts
```

### Email Configuration
```
POST /api/configure-alerts
Body: { emailAddresses: string[], gmailUser: string, gmailPassword: string }
Returns: Configuration confirmation
```

### Device Operations
```
POST /api/zombie/:id/wake
POST /api/zombie/:id/shutdown
POST /api/zombie/:id/command
```

## 🚨 **Troubleshooting**

### Common Issues
1. **Port 3000 in use:** Change port in server.js or kill existing process
2. **Gmail authentication failed:** Verify App Password is correct
3. **Firebase errors:** Check service account file permissions
4. **Email not sending:** Verify Gmail configuration in dashboard

### Logs
- Server logs: Console output
- Email logs: Detailed in console with status
- System alerts: Available via /api/system-status

## 📊 **Performance**

### Optimizations
- Real-time WebSocket connections
- Efficient memory management
- Automated cleanup processes
- Connection pooling for databases

### Monitoring
- Built-in health checks
- Memory usage tracking
- Alert count monitoring
- Performance metrics collection

## 🎯 **Deployment**

### Production Setup
1. Configure environment variables
2. Set up reverse proxy (nginx recommended)
3. Enable SSL/TLS certificates
4. Configure Gmail with production credentials
5. Set up monitoring and logging

### Environment Variables
```bash
NODE_ENV=production
PORT=3000
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

---

**Documentation Last Updated:** June 22, 2025  
**Server Version:** 3.0.0  
**Status:** Production Ready  

**For technical support or questions, refer to the Mission Report dashboard or server logs.**
