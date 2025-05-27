# 📚 API Reference

Complete API documentation for the BEAST Remote Device Management Server.

## 📋 Table of Contents
- [API Overview](#api-overview)
- [Authentication](#authentication)
- [Device Management](#device-management)
- [Command Execution](#command-execution)
- [File Operations](#file-operations)
- [System Information](#system-information)
- [WebSocket Events](#websocket-events)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [API Examples](#api-examples)

## 🔍 API Overview

### Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

### API Versioning
```
Current Version: v1
Base Path: /api/v1
```

### Content Types
- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🔐 Authentication

### Login
Authenticate user and receive JWT token.

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "administrator",
      "permissions": ["device:read", "device:write", "system:admin"]
    },
    "expiresIn": "7d"
  }
}
```

### Token Refresh
Refresh an existing JWT token.

```http
POST /api/auth/refresh
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d"
  }
}
```

### Logout
Invalidate the current token.

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Validate Token
Check if a token is valid.

```http
GET /api/auth/validate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "user-123",
      "username": "admin",
      "role": "administrator"
    },
    "expiresAt": "2025-06-02T10:30:00.000Z"
  }
}
```

## 🖥️ Device Management

### List Devices
Get all connected devices.

```http
GET /api/devices
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` - Filter by status (`online`, `offline`, `error`)
- `platform` - Filter by platform (`linux`, `windows`, `macos`)
- `limit` - Number of devices to return (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "device-001",
        "hostname": "server-001",
        "platform": "linux",
        "arch": "x64",
        "status": "online",
        "lastSeen": "2025-05-26T10:30:00.000Z",
        "uptime": 86400000,
        "version": "1.0.0",
        "capabilities": ["command", "file_transfer", "monitoring"],
        "systemInfo": {
          "cpu": {
            "model": "Intel(R) Xeon(R) CPU E5-2686 v4",
            "cores": 4,
            "usage": 25.5
          },
          "memory": {
            "total": 8589934592,
            "free": 4294967296,
            "used": 4294967296,
            "usage": 50.0
          },
          "disk": {
            "total": 107374182400,
            "free": 53687091200,
            "used": 53687091200,
            "usage": 50.0
          }
        }
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "hasNext": true
    }
  }
}
```

### Get Device Details
Get detailed information about a specific device.

```http
GET /api/devices/{deviceId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "device-001",
    "hostname": "server-001",
    "platform": "linux",
    "arch": "x64",
    "status": "online",
    "connectedAt": "2025-05-26T08:00:00.000Z",
    "lastSeen": "2025-05-26T10:30:00.000Z",
    "uptime": 9000000,
    "version": "1.0.0",
    "ip": "192.168.1.100",
    "userAgent": "BEAST-Client/1.0.0",
    "capabilities": ["command", "file_transfer", "monitoring"],
    "tags": ["production", "web-server"],
    "systemInfo": {
      "os": {
        "name": "Ubuntu",
        "version": "20.04.3 LTS",
        "kernel": "5.4.0-91-generic"
      },
      "cpu": {
        "model": "Intel(R) Xeon(R) CPU E5-2686 v4",
        "cores": 4,
        "usage": 25.5,
        "loadAverage": [0.5, 0.3, 0.2]
      },
      "memory": {
        "total": 8589934592,
        "free": 4294967296,
        "used": 4294967296,
        "usage": 50.0,
        "cached": 1073741824
      },
      "disk": [
        {
          "filesystem": "/dev/xvda1",
          "mount": "/",
          "total": 107374182400,
          "free": 53687091200,
          "used": 53687091200,
          "usage": 50.0
        }
      ],
      "network": [
        {
          "interface": "eth0",
          "ip": "192.168.1.100",
          "mac": "02:42:ac:11:00:02",
          "rx": 1073741824,
          "tx": 536870912
        }
      ]
    },
    "performance": {
      "responseTime": 150,
      "lastCommand": "2025-05-26T10:25:00.000Z",
      "commandsExecuted": 47,
      "errors": 2
    }
  }
}
```

### Update Device
Update device information or tags.

```http
PUT /api/devices/{deviceId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["production", "web-server", "critical"],
  "metadata": {
    "environment": "production",
    "owner": "ops-team"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device updated successfully",
  "data": {
    "id": "device-001",
    "tags": ["production", "web-server", "critical"],
    "metadata": {
      "environment": "production",
      "owner": "ops-team"
    },
    "updatedAt": "2025-05-26T10:30:00.000Z"
  }
}
```

### Remove Device
Remove a device from management.

```http
DELETE /api/devices/{deviceId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Device removed successfully"
}
```

## 🎮 Command Execution

### Execute Command
Execute a command on a specific device.

```http
POST /api/devices/{deviceId}/command
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "shell",
  "command": "ps aux | grep node",
  "timeout": 30000,
  "async": false
}
```

