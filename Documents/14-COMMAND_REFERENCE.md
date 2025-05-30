# 📖 Command Reference - Complete Command Documentation

## 🎯 **Complete Command API Reference**

This comprehensive reference documents every available command in the Harvard Remote System, including parameters, responses, permissions, and usage examples. Perfect for developers and advanced users.

---

## 📋 **Command Overview**

### **Command Categories**
- 🔍 **[Device Information](#device-information-commands)** - System status and device details
- 📍 **[Location Services](#location-commands)** - GPS and location-based operations  
- 💬 **[Communication](#communication-commands)** - SMS and call management
- 📷 **[Media Capture](#media-commands)** - Camera and audio operations
- 📁 **[File Operations](#file-commands)** - File system access and management
- 🌐 **[Network Operations](#network-commands)** - WiFi and connectivity information
- 📱 **[System Management](#system-commands)** - App and system control

### **Command Format**
All commands follow this JSON structure:
```json
{
  "type": "command",
  "command": "command_name",
  "params": {
    "parameter1": "value1",
    "parameter2": "value2"
  },
  "requestId": "unique-request-id"
}
```

### **Response Format**
All responses follow this JSON structure:
```json
{
  "type": "response",
  "requestId": "unique-request-id",
  "success": true,
  "data": { /* Command-specific data */ },
  "error": null,
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

## 🔍 **Device Information Commands**

### **device_info**
Get comprehensive device information and system status.

#### **Parameters**
```json
{} // No parameters required
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "deviceId": "android-abc123def456",
    "model": "Pixel 5",
    "manufacturer": "Google",
    "brand": "google",
    "androidVersion": "12",
    "apiLevel": 31,
    "buildId": "SQ3A.220705.004",
    "serialNumber": "1A2B3C4D5E6F",
    "imei": "123456789012345",
    "batteryLevel": 85,
    "batteryStatus": "charging",
    "storage": {
      "totalInternal": "128GB",
      "availableInternal": "45GB",
      "totalExternal": "64GB",
      "availableExternal": "32GB"
    },
    "memory": {
      "totalRAM": "8GB",
      "availableRAM": "4.2GB"
    },
    "display": {
      "width": 1080,
      "height": 2340,
      "density": 440
    },
    "network": {
      "type": "wifi",
      "connected": true,
      "ipAddress": "192.168.1.105"
    }
  }
}
```

#### **Required Permissions**
- None (uses publicly available information)

#### **Example Usage**
```javascript
// Send command
socket.emit('command', {
  command: 'device_info',
  params: {},
  targetDevice: 'android-abc123def456'
});

// Handle response
socket.on('device_info_response', (data) => {
  console.log('Device Model:', data.data.model);
  console.log('Android Version:', data.data.androidVersion);
  console.log('Battery Level:', data.data.batteryLevel + '%');
});
```

---

### **battery_status**
Get detailed battery information and charging status.

#### **Parameters**
```json
{
  "detailed": true  // Optional: Get detailed battery info
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "level": 85,
    "status": "charging",
    "health": "good",
    "temperature": 25.6,
    "voltage": 4.2,
    "technology": "Li-ion",
    "plugged": "ac",
    "present": true,
    "scale": 100,
    "capacity": 3080
  }
}
```

#### **Required Permissions**
- None

---

### **system_info**
Get system performance and resource information.

#### **Parameters**
```json
{
  "includeProcesses": false  // Optional: Include running processes
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "uptime": 2547200000,
    "bootTime": "2025-01-01T00:00:00Z",
    "cpuUsage": 15.2,
    "memoryUsage": {
      "used": "3.8GB",
      "free": "4.2GB",
      "cached": "2.1GB"
    },
    "processes": 127,
    "kernelVersion": "5.4.61-android12",
    "buildFingerprint": "google/redfin/redfin:12/SQ3A.220705.004"
  }
}
```

---

## 📍 **Location Commands**

### **get_location**
Retrieve current GPS coordinates and location information.

#### **Parameters**
```json
{
  "accuracy": "high",        // "high", "medium", "low"
  "timeout": 30000,          // Timeout in milliseconds
  "includeAddress": true     // Include reverse geocoding
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "latitude": 42.3601,
    "longitude": -71.0589,
    "accuracy": 5.0,
    "altitude": 10.5,
    "bearing": 45.0,
    "speed": 0.0,
    "timestamp": "2025-01-01T12:30:00Z",
    "provider": "gps",
    "address": {
      "street": "123 Harvard Ave",
      "city": "Cambridge",
      "state": "MA",
      "zipCode": "02138",
      "country": "US"
    }
  }
}
```

#### **Required Permissions**
- `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION`

#### **Error Handling**
```json
{
  "success": false,
  "error": {
    "code": "LOCATION_DISABLED",
    "message": "Location services are disabled",
    "suggestion": "Enable location services in device settings"
  }
}
```

---

### **location_history**
Get recent location history from device.

#### **Parameters**
```json
{
  "count": 10,              // Number of recent locations
  "timeRange": 3600000      // Time range in milliseconds (1 hour)
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "locations": [
      {
        "latitude": 42.3601,
        "longitude": -71.0589,
        "accuracy": 5.0,
        "timestamp": "2025-01-01T12:30:00Z"
      },
      {
        "latitude": 42.3605,
        "longitude": -71.0585,
        "accuracy": 8.0,
        "timestamp": "2025-01-01T12:25:00Z"
      }
    ],
    "totalPoints": 2,
    "timeSpan": 300000
  }
}
```

---

## 💬 **Communication Commands**

### **get_sms**
Retrieve SMS messages from device.

#### **Parameters**
```json
{
  "limit": 50,              // Maximum number of messages
  "type": "all",            // "all", "inbox", "sent", "draft"
  "since": "2025-01-01T00:00:00Z",  // Optional: Messages since date
  "contact": "+1234567890"  // Optional: Filter by contact
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "address": "+1234567890",
        "body": "Hello, how are you?",
        "date": "2025-01-01T12:00:00Z",
        "type": "inbox",
        "read": true,
        "thread_id": 1,
        "contact_name": "John Doe"
      }
    ],
    "totalCount": 1,
    "hasMore": false
  }
}
```

#### **Required Permissions**
- `READ_SMS`

---

### **send_sms**
Send SMS message to specified number.

#### **Parameters**
```json
{
  "number": "+1234567890",
  "message": "Hello from Harvard Remote System!",
  "deliveryReport": true    // Optional: Request delivery report
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "messageId": "sms_12345",
    "sentAt": "2025-01-01T12:00:00Z",
    "status": "sent",
    "recipient": "+1234567890"
  }
}
```

#### **Required Permissions**
- `SEND_SMS`

---

### **call_log**
Retrieve call log information.

#### **Parameters**
```json
{
  "limit": 100,            // Maximum number of calls
  "type": "all",           // "all", "incoming", "outgoing", "missed"
  "since": "2025-01-01T00:00:00Z"  // Optional: Calls since date
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "calls": [
      {
        "number": "+1234567890",
        "name": "John Doe",
        "type": "incoming",
        "date": "2025-01-01T11:30:00Z",
        "duration": 120,
        "new": false
      }
    ],
    "totalCount": 1
  }
}
```

#### **Required Permissions**
- `READ_CALL_LOG`

---

## 📷 **Media Commands**

### **take_photo**
Capture photo using device camera.

#### **Parameters**
```json
{
  "camera": "back",         // "back", "front"
  "quality": "high",        // "high", "medium", "low"
  "flash": "auto",          // "auto", "on", "off"
  "format": "jpeg"          // "jpeg", "png"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "imageData": "base64-encoded-image-data",
    "metadata": {
      "width": 4032,
      "height": 3024,
      "size": 2457600,
      "timestamp": "2025-01-01T12:00:00Z",
      "camera": "back",
      "format": "jpeg"
    }
  }
}
```

#### **Required Permissions**
- `CAMERA`

---

### **record_audio**
Record audio for specified duration.

#### **Parameters**
```json
{
  "duration": 30,           // Duration in seconds
  "quality": "high",        // "high", "medium", "low"
  "format": "mp3"           // "mp3", "wav", "aac"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "audioData": "base64-encoded-audio-data",
    "metadata": {
      "duration": 30.5,
      "size": 487200,
      "sampleRate": 44100,
      "channels": 2,
      "format": "mp3",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  }
}
```

#### **Required Permissions**
- `RECORD_AUDIO`

---

### **take_screenshot**
Capture screenshot of device screen.

#### **Parameters**
```json
{
  "quality": "high",        // "high", "medium", "low"
  "format": "png"           // "png", "jpeg"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "imageData": "base64-encoded-screenshot-data",
    "metadata": {
      "width": 1080,
      "height": 2340,
      "size": 156800,
      "timestamp": "2025-01-01T12:00:00Z",
      "format": "png"
    }
  }
}
```

#### **Required Permissions**
- Android 5.0+: No special permissions (uses MediaProjection)
- Android 14+: May require additional setup

---

## 📁 **File Commands**

### **list_files**
List files and directories in specified path.

#### **Parameters**
```json
{
  "path": "/sdcard/Download",
  "recursive": false,       // Include subdirectories
  "includeHidden": false,   // Include hidden files
  "sortBy": "name"          // "name", "size", "date"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "path": "/sdcard/Download",
    "files": [
      {
        "name": "document.pdf",
        "path": "/sdcard/Download/document.pdf",
        "size": 1048576,
        "type": "file",
        "modified": "2025-01-01T10:00:00Z",
        "permissions": "rw-r--r--"
      },
      {
        "name": "photos",
        "path": "/sdcard/Download/photos",
        "type": "directory",
        "modified": "2025-01-01T09:00:00Z",
        "itemCount": 15
      }
    ],
    "totalItems": 2
  }
}
```

#### **Required Permissions**
- `READ_EXTERNAL_STORAGE`

---

### **download_file**
Download file from device to server.

#### **Parameters**
```json
{
  "path": "/sdcard/Download/document.pdf",
  "encoding": "base64"      // "base64", "binary"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "fileName": "document.pdf",
    "fileData": "base64-encoded-file-content",
    "metadata": {
      "size": 1048576,
      "mimeType": "application/pdf",
      "modified": "2025-01-01T10:00:00Z",
      "encoding": "base64"
    }
  }
}
```

#### **Required Permissions**
- `READ_EXTERNAL_STORAGE`

---

### **upload_file**
Upload file from server to device.

#### **Parameters**
```json
{
  "fileName": "uploaded_document.pdf",
  "filePath": "/sdcard/Download/uploaded_document.pdf",
  "fileData": "base64-encoded-file-content",
  "overwrite": false
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "filePath": "/sdcard/Download/uploaded_document.pdf",
    "size": 1048576,
    "uploaded": "2025-01-01T12:00:00Z"
  }
}
```

#### **Required Permissions**
- `WRITE_EXTERNAL_STORAGE`

---

## 🌐 **Network Commands**

### **wifi_info**
Get WiFi connection and network information.

#### **Parameters**
```json
{
  "includeAvailable": true  // Include available networks
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "connected": {
      "ssid": "Harvard-Secure",
      "bssid": "aa:bb:cc:dd:ee:ff",
      "ipAddress": "192.168.1.105",
      "linkSpeed": 54,
      "signalStrength": -45,
      "security": "WPA2",
      "frequency": 2437
    },
    "availableNetworks": [
      {
        "ssid": "Harvard-Guest",
        "signalStrength": -60,
        "security": "Open",
        "frequency": 2412
      }
    ]
  }
}
```

#### **Required Permissions**
- `ACCESS_WIFI_STATE`
- `ACCESS_NETWORK_STATE`

---

### **network_info**
Get comprehensive network connectivity information.

#### **Parameters**
```json
{} // No parameters required
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "connectionType": "wifi",
    "ipAddress": "192.168.1.105",
    "macAddress": "aa:bb:cc:dd:ee:ff",
    "gateway": "192.168.1.1",
    "dns": ["8.8.8.8", "8.8.4.4"],
    "networkOperator": "Verizon",
    "dataRoaming": false,
    "vpnActive": false
  }
}
```

---

## 📱 **System Commands**

### **installed_apps**
Get list of installed applications.

#### **Parameters**
```json
{
  "includeSystem": false,   // Include system apps
  "includeIcons": false     // Include app icons (base64)
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "packageName": "com.example.app",
        "appName": "Example App",
        "version": "1.0.0",
        "versionCode": 1,
        "installed": "2025-01-01T00:00:00Z",
        "updated": "2025-01-01T12:00:00Z",
        "size": 10485760,
        "system": false,
        "enabled": true,
        "icon": "base64-encoded-icon-data"
      }
    ],
    "totalApps": 1
  }
}
```

#### **Required Permissions**
- None (uses package manager)

---

### **app_info**
Get detailed information about specific application.

#### **Parameters**
```json
{
  "packageName": "com.example.app"
}
```

#### **Response**
```json
{
  "success": true,
  "data": {
    "packageName": "com.example.app",
    "appName": "Example App",
    "version": "1.0.0",
    "versionCode": 1,
    "targetSdk": 31,
    "minSdk": 24,
    "permissions": [
      "android.permission.INTERNET",
      "android.permission.CAMERA"
    ],
    "activities": [
      "com.example.app.MainActivity"
    ],
    "services": [
      "com.example.app.BackgroundService"
    ],
    "size": {
      "code": 5242880,
      "data": 3145728,
      "cache": 2097152
    }
  }
}
```

---

## 🔒 **Security & Error Handling**

### **Common Error Responses**

#### **Permission Denied**
```json
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Permission denied for requested operation",
    "requiredPermission": "android.permission.CAMERA",
    "suggestion": "Grant camera permission in device settings"
  }
}
```

#### **Command Not Found**
```json
{
  "success": false,
  "error": {
    "code": "COMMAND_NOT_FOUND",
    "message": "Unknown command: invalid_command",
    "availableCommands": ["device_info", "get_location", "take_photo"]
  }
}
```

#### **Network Error**
```json
{
  "success": false,
  "error": {
    "code": "NETWORK_ERROR",
    "message": "Network connection lost",
    "retryAfter": 5000
  }
}
```

### **Rate Limiting**
Commands are rate-limited to prevent abuse:
- **Maximum**: 60 commands per minute per device
- **Burst**: Up to 10 commands in 10 seconds
- **Exceeded**: Returns HTTP 429 with retry-after header

### **Command Timeouts**
Different commands have different timeout values:
- **Quick commands** (device_info, battery): 5 seconds
- **Medium commands** (location, SMS): 15 seconds  
- **Long commands** (photo, audio, files): 60 seconds

---

## 📊 **Performance Considerations**

### **Data Size Limits**
- **Image data**: 10MB maximum
- **Audio data**: 50MB maximum
- **File downloads**: 100MB maximum
- **Response payload**: 50MB total

### **Command Execution Times**
| Command Category | Typical Response Time |
|-----------------|----------------------|
| Device Info | <100ms |
| Battery Status | <50ms |
| Location | 1-5 seconds |
| SMS Operations | 100-500ms |
| Photo Capture | 2-8 seconds |
| Audio Recording | Duration + 1 second |
| File Operations | Depends on file size |
| Network Info | <200ms |

### **Memory Usage**
- **Base service**: 20-30MB RAM
- **During photo**: +10-20MB temporarily
- **During audio**: +5-10MB temporarily
- **Large file ops**: +50-100MB temporarily

---

## 🎯 **Usage Examples**

### **JavaScript Client Example**
```javascript
const socket = io('http://localhost:3000');

