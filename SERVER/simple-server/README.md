# 📡 Simple Relay Server

A **lightweight headless server** that acts as a pure relay between Android devices and Windows clients using WebSocket communication.

## 🎯 What This Is

This is a **headless relay server** - no web interface needed! It just:
- ✅ Routes messages between Android devices and Windows clients
- ✅ Handles file transfers
- ✅ Manages WebSocket connections
- ✅ Pure API/WebSocket server

## 🚀 Quick Start

```bash
# Navigate to simple-server folder
cd simple-server

# Install dependencies
npm install

# Start the server
npm start
```

**✅ Server will start on:** `http://localhost:3000`

## 📱 How It Works

### Architecture:
```
Android App ←→ Simple Server ←→ Windows Client
```

### Connections:
- **Android devices** connect via WebSocket to send/receive commands
- **Windows clients** connect via WebSocket to control Android devices
- **Server relays** messages between them

## 🔧 Features

- **Real-time Communication** - WebSocket-based messaging
- **File Transfer** - Upload/download files (50MB limit)
- **Device Management** - Track connected devices and clients
- **Command Routing** - Route commands to specific devices
- **Session Management** - Manage active connections

## 📋 Connection Details

### WebSocket Endpoint:
```
ws://localhost:3000
```

### HTTP Endpoints:
```
POST /upload              # File upload
GET /download/:filename   # File download
GET /                     # Server status
```

## 🔍 Test Connection

```bash
# Check if server is running
curl http://localhost:3000

# Expected response: Server info JSON
```

## ⚙️ Configuration

Default settings work out of the box. To customize:

```bash
# Change port
export PORT=8080
npm start

# Or edit server.js directly
```

## 📁 File Structure

```
simple-server/
├── server.js       # Main relay server
├── package.json    # Dependencies
├── README.md       # This file
└── uploads/        # Auto-created for file storage
```

---

**🎯 This is a headless server - connect your Android app and Windows client via WebSocket!**

## 🎯 Purpose

This server acts as a communication bridge between:
- **Android devices** (running your custom APK)
- **Windows client applications** (desktop control interface)

Perfect for remote device management, monitoring, and control over the internet.

## ✨ Features

### 🔄 Real-time Communication
- **WebSocket-based** bidirectional communication
- **Low-latency** command routing
- **Live streaming** support (screen, camera, audio)
- **Connection monitoring** with ping/pong

### 📱 Device Management
- **Multi-device support** - handle multiple Android devices
- **Device registration** with capabilities detection
- **Online/offline status** tracking
- **Automatic cleanup** on disconnection

### 💻 Windows Client Support
- **Command routing** from Windows client to Android devices
- **Response forwarding** back to requesting clients
- **Device discovery** and listing
- **Real-time notifications** for device status changes

### 📁 File Transfer
- **File upload/download** with 50MB limit
- **Secure file storage** in uploads directory
- **REST API endpoints** for file operations

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd remote-device-management-server

# Install dependencies
npm install

# Start the server
npm start
```

## 🌐 Deployment

### Render (Free Tier)
1. Connect your GitHub repository to Render
2. Select "Web Service"
3. Use these settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node.js

### Manual Deployment
```bash
# Production start
NODE_ENV=production npm start
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Server information and status |
| `GET` | `/api/status` | Detailed server statistics |
| `GET` | `/api/devices` | List connected devices |
| `POST` | `/api/upload` | Upload files (50MB max) |
| `GET` | `/uploads/:filename` | Download files |

## 🔌 WebSocket Events

### Android Device Events
```javascript
// Register device
socket.emit('device_register', {
    deviceId: 'unique-device-id',
    name: 'Device Name',
    model: 'Device Model',
    androidVersion: '12',
    capabilities: ['screen_capture', 'camera', 'files']
});

// Send response to Windows client
socket.emit('device_response', {
    command: 'get_screen',
    success: true,
    data: { /* response data */ },
    clientSocketId: 'client-socket-id'
});
```

### Windows Client Events
```javascript
// Register client
socket.emit('client_register', {
    name: 'Windows Client'
});

// Send command to device
socket.emit('device_command', {
    deviceId: 'target-device-id',
    command: {
        action: 'get_screen',
        params: { /* command parameters */ }
    }
});

// Get device list
socket.emit('get_devices');
```

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌──────────────────┐    WebSocket    ┌─────────────────┐
│  Windows Client │ ◄──────────────► │  Relay Server    │ ◄──────────────► │ Android Device  │
│                 │                  │                  │                  │                 │
│ • Send Commands │                  │ • Route Messages │                  │ • Execute Cmds  │
│ • Display Data  │                  │ • Manage Devices │                  │ • Send Response │
│ • File Transfer │                  │ • Handle Streams │                  │ • Stream Data   │
└─────────────────┘                  └──────────────────┘                  └─────────────────┘
```

## 🔧 Configuration

### Environment Variables
```bash
PORT=3000                    # Server port (default: 3000)
NODE_ENV=production         # Environment mode
MAX_FILE_SIZE=52428800      # File upload limit (50MB)
```

### Security Notes
- **No authentication** by default (add as needed)
- **CORS enabled** for all origins
- **File uploads** limited to 50MB
- **No persistent storage** (all data in memory)

## 🚀 Use Cases

- **Remote device monitoring** and control
- **Multi-device management** from single Windows client
- **Live screen streaming** and recording
- **File transfer** between devices and client
- **Command execution** on remote Android devices

## 🎓 Academic Project

This server is designed as part of a comprehensive remote device management system for academic purposes, demonstrating:
- **Real-time networking** concepts
- **Multi-platform communication** 
- **Scalable server architecture**
- **WebSocket protocol** implementation

## 📝 License

MIT License - Feel free to use for educational purposes.

---

**Built with ❤️ for remote device management**
