# API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

### JWT Token Authentication
Most API endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### WebSocket Authentication
WebSocket connections require authentication in the handshake:

```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## REST API Endpoints

### Health & Monitoring Endpoints

#### GET `/health`
**Description**: Basic health check for load balancers
**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-05-26T10:30:00.000Z",
  "uptime": 3600.123,
  "memory": {
    "rss": 52428800,
    "heapTotal": 25165824,
    "heapUsed": 18874368,
    "external": 1048576
  },
  "version": "1.0.0",
  "connections": {
    "devices": 5,
    "clients": 2,
    "total": 7
  },
  "services": {
    "redis": true,
    "monitoring": true
  }
}
```

**Status Codes**:
- `200`: Healthy
- `503`: Unhealthy (high load or service issues)

#### GET `/health/detailed`
**Description**: Comprehensive health information for monitoring systems
**Authentication**: None required

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-05-26T10:30:00.000Z",
  "server": {
    "uptime": 3600.123,
    "memory": {
      "rss": 52428800,
      "heapTotal": 25165824,
      "heapUsed": 18874368,
      "external": 1048576
    },
    "cpu": {
      "user": 1000000,
      "system": 500000
    },
    "version": "1.0.0",
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  },
  "connections": {
    "devices": {
      "total": 5,
      "online": 5,
      "capabilities": {
        "screen_share": 3,
        "file_transfer": 5,
        "remote_control": 4
      }
    },
    "clients": {
      "total": 2,
      "types": {
        "windows": 2
      }
    },
    "health": {
      "healthyConnections": 7,
      "lastHealthCheck": "2025-05-26T10:30:00.000Z"
    }
  },
  "services": {
    "redis": {
      "connected": true,
      "queues": {
        "commands": {
          "active": 0,
          "waiting": 2,
          "completed": 150,
          "failed": 3
        },
        "files": {
          "active": 1,
          "waiting": 0,
          "completed": 45,
          "failed": 1
        }
      }
    },
    "circuitBreakers": {
      "redis": {
        "state": "closed",
        "isOpen": false,
        "stats": {
          "fires": 245,
          "successes": 240,
          "failures": 5,
          "rejects": 0,
          "timeouts": 0
        }
      }
    },
    "monitoring": {
      "metricsCollected": true,
      "lastUpdate": "2025-05-26T10:30:00.000Z"
    }
  },
  "performance": {
    "averageResponseTime": 45.6,
    "errorRate": 0.02,
    "throughput": 125.5
  }
}
```

#### GET `/metrics`
**Description**: Prometheus metrics for monitoring
**Authentication**: None required
**Content-Type**: `text/plain`

**Response**: Prometheus metrics format
```
# HELP rds_connected_devices_total Total number of connected Android devices
# TYPE rds_connected_devices_total gauge
rds_connected_devices_total 5

# HELP rds_connected_clients_total Total number of connected Windows clients
# TYPE rds_connected_clients_total gauge
rds_connected_clients_total 2

