# 🛠️ Troubleshooting Guide - Harvard Remote System

## 📋 **Table of Contents**
1. [Quick Diagnostics](#quick-diagnostics)
2. [Connection Issues](#connection-issues)
3. [Server Problems](#server-problems)
4. [Android App Issues](#android-app-issues)
5. [Performance Problems](#performance-problems)
6. [Security Related Issues](#security-related-issues)
7. [Network Configuration Issues](#network-configuration-issues)
8. [Build and Deployment Issues](#build-and-deployment-issues)
9. [Common Error Messages](#common-error-messages)
10. [Recovery Procedures](#recovery-procedures)
11. [Diagnostic Tools](#diagnostic-tools)
12. [Getting Help](#getting-help)

---

## 🚨 **Quick Diagnostics**

### **System Health Check**
```bash
#!/bin/bash
# Quick diagnostic script

echo "🏥 Harvard Remote System - Health Check"
echo "======================================"

# Check server status
echo "🌐 Server Status:"
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding"
fi

# Check device connectivity
echo -e "\n📱 Connected Devices:"
adb devices | grep -v "List of devices"

# Check network connectivity
echo -e "\n🌐 Network Status:"
ping -c 1 google.com > /dev/null && echo "✅ Internet connectivity OK" || echo "❌ No internet connection"

# Check ports
echo -e "\n🔌 Port Status:"
netstat -tulpn | grep -E ":(3000|8080|8443)"

# Check logs for errors
echo -e "\n📝 Recent Errors:"
grep -i error /var/log/remote-system/*.log | tail -5
```

### **Essential Checks**
- ✅ Server running on correct port
- ✅ Android device has network connectivity
- ✅ Firewall allows required ports
- ✅ SSL certificates valid (if using HTTPS)
- ✅ Required permissions granted
- ✅ Sufficient disk space and memory

---

## 🔌 **Connection Issues**

### **Problem: Cannot Connect to Server**

#### **Symptoms:**
- App shows "Connection Failed"
- Timeout errors
- "Server unreachable" messages

#### **Solution Steps:**

**1. Verify Server URL**
```javascript
// Check server configuration
const config = {
  serverUrl: "ws://192.168.1.100:3000", // Use actual IP
  timeout: 5000,
  retryAttempts: 3
};

// Test connection
const WebSocket = require('ws');
const ws = new WebSocket(config.serverUrl);

ws.on('open', () => console.log('✅ Connection successful'));
ws.on('error', (error) => console.log('❌ Connection failed:', error));
```

**2. Network Connectivity Test**
```bash
# Test network connectivity
ping -c 4 192.168.1.100

# Test port accessibility
telnet 192.168.1.100 3000
nc -zv 192.168.1.100 3000

# Check if port is open
nmap -p 3000 192.168.1.100
```

**3. Firewall Configuration**
```bash
# Ubuntu/Debian
sudo ufw allow 3000
sudo ufw status

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload

# Windows
netsh advfirewall firewall add rule name="Remote System" dir=in action=allow protocol=TCP localport=3000
```

**4. Android Network Settings**
```kotlin
// Check network permissions in AndroidManifest.xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

// Network security config for development
<application
    android:networkSecurityConfig="@xml/network_security_config">
    
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">192.168.1.100</domain>
    </domain-config>
</network-security-config>
```

### **Problem: Intermittent Disconnections**

#### **Solutions:**
```javascript
// Implement reconnection logic
class ConnectionManager {
  constructor() {
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }
  
  connect() {
    this.ws = new WebSocket(this.serverUrl);
    
    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }
}
```

---

## 🖥️ **Server Problems**

### **Problem: Server Won't Start**

#### **Error Messages:**
- "EADDRINUSE: address already in use"
- "Permission denied"
- "Module not found"

#### **Solutions:**

**1. Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>

# Or use different port
export PORT=3001
node server.js
```

**2. Permission Issues**
```bash
# Run with sudo (not recommended for production)
sudo node server.js

# Better: Use port > 1024
export PORT=8080
node server.js

# Set up proper user permissions
sudo chown -R $USER:$USER /opt/remote-system
chmod +x server.js
```

**3. Missing Dependencies**
```bash
# Reinstall node modules
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Check for global dependencies
npm list -g --depth=0
```

### **Problem: Server Crashes Randomly**

#### **Debugging Steps:**
```bash
# Enable debug logging
DEBUG=* node server.js

# Use process manager
npm install -g pm2
pm2 start server.js --name remote-system
pm2 logs remote-system

# Monitor memory usage
pm2 monit
```

**Memory Leak Detection:**
```javascript
// Add memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
  });
}, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
```

---

## 📱 **Android App Issues**

### **Problem: App Crashes on Startup**

#### **Common Causes:**
- Missing permissions
- Network security configuration
- Compatibility issues

#### **Solutions:**

**1. Check Logs**
```bash
# View Android logs
adb logcat | grep -E "(RemoteSystem|AndroidRuntime|FATAL)"

# Filter by package
adb logcat | grep com.harvard.remotesystem
```

**2. Permission Issues**
```kotlin
// Runtime permission handling
class MainActivity : AppCompatActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Check permissions
        if (!hasRequiredPermissions()) {
            requestPermissions()
        }
    }
    
    private fun hasRequiredPermissions(): Boolean {
        val permissions = arrayOf(
            Manifest.permission.INTERNET,
            Manifest.permission.ACCESS_NETWORK_STATE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
        
        return permissions.all { 
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED 
        }
    }
}
```

**3. Compatibility Issues**
```gradle
// Update build.gradle
android {
    compileSdkVersion 33
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}
```

### **Problem: Service Not Starting**

#### **Solutions:**
```kotlin
// Service troubleshooting
class RemoteService : Service() {
    
    override fun onCreate() {
        super.onCreate()
        
        try {
            startForegroundService()
        } catch (e: Exception) {
            Log.e("RemoteService", "Failed to start service", e)
            // Fallback mechanism
            startAsBackgroundService()
        }
    }
    
    private fun startForegroundService() {
        val notification = createNotification()
        startForeground(NOTIFICATION_ID, notification)
    }
    
    private fun createNotification(): Notification {
        // Create notification channel for Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Remote System Service",
                NotificationManager.IMPORTANCE_LOW
            )
            notificationManager.createNotificationChannel(channel)
        }
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Remote System Running")
            .setSmallIcon(R.drawable.ic_notification)
            .build()
    }
}
```

---

## ⚡ **Performance Problems**

### **Problem: Slow Response Times**

#### **Diagnostic Tools:**
```bash
# Server performance monitoring
npm install -g clinic
clinic doctor -- node server.js

# Network latency testing
ping -c 10 server-ip
traceroute server-ip

# Database performance (if using)
EXPLAIN ANALYZE SELECT * FROM devices WHERE last_seen > NOW() - INTERVAL 1 HOUR;
```

#### **Optimization Solutions:**
```javascript
// Server-side caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

app.get('/api/devices', (req, res) => {
  const cacheKey = 'connected_devices';
  let devices = cache.get(cacheKey);
  
  if (!devices) {
    devices = getConnectedDevices();
    cache.set(cacheKey, devices);
  }
  
  res.json(devices);
});

// Connection pooling
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'remote_system'
});
```

### **Problem: High Memory Usage**

#### **Android App Optimization:**
```kotlin
// Memory leak prevention
class MainActivity : AppCompatActivity() {
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Clean up resources
        webSocketClient?.close()
        handler?.removeCallbacksAndMessages(null)
        unregisterReceivers()
    }
    
    private fun unregisterReceivers() {
        try {
            unregisterReceiver(networkReceiver)
        } catch (e: IllegalArgumentException) {
            // Receiver already unregistered
        }
    }
}

// Use weak references for callbacks
class WeakHandler(looper: Looper, callback: Handler.Callback) : Handler(looper) {
    private val weakCallback = WeakReference(callback)
    
    override fun handleMessage(msg: Message) {
        weakCallback.get()?.handleMessage(msg)
    }
}
```

---

## 🔒 **Security Related Issues**

### **Problem: SSL Certificate Errors**

#### **Solutions:**
```bash
# Generate new certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Check certificate validity
openssl x509 -in cert.pem -text -noout
openssl s_client -connect localhost:3000

# Update certificate in app
keytool -import -alias server-cert -file cert.pem -keystore app/src/main/res/raw/truststore.bks
```

### **Problem: Authentication Failures**

#### **Debug Authentication:**
```javascript
// Server-side debugging
app.use('/api', (req, res, next) => {
  console.log('Auth header:', req.headers.authorization);
  console.log('Session:', req.session);
  console.log('User:', req.user);
  next();
});

// JWT token validation
const jwt = require('jsonwebtoken');

function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token valid:', decoded);
    return decoded;
  } catch (error) {
    console.error('Token validation failed:', error.message);
    return null;
  }
}
```

---

## 🌐 **Network Configuration Issues**

### **Problem: Blocked by Corporate Firewall**

#### **Solutions:**
```bash
# Test alternative ports
curl -v http://server:8080/health
curl -v https://server:8443/health

# Use HTTPS/WSS
const server = https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app);