**Command Types:**
- `shell` - Execute shell command
- `system_info` - Get system information
- `process_list` - List running processes
- `file_list` - List files in directory
- `download_file` - Download file from device
- `upload_file` - Upload file to device

**Response:**
```json
{
  "success": true,
  "data": {
    "commandId": "cmd-12345",
    "action": "shell",
    "command": "ps aux | grep node",
    "status": "completed",
    "exitCode": 0,
    "output": "root      1234  0.5  2.1 123456 78901 ?        Sl   08:00   0:30 node server.js\n",
    "error": null,
    "executedAt": "2025-05-26T10:30:00.000Z",
    "duration": 250,
    "deviceId": "device-001"
  }
}
```

### Get Command Status
Check the status of an executed command.

```http
GET /api/commands/{commandId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "commandId": "cmd-12345",
    "action": "shell",
    "command": "ps aux | grep node",
    "status": "completed",
    "exitCode": 0,
    "output": "root      1234  0.5  2.1 123456 78901 ?        Sl   08:00   0:30 node server.js\n",
    "error": null,
    "queuedAt": "2025-05-26T10:30:00.000Z",
    "executedAt": "2025-05-26T10:30:01.000Z",
    "completedAt": "2025-05-26T10:30:01.250Z",
    "duration": 250,
    "deviceId": "device-001",
    "userId": "user-123"
  }
}
```

### List Command History
Get command execution history.

```http
GET /api/devices/{deviceId}/commands
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` - Number of commands to return (default: 50)
- `offset` - Pagination offset (default: 0)
- `status` - Filter by status (`pending`, `running`, `completed`, `failed`)
- `action` - Filter by action type

**Response:**
```json
{
  "success": true,
  "data": {
    "commands": [
      {
        "commandId": "cmd-12345",
        "action": "shell",
        "command": "ps aux | grep node",
        "status": "completed",
        "exitCode": 0,
        "executedAt": "2025-05-26T10:30:00.000Z",
        "duration": 250
      }
    ],
    "pagination": {
      "total": 47,
      "limit": 50,
      "offset": 0,
      "hasNext": false
    }
  }
}
```

## 📁 File Operations

### Upload File
Upload a file to a device.

```http
POST /api/devices/{deviceId}/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

form-data:
  file: <binary-file-data>
  destination: "/tmp/uploaded-file.txt"
  overwrite: true
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "transferId": "transfer-12345",
    "filename": "uploaded-file.txt",
    "destination": "/tmp/uploaded-file.txt",
    "size": 1024,
    "checksum": "sha256:abc123...",
    "uploadedAt": "2025-05-26T10:30:00.000Z"
  }
}
```

### Download File
Download a file from a device.

```http
POST /api/devices/{deviceId}/download
Authorization: Bearer <token>
Content-Type: application/json

{
  "path": "/var/log/system.log",
  "compress": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "transfer-12346",
    "filename": "system.log",
    "path": "/var/log/system.log",
    "size": 2048,
    "compressed": true,
    "checksum": "sha256:def456...",
    "downloadUrl": "/api/downloads/transfer-12346",
    "expiresAt": "2025-05-26T11:30:00.000Z"
  }
}
```

### List Files
List files in a directory on a device.

```http
GET /api/devices/{deviceId}/files?path=/home/user
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "path": "/home/user",
    "files": [
      {
        "name": "document.txt",
        "path": "/home/user/document.txt",
        "type": "file",
        "size": 1024,
        "permissions": "644",
        "owner": "user",
        "group": "user",
        "modified": "2025-05-26T09:00:00.000Z"
      },
      {
        "name": "projects",
        "path": "/home/user/projects",
        "type": "directory",
        "permissions": "755",
        "owner": "user",
        "group": "user",
        "modified": "2025-05-25T15:30:00.000Z"
      }
    ]
  }
}
```

### File Transfer Status
Check the status of a file transfer.

```http
GET /api/transfers/{transferId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transferId": "transfer-12345",
    "type": "upload",
    "filename": "uploaded-file.txt",
    "deviceId": "device-001",
    "status": "completed",
    "progress": 100,
    "size": 1024,
    "transferred": 1024,
    "speed": 512000,
    "startedAt": "2025-05-26T10:30:00.000Z",
    "completedAt": "2025-05-26T10:30:02.000Z",
    "duration": 2000,
    "checksum": "sha256:abc123..."
  }
}
```

## 📊 System Information