# HELP rds_commands_processed_total Total number of commands processed
# TYPE rds_commands_processed_total counter
rds_commands_processed_total{command_type="screenshot",status="success"} 45
rds_commands_processed_total{command_type="file_download",status="success"} 12
```

#### GET `/ready`
**Description**: Load balancer readiness check
**Authentication**: None required

**Response**:
```json
{
  "status": "ready",
  "timestamp": "2025-05-26T10:30:00.000Z",
  "capacity": {
    "devices": "5/1000",
    "clients": 2
  }
}
```

**Status Codes**:
- `200`: Ready to accept traffic
- `503`: Not ready (at capacity or services unavailable)

### Information Endpoints

#### GET `/`
**Description**: Server information and capabilities
**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "server": "Remote Device Management Server",
  "version": "1.0.0",
  "description": "Production-grade standalone relay server for Android-Windows remote control",
  "uptime": 3600.123,
  "stats": {
    "connectedDevices": 5,
    "connectedClients": 2,
    "totalSessions": 7,
    "maxCapacity": 1000
  },
  "features": {
    "authentication": true,
    "rateLimit": true,
    "monitoring": true,
    "circuitBreaker": true,
    "messageQueue": true,
    "fileUpload": true,
    "clustering": true,
    "cdn": false,
    "autoScaling": false
  },
  "endpoints": {
    "health": "/health",
    "detailedHealth": "/health/detailed",
    "metrics": "/metrics",
    "ready": "/ready",
    "status": "/api/status",
    "devices": "/api/devices",
    "upload": "/api/upload",
    "download": "/uploads/:filename"
  },
  "websocket": {
    "enabled": true,
    "authentication": "JWT + Device/Client tokens",
    "events": ["device_register", "client_register", "device_command", "stream_data"]
  },
  "security": {
    "rateLimit": {
      "windowMs": 900000,
      "maxRequests": 100
    },
    "fileUpload": {
      "maxSize": 52428800,
      "allowedTypes": ["image/*", "video/*", "audio/*", "application/pdf", "text/*"]
    }
  },
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

### Authentication Endpoints

#### POST `/api/auth/device-token`
**Description**: Generate authentication token for Android devices
**Authentication**: None required (public endpoint)

**Request Body**:
```json
{
  "deviceId": "android-device-001",
  "deviceInfo": {
    "name": "Samsung Galaxy S21",
    "model": "SM-G991B",
    "androidVersion": "12",
    "capabilities": ["screen_share", "file_transfer", "remote_control"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d",
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

#### POST `/api/auth/client-token`
**Description**: Generate authentication token for Windows clients
**Authentication**: None required (public endpoint)

**Request Body**:
```json
{
  "clientId": "windows-client-001",
  "clientInfo": {
    "name": "Windows Desktop",
    "type": "windows",
    "version": "11"
  }
}
```

**Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "30d",
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

### Device Management Endpoints

#### GET `/api/devices`
**Description**: List all connected Android devices
**Authentication**: JWT token required

**Response**:
```json
{
  "success": true,
  "devices": [
    {
      "id": "device-uuid-001",
      "name": "Samsung Galaxy S21",
      "model": "SM-G991B",
      "androidVersion": "12",
      "status": "online",
      "capabilities": ["screen_share", "file_transfer", "remote_control"],
      "connectedAt": "2025-05-26T09:15:30.000Z",
      "lastHealthCheck": 1716715800000
    }
  ],
  "count": 1,
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

#### GET `/api/status`
**Description**: Server status and comprehensive statistics
**Authentication**: JWT token required

**Response**:
```json
{
  "success": true,
  "server": "Remote Device Management Server",
  "version": "1.0.0",
  "uptime": 3600.123,
  "status": "operational",
  "stats": {
    "devices": {
      "total": 5,
      "online": 5,
      "capabilities": {
        "screen_share": 3,
        "file_transfer": 5,
        "remote_control": 4
      }
    },
    "clients": {
      "total": 2,
      "types": {
        "windows": 2
      }
    },
    "health": {
      "healthyConnections": 7,
      "lastHealthCheck": "2025-05-26T10:30:00.000Z"
    }
  },
  "performance": {
    "averageResponseTime": 45.6,
    "errorRate": 0.02,
    "throughput": 125.5
  },
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

### File Management Endpoints

#### POST `/api/upload`
**Description**: Upload files to the server
**Authentication**: JWT token required
**Rate Limit**: 10 requests per 15 minutes per IP

**Request**: Multipart form data
- `file`: The file to upload (max 50MB)

**Response**:
```json
{
  "success": true,
  "filename": "1716715800000-document.pdf",
  "originalName": "document.pdf",
  "size": 1048576,
  "path": "/uploads/1716715800000-document.pdf",
  "uploadedBy": "user-uuid-001",
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

**Error Responses**:
```json
{
  "success": false,
  "error": "File too large",
  "maxSize": "50MB"
}
```

```json
{
  "success": false,
  "error": "File type image/svg+xml not allowed"
}
```

#### GET `/uploads/:filename`
**Description**: Download uploaded files
**Authentication**: JWT token required

**Parameters**:
- `filename` (path): Name of the file to download

**Response**: File download (binary data)

**Error Response**:
```json
{
  "success": false,
  "error": "File not found"
}
```

## WebSocket API

### Connection
```javascript
const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events from Client to Server

#### Device Registration (Android)

**Event**: `device_register`

**Data**:
```json
{
  "deviceToken": "device-specific-token",
  "name": "Samsung Galaxy S21",
  "model": "SM-G991B",
  "androidVersion": "12",
  "ipAddress": "192.168.1.100",
  "capabilities": ["screen_share", "file_transfer", "remote_control"]
}
```

**Server Response**: `device_registered`
```json
{
  "deviceId": "device-uuid-001",
  "message": "Device registered successfully",
  "serverTime": "2025-05-26T10:30:00.000Z",
  "features": {
    "authentication": true,
    "rateLimit": true,
    "monitoring": true
  }
}
```

**Error Response**: `registration_error`
```json
{
  "error": "Device token required",
  "code": "MISSING_TOKEN"
}
```

#### Client Registration (Windows)

**Event**: `client_register`

**Data**:
```json
{
  "clientToken": "client-specific-token",
  "name": "Windows Desktop",
  "type": "windows",
  "version": "11"
}
```

**Server Response**: `client_registered`
```json
{
  "clientId": "client-uuid-001",
  "message": "Client registered successfully",
  "serverTime": "2025-05-26T10:30:00.000Z",
  "features": {
    "authentication": true,
    "rateLimit": true,
    "monitoring": true
  }
}
```

#### Send Command to Device

**Event**: `device_command`

**Data**:
```json
{
  "deviceId": "device-uuid-001",
  "command": {
    "action": "screenshot",
    "parameters": {
      "quality": 80,
      "format": "png"
    }
  }
}
```

**Error Response**: `command_error`
```json
{
  "error": "Device not found or offline",
  "deviceId": "device-uuid-001",
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

#### Send Response to Client (Device)

**Event**: `device_response`

**Data**:
```json
{
  "clientSocketId": "client-socket-id",
  "command": "screenshot",
  "success": true,
  "data": {
    "image": "base64-encoded-image-data",
    "timestamp": "2025-05-26T10:30:00.000Z"
  }
}
```

#### File Stream

**Event**: `file_stream`

**Data**:
```json
{
  "clientSocketId": "client-socket-id",
  "fileName": "document.pdf",
  "fileSize": 1048576,
  "chunk": 1,
  "totalChunks": 10,
  "data": "base64-encoded-chunk-data"
}
```

#### Live Stream Data

**Event**: `stream_data`

**Data**:
```json
{
  "streamType": "screen",
  "data": "base64-encoded-frame-data",
  "timestamp": "2025-05-26T10:30:00.000Z",
  "frameNumber": 1234
}
```

#### Request Device List

**Event**: `get_devices`

**Data**: None

**Server Response**: `device_list`
```json
{
  "devices": [
    {
      "id": "device-uuid-001",
      "name": "Samsung Galaxy S21",
      "model": "SM-G991B",
      "androidVersion": "12",
      "status": "online",
      "capabilities": ["screen_share", "file_transfer", "remote_control"],
      "connectedAt": "2025-05-26T09:15:30.000Z",
      "lastHealthCheck": 1716715800000
    }
  ],
  "count": 1,
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

#### Health Check Response

**Event**: `health_check_response`

**Data**:
```json
{
  "responseTime": 45,
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

#### Ping

**Event**: `ping`

**Data**: None

**Server Response**: `pong`
```json
{
  "timestamp": 1716715800000
}
```

### Events from Server to Client

#### Device Connected

**Event**: `device_connected`

**Data**:
```json
{
  "id": "device-uuid-001",
  "name": "Samsung Galaxy S21",
  "model": "SM-G991B",
  "androidVersion": "12",
  "status": "online",
  "capabilities": ["screen_share", "file_transfer", "remote_control"],
  "connectedAt": "2025-05-26T10:30:00.000Z"
}
```

#### Device Disconnected

**Event**: `device_disconnected`

**Data**:
```json
{
  "deviceId": "device-uuid-001"
}
```

#### Health Check Request

**Event**: `health_check`

**Data**:
```json
{
  "timestamp": 1716715800000
}
```

#### File Error

**Event**: `file_error`

**Data**:
```json
{
  "error": "Invalid file data",
  "details": "File size exceeds maximum allowed"
}
```

#### General Error

**Event**: `error`

**Data**:
```json
{
  "message": "Failed to retrieve device list"
}
```

## Rate Limiting

### Default Limits
- **API endpoints**: 100 requests per 15 minutes per IP
- **File uploads**: 10 requests per 15 minutes per IP
- **WebSocket connections**: No specific limit (controlled by authentication)

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1716716400
```

### Rate Limit Exceeded Response
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

## Error Handling

### HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (valid token but insufficient permissions)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (health check failed)

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "requestId": "uuid-request-id",
  "timestamp": "2025-05-26T10:30:00.000Z"
}
```

### WebSocket Error Events
- `registration_error`: Device/client registration failed
- `command_error`: Command processing failed
- `file_error`: File operation failed
- `error`: General error

## Security Considerations

### HTTPS
Always use HTTPS in production environments.

### Token Security
- Store JWT tokens securely
- Implement token refresh mechanism for long-running applications
- Use appropriate expiry times for different token types

### CORS Configuration
Configure allowed origins appropriately for your environment:
```javascript
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### File Upload Security
- Only allowed file types can be uploaded
- File size is limited to 50MB by default
- Filenames are sanitized to prevent security issues
- Path traversal protection is implemented

### Rate Limiting
Adjust rate limits based on your application's needs and server capacity.

## Testing

### Health Check Example
```bash
curl -X GET http://localhost:3000/health
```

### Authentication Example
```bash
# Get device token
curl -X POST http://localhost:3000/api/auth/device-token \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test-device","deviceInfo":{"name":"Test Device"}}'

# Use token for API call
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer your-jwt-token"
```

### File Upload Example
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer your-jwt-token" \
  -F "file=@test-file.pdf"
```

### WebSocket Connection Example
```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Register as device
  socket.emit('device_register', {
    deviceToken: 'device-token',
    name: 'Test Device',
    capabilities: ['screen_share', 'file_transfer']
  });
});

socket.on('device_registered', (data) => {
  console.log('Device registered:', data);
});
```