const wss = new WebSocket.Server({ server });
```

### **Problem: NAT/Router Issues**

#### **Port Forwarding Setup:**
```bash
# Check current port forwarding
netstat -tulpn | grep LISTEN

# Set up port forwarding (example for common routers)
# Router admin panel: 192.168.1.1
# Forward external port 3000 to internal IP:3000

# Test from external network
curl -v http://your-external-ip:3000/health
```

---

## 🏗️ **Build and Deployment Issues**

### **Problem: Gradle Build Failures**

#### **Common Solutions:**
```bash
# Clean and rebuild
./gradlew clean
./gradlew build

# Fix Gradle wrapper
./gradlew wrapper --gradle-version 7.5

# Clear Gradle cache
rm -rf ~/.gradle/caches
```

```gradle
// Fix common build issues in build.gradle
android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    
    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libjsc.so'
    }
}
```

### **Problem: APK Installation Failures**

#### **Solutions:**
```bash
# Check APK integrity
aapt dump badging app-debug.apk

# Install with verbose output
adb install -r -d app-debug.apk

# Check device storage
adb shell df /data

# Enable unknown sources
adb shell settings put global install_non_market_apps 1
```

---

## ⚠️ **Common Error Messages**

### **Server Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| `EADDRINUSE` | Port already in use | Kill process or use different port |
| `EACCES` | Permission denied | Run with proper permissions |
| `ENOTFOUND` | DNS resolution failed | Check hostname/IP address |
| `ECONNREFUSED` | Connection refused | Check if service is running |
| `MODULE_NOT_FOUND` | Missing dependency | Run `npm install` |

### **Android Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| `NetworkSecurityException` | HTTP blocked on Android 9+ | Use HTTPS or update security config |
| `SecurityException` | Missing permissions | Add permissions to manifest |
| `IllegalStateException` | Service lifecycle issue | Properly manage service state |
| `OutOfMemoryError` | Memory leak | Implement proper cleanup |
| `ConnectException` | Network unreachable | Check network connectivity |

### **Database Error Messages**

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Database not running | Start database service |
| `Access denied` | Wrong credentials | Check username/password |
| `Table doesn't exist` | Missing schema | Run database migrations |
| `Deadlock found` | Concurrent transactions | Implement retry logic |