### Health Check
Check server health status.

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-05-26T10:30:00.000Z",
    "uptime": 86400000,
    "version": "1.0.0",
    "environment": "production",
    "checks": {
      "database": "healthy",
      "memory": "healthy",
      "disk": "healthy",
      "network": "healthy"
    },
    "metrics": {
      "totalDevices": 150,
      "onlineDevices": 142,
      "offlineDevices": 8,
      "totalCommands": 1250,
      "activeTransfers": 3
    }
  }
}
```

### Server Statistics
Get detailed server statistics.

```http
GET /api/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": {
      "uptime": 86400000,
      "version": "1.0.0",
      "nodeVersion": "18.16.0",
      "memory": {
        "rss": 134217728,
        "heapTotal": 67108864,
        "heapUsed": 33554432,
        "external": 8388608
      },
      "cpu": {
        "usage": 25.5,
        "loadAverage": [0.5, 0.3, 0.2]
      }
    },
    "devices": {
      "total": 150,
      "online": 142,
      "offline": 8,
      "byPlatform": {
        "linux": 120,
        "windows": 25,
        "macos": 5
      }
    },
    "commands": {
      "total": 1250,
      "today": 85,
      "successful": 1200,
      "failed": 50,
      "pending": 5
    },
    "transfers": {
      "total": 450,
      "active": 3,
      "completed": 440,
      "failed": 7,
      "totalBytes": 10737418240
    },
    "performance": {
      "averageResponseTime": 150,
      "requestsPerSecond": 25.5,
      "errorRate": 0.002
    }
  }
}
```

### Configuration
Get server configuration (admin only).

```http
GET /api/config
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "server": {
      "name": "BEAST Remote Device Manager",
      "version": "1.0.0",
      "environment": "production"
    },
    "features": {
      "deviceManagement": true,
      "fileTransfer": true,
      "realTimeMonitoring": true,
      "commandExecution": true,
      "userManagement": true,
      "auditLogging": true
    },
    "limits": {
      "maxDevicesPerUser": 100,
      "maxConcurrentConnections": 1000,
      "maxFileSize": 52428800,
      "commandTimeout": 60000
    },
    "security": {
      "jwtExpiresIn": "7d",
      "rateLimitEnabled": true,
      "httpsOnly": true,
      "corsEnabled": true
    }
  }
}
```

## 🔌 WebSocket Events

### Connection Events

#### Client to Server Events

**Register Device**
```javascript
socket.emit('register_device', {
  deviceId: 'device-001',
  deviceInfo: {
    hostname: 'server-001',
    platform: 'linux',
    arch: 'x64',
    version: '1.0.0'
  },
  capabilities: ['command', 'file_transfer', 'monitoring']
});
```

**Device Status Update**
```javascript
socket.emit('device_status', {
  deviceId: 'device-001',
  status: 'online',
  systemInfo: {
    cpu: { usage: 25.5 },
    memory: { usage: 50.0 },
    uptime: 86400000
  }
});
```

**Command Response**
```javascript
socket.emit('command_response', {
  commandId: 'cmd-12345',
  status: 'completed',
  exitCode: 0,
  output: 'Command output...',
  error: null
});
```

#### Server to Client Events

**Device Connected**
```javascript
socket.on('device_connected', (data) => {
  console.log('Device connected:', data);
  // data: { deviceId, hostname, platform, timestamp }
});
```

**Device Disconnected**
```javascript
socket.on('device_disconnected', (data) => {
  console.log('Device disconnected:', data);
  // data: { deviceId, reason, timestamp }
});
```

**Execute Command**
```javascript
socket.on('execute_command', (data) => {
  console.log('Command to execute:', data);
  // data: { commandId, action, command, timeout }
});
```

**File Transfer Request**
```javascript
socket.on('file_transfer', (data) => {
  console.log('File transfer request:', data);
  // data: { transferId, type, filename, destination }
});
```

### Real-time Monitoring Events

**System Metrics**
```javascript
socket.on('system_metrics', (data) => {
  console.log('System metrics:', data);
  /*
  data: {
    deviceId: 'device-001',
    timestamp: '2025-05-26T10:30:00.000Z',
    cpu: { usage: 25.5, loadAverage: [0.5, 0.3, 0.2] },
    memory: { usage: 50.0, free: 4294967296 },
    disk: { usage: 50.0, free: 53687091200 },
    network: { rx: 1073741824, tx: 536870912 }
  }
  */
});
```

**Alert Notification**
```javascript
socket.on('alert', (data) => {
  console.log('Alert received:', data);
  /*
  data: {
    id: 'alert-123',
    deviceId: 'device-001',
    type: 'high_cpu_usage',
    severity: 'warning',
    message: 'CPU usage is above 80%',
    timestamp: '2025-05-26T10:30:00.000Z',
    value: 85.5,
    threshold: 80
  }
  */
});
```

## ❌ Error Handling

### Error Response Format
All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "deviceId",
        "message": "Device ID is required",
        "value": null
      }
    ],
    "timestamp": "2025-05-26T10:30:00.000Z",
    "requestId": "req-12345"
  }
}
```

### Common Error Codes