// Send device info command
function getDeviceInfo(deviceId) {
    const requestId = generateUUID();
    
    socket.emit('command', {
        command: 'device_info',
        params: {},
        targetDevice: deviceId,
        requestId: requestId
    });
    
    return new Promise((resolve, reject) => {
        socket.on(`response_${requestId}`, (response) => {
            if (response.success) {
                resolve(response.data);
            } else {
                reject(response.error);
            }
        });
    });
}

// Usage
getDeviceInfo('android-123').then(info => {
    console.log('Device Model:', info.model);
    console.log('Battery Level:', info.batteryLevel);
}).catch(error => {
    console.error('Command failed:', error.message);
});
```

### **Python Client Example**
```python
import socketio
import asyncio

sio = socketio.AsyncClient()

@sio.event
async def connect():
    print('Connected to server')

@sio.event
async def response(data):
    print('Command response:', data)

async def send_command(command, params, device_id):
    await sio.emit('command', {
        'command': command,
        'params': params,
        'targetDevice': device_id
    })

# Usage
async def main():
    await sio.connect('http://localhost:3000')
    await send_command('device_info', {}, 'android-123')
    await sio.wait()

asyncio.run(main())
```

---

**This command reference provides complete documentation for all available commands in the Harvard Remote System. Use it as your definitive guide for implementation and testing.**

*Need help with specific implementations? Check out [`13-USER_MANUAL.md`](13-USER_MANUAL.md) for usage guidance!*