---

## 🔧 **Recovery Procedures**

### **Complete System Reset**
```bash
#!/bin/bash
# Emergency reset script

echo "🚨 Emergency System Reset"
echo "========================"

# Stop all services
pm2 stop all
sudo systemctl stop remote-system

# Reset database
mysql -u root -p -e "DROP DATABASE IF EXISTS remote_system; CREATE DATABASE remote_system;"

# Clear logs
sudo rm -rf /var/log/remote-system/*

# Reset configuration
cp config/default.json.backup config/default.json

# Restart services
npm run setup
npm start

echo "✅ System reset complete"
```

### **Data Recovery**
```bash
# Backup current state
tar -czf backup-$(date +%Y%m%d_%H%M%S).tar.gz /opt/remote-system

# Restore from backup
tar -xzf backup-20231201_120000.tar.gz -C /

# Database recovery
mysqldump -u root -p remote_system > backup.sql
mysql -u root -p remote_system < backup.sql
```

---

## 🛠️ **Diagnostic Tools**

### **Network Diagnostics**
```bash
# Comprehensive network test
#!/bin/bash

echo "🌐 Network Diagnostic Report"
echo "============================"

# Basic connectivity
echo "1. Basic Connectivity:"
ping -c 3 8.8.8.8

# DNS resolution
echo -e "\n2. DNS Resolution:"
nslookup google.com

# Port scanning
echo -e "\n3. Port Status:"
nmap -p 3000,8080,8443 localhost

# WebSocket test
echo -e "\n4. WebSocket Test:"
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => { console.log('✅ WebSocket connection successful'); ws.close(); });
ws.on('error', (e) => { console.log('❌ WebSocket connection failed:', e.message); });
"
```