#### Authentication Errors
- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

#### Validation Errors
- `VALIDATION_ERROR` - Request validation failed
- `MISSING_PARAMETERS` - Required parameters missing
- `INVALID_FORMAT` - Invalid parameter format

#### Device Errors
- `DEVICE_NOT_FOUND` - Device not found
- `DEVICE_OFFLINE` - Device is offline
- `DEVICE_BUSY` - Device is busy executing another command

#### Command Errors
- `COMMAND_TIMEOUT` - Command execution timeout
- `COMMAND_FAILED` - Command execution failed
- `INVALID_COMMAND` - Invalid command format

#### File Transfer Errors
- `FILE_NOT_FOUND` - File not found
- `FILE_TOO_LARGE` - File exceeds size limit
- `TRANSFER_FAILED` - File transfer failed
- `PERMISSION_DENIED` - Insufficient file permissions

#### System Errors
- `INTERNAL_ERROR` - Internal server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

## 🚦 Rate Limiting

### Rate Limit Headers
All API responses include rate limiting headers:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1622025600
X-RateLimit-Window: 900
```

### Rate Limit Response
When rate limit is exceeded:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Try again later.",
    "retryAfter": 300,
    "limit": 1000,
    "window": 900
  }
}
```

### Rate Limit Tiers
- **Authentication**: 10 requests/minute
- **Device Management**: 100 requests/15 minutes
- **Command Execution**: 50 requests/minute
- **File Operations**: 20 requests/minute
- **System APIs**: 200 requests/15 minutes

## 📝 API Examples

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

class BeastAPIClient {
  constructor(baseURL, token = null) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (token) {
      this.setToken(token);
    }
  }

  setToken(token) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async login(username, password) {
    const response = await this.client.post('/auth/login', {
      username,
      password
    });
    
    if (response.data.success) {
      this.setToken(response.data.data.token);
    }
    
    return response.data;
  }

  async getDevices(filters = {}) {
    const response = await this.client.get('/devices', {
      params: filters
    });
    return response.data;
  }

  async executeCommand(deviceId, action, command, options = {}) {
    const response = await this.client.post(`/devices/${deviceId}/command`, {
      action,
      command,
      ...options
    });
    return response.data;
  }

  async uploadFile(deviceId, file, destination) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('destination', destination);

    const response = await this.client.post(`/devices/${deviceId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  }
}

// Usage
const api = new BeastAPIClient('http://localhost:3000/api');

async function example() {
  // Login
  await api.login('admin', 'password');
  
  // Get devices
  const devices = await api.getDevices({ status: 'online' });
  console.log('Online devices:', devices.data.devices.length);
  
  // Execute command
  const command = await api.executeCommand('device-001', 'shell', 'uptime');
  console.log('Command output:', command.data.output);
}
```

### Python Example

```python
import requests
import json

class BeastAPIClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        
        if token:
            self.set_token(token)
    
    def set_token(self, token):
        self.session.headers.update({'Authorization': f'Bearer {token}'})
    
    def login(self, username, password):
        response = self.session.post(f'{self.base_url}/auth/login', json={
            'username': username,
            'password': password
        })
        
        data = response.json()
        if data.get('success'):
            self.set_token(data['data']['token'])
        
        return data
    
    def get_devices(self, **filters):
        response = self.session.get(f'{self.base_url}/devices', params=filters)
        return response.json()
    
    def execute_command(self, device_id, action, command, **options):
        payload = {'action': action, 'command': command, **options}
        response = self.session.post(f'{self.base_url}/devices/{device_id}/command', json=payload)
        return response.json()

# Usage
api = BeastAPIClient('http://localhost:3000/api')

# Login
api.login('admin', 'password')

# Get devices
devices = api.get_devices(status='online')
print(f"Online devices: {len(devices['data']['devices'])}")

# Execute command
command = api.execute_command('device-001', 'shell', 'uptime')
print(f"Command output: {command['data']['output']}")
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Get devices
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"

# Execute command
curl -X POST http://localhost:3000/api/devices/device-001/command \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"shell","command":"uptime"}'

# Upload file
curl -X POST http://localhost:3000/api/devices/device-001/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@local-file.txt" \
  -F "destination=/tmp/remote-file.txt"

# Download file
curl -X POST http://localhost:3000/api/devices/device-001/download \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"/var/log/system.log"}'
```

---

## 📚 Related Documentation
- [Authentication System](07-SECURITY_SYSTEM.md)
- [WebSocket Communication](04-SYSTEM_ARCHITECTURE.md#websocket-communication)
- [File Operations](06-COMPONENTS_GUIDE.md#file-transfer-components)
- [Error Handling](14-TROUBLESHOOTING.md)

> **Next:** Learn about generated files in [Generated Files Guide](17-GENERATED_FILES.md)