### **System Resource Monitor**
```bash
# Resource monitoring script
#!/bin/bash

echo "📊 System Resource Monitor"
echo "=========================="

# CPU usage
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5 $6 $7 $8}'

# Memory usage
echo -e "\nMemory Usage:"
free -h

# Disk usage
echo -e "\nDisk Usage:"
df -h

# Network connections
echo -e "\nNetwork Connections:"
netstat -tuln | grep LISTEN

# Process information
echo -e "\nRemote System Processes:"
ps aux | grep -E "(node|remote-system)" | grep -v grep
```

---

## 🆘 **Getting Help**

### **Log Collection**
```bash
# Automated log collection
#!/bin/bash

LOG_DIR="/tmp/remote-system-logs"
mkdir -p "$LOG_DIR"

# System logs
journalctl -u remote-system --since "1 hour ago" > "$LOG_DIR/system.log"

# Application logs
cp /var/log/remote-system/*.log "$LOG_DIR/"

# Android logs
adb logcat -d > "$LOG_DIR/android.log"

# System information
uname -a > "$LOG_DIR/system-info.txt"
cat /etc/os-release >> "$LOG_DIR/system-info.txt"

# Network configuration
ifconfig > "$LOG_DIR/network-config.txt"
netstat -rn >> "$LOG_DIR/network-config.txt"

# Create archive
tar -czf "remote-system-debug-$(date +%Y%m%d_%H%M%S).tar.gz" -C /tmp remote-system-logs

echo "📦 Debug package created: remote-system-debug-$(date +%Y%m%d_%H%M%S).tar.gz"
```

### **Support Checklist**

Before requesting help, ensure you have:

- [ ] **Error logs** - Complete error messages and stack traces
- [ ] **System information** - OS version, hardware specs
- [ ] **Configuration files** - Server config, Android manifest
- [ ] **Steps to reproduce** - Exact sequence of actions
- [ ] **Expected vs actual behavior** - What should happen vs what happens
- [ ] **Environment details** - Development vs production, network setup
- [ ] **Recent changes** - Any modifications made before issue occurred

### **Quick Reference Commands**

```bash
# Essential troubleshooting commands
alias rs-status='systemctl status remote-system'
alias rs-logs='journalctl -u remote-system -f'
alias rs-restart='sudo systemctl restart remote-system'
alias rs-health='curl -s http://localhost:3000/health | jq'
alias rs-devices='curl -s http://localhost:3000/api/devices | jq'
alias rs-debug='DEBUG=* node server.js'
```

---

## 📞 **Emergency Contacts**

### **Critical Issues**
- **Security Incidents**: Immediately disconnect affected devices
- **Data Breaches**: Follow incident response plan
- **System Compromise**: Isolate systems and contact security team

### **Escalation Path**
1. **Level 1**: Check this troubleshooting guide
2. **Level 2**: Review system logs and documentation
3. **Level 3**: Contact development team with debug package
4. **Level 4**: Engage senior technical staff for critical issues

---

**🎓 Academic Excellence:** This troubleshooting guide provides systematic problem-solving approaches essential for Computer Science students learning system administration and debugging methodologies.

*Remember: "A problem well-stated is a problem half-solved." - Charles Kettering*
