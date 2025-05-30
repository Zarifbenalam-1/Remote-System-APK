# 🌐 Network Configuration Guide

## 📋 **Table of Contents**
- [Overview](#overview)
- [Network Architecture](#network-architecture)
- [Port Configuration](#port-configuration)
- [Firewall Settings](#firewall-settings)
- [SSL/TLS Configuration](#ssltls-configuration)
- [Network Security](#network-security)
- [Load Balancing](#load-balancing)
- [VPN Integration](#vpn-integration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 **Overview**

This guide provides comprehensive network configuration instructions for the Harvard Remote System, covering security, performance, and scalability considerations for both development and production environments.

### **Key Network Components**
- **Android Client**: Mobile application connecting to server
- **Node.js Server**: Backend service handling connections
- **Load Balancer**: Distribution of client connections
- **Database**: Data persistence layer
- **Monitoring**: Network traffic analysis

---

## 🏗️ **Network Architecture**

### **Basic Architecture**
```
[Android Clients] 
       ↓
[Load Balancer/Reverse Proxy]
       ↓
[Node.js Server Cluster]
       ↓
[Database Server]
```

### **Advanced Architecture**
```
[Android Clients] → [CDN/Edge Locations]
       ↓
[WAF (Web Application Firewall)]
       ↓
[Load Balancer (HAProxy/NGINX)]
       ↓
[Node.js Server Cluster]
       ↓
[Database Cluster] + [Redis Cache]
       ↓
[Monitoring & Logging]
```

---

## 🔌 **Port Configuration**

### **Required Ports**

#### **Server Ports**
```yaml
# Primary Services
- 3000: Node.js Server (HTTP)
- 443: HTTPS/WSS (Production)
- 80: HTTP Redirect (Production)

# Database Ports
- 5432: PostgreSQL
- 27017: MongoDB
- 6379: Redis

# Monitoring Ports
- 9090: Prometheus
- 3001: Grafana
- 8080: Admin Panel

# Development Ports
- 3000: Development Server
- 35729: LiveReload
- 9229: Node.js Debugger
```

#### **Android Client Configuration**
```xml
<!-- res/values/network_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Production Configuration -->
    <string name="server_url_production">wss://your-domain.com</string>
    <integer name="server_port_production">443</integer>
    
    <!-- Development Configuration -->
    <string name="server_url_development">ws://192.168.1.100</string>
    <integer name="server_port_development">3000</integer>
    
    <!-- Connection Settings -->
    <integer name="connection_timeout_ms">30000</integer>
    <integer name="reconnection_attempts">5</integer>
    <integer name="heartbeat_interval_ms">25000</integer>
</resources>
```

---

## 🔥 **Firewall Settings**

### **Ubuntu/Debian (UFW)**
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Node.js Server
sudo ufw allow 3000/tcp

# Allow Database (restrict to local network)
sudo ufw allow from 192.168.1.0/24 to any port 5432
sudo ufw allow from 192.168.1.0/24 to any port 27017
sudo ufw allow from 192.168.1.0/24 to any port 6379

# Allow monitoring (restrict to admin IPs)
sudo ufw allow from 192.168.1.10 to any port 9090
sudo ufw allow from 192.168.1.10 to any port 3001

# Check status
sudo ufw status verbose
```

### **CentOS/RHEL (firewalld)**
```bash
# Start and enable firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow HTTP/HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Allow Node.js Server
sudo firewall-cmd --permanent --add-port=3000/tcp

# Create custom service for Node.js
sudo firewall-cmd --permanent --new-service=nodejs-server
sudo firewall-cmd --permanent --service=nodejs-server --set-description="Node.js Server"
sudo firewall-cmd --permanent --service=nodejs-server --add-port=3000/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### **AWS Security Groups**
```yaml
# security-group-web.yml
Resources:
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for web servers
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 3000
          ToPort: 3000
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/8  # Restrict SSH to VPC
```

---

## 🔒 **SSL/TLS Configuration**

### **SSL Certificate Setup**

#### **Let's Encrypt (Certbot)**
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

#### **Custom SSL Certificate**
```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr

# Generate self-signed certificate (development only)
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt
```

### **NGINX SSL Configuration**
```nginx
# /etc/nginx/sites-available/harvard-remote-system
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Routes
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static Files
    location / {
        root /var/www/html;
        try_files $uri $uri/ =404;
    }
}
```

### **Node.js HTTPS Configuration**
```javascript
// server.js - HTTPS Server Setup
const https = require('https');
const fs = require('fs');
const express = require('express');
const socketIo = require('socket.io');

const app = express();

// SSL Certificate Configuration
const sslOptions = {
    key: fs.readFileSync('/path/to/private.key'),
    cert: fs.readFileSync('/path/to/certificate.crt'),
    ca: fs.readFileSync('/path/to/ca_bundle.crt') // Optional
};

// Create HTTPS Server
const server = https.createServer(sslOptions, app);
const io = socketIo(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ["https://your-domain.com"],
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
});

// Start Server
const PORT = process.env.PORT || 443;
server.listen(PORT, () => {
    console.log(`Secure server running on port ${PORT}`);
});
```

---

## 🛡️ **Network Security**

### **Network Access Control**

#### **IP Whitelisting**
```javascript
// middleware/ipWhitelist.js
const ipWhitelist = (req, res, next) => {
    const allowedIPs = process.env.ALLOWED_IPS?.split(',') || [];
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
};

module.exports = ipWhitelist;
```

#### **Rate Limiting**
```javascript
// middleware/rateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
});

const limiter = rateLimit({
    store: new RedisStore({
        client: redisClient,
        prefix: 'rate_limit:'
    }),
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = limiter;
```

### **DDoS Protection**

#### **NGINX Rate Limiting**
```nginx
# /etc/nginx/nginx.conf
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=5r/s;
    
    # Connection limiting
    limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
    
    server {
        # Apply rate limits
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            limit_conn conn_limit_per_ip 10;
            proxy_pass http://backend;
        }
        
        location /socket.io/ {
            limit_req zone=websocket burst=10 nodelay;
            limit_conn conn_limit_per_ip 5;
            proxy_pass http://backend;
        }
    }
}
```

#### **Fail2Ban Configuration**
```ini
# /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200

[nodejs-api]
enabled = true
filter = nodejs-api
action = iptables-multiport[name=NodeJSAPI, port="3000", protocol=tcp]
logpath = /var/log/nodejs/error.log
maxretry = 5
findtime = 300
bantime = 1800
```

---

## ⚖️ **Load Balancing**

### **HAProxy Configuration**
```haproxy
# /etc/haproxy/haproxy.cfg
global
    daemon
    log stdout local0
    maxconn 4096
    ssl-default-bind-ciphers ECDHE+aRSA+AESGCM:ECDHE+aRSA+SHA384:ECDHE+aRSA+SHA256:AES256+EECDH:AES256+EDH:!aNULL
    ssl-default-bind-options ssl-min-ver TLSv1.2 no-tls-tickets

defaults
    mode http
    log global
    option httplog
    option dontlognull
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

# Frontend Configuration
frontend http_frontend
    bind *:80
    redirect scheme https code 301

frontend https_frontend
    bind *:443 ssl crt /etc/ssl/certs/harvard-remote-system.pem
    
    # WebSocket detection
    acl is_websocket hdr(Upgrade) -i websocket
    acl is_websocket_path path_beg /socket.io/
    
    # Route to appropriate backend
    use_backend websocket_backend if is_websocket or is_websocket_path
    default_backend api_backend

# Backend Configuration
backend api_backend
    balance roundrobin
    option httpchk GET /health
    
    server api1 127.0.0.1:3001 check
    server api2 127.0.0.1:3002 check
    server api3 127.0.0.1:3003 check

backend websocket_backend
    balance source
    option httpchk GET /socket.io/health
    
    server ws1 127.0.0.1:3001 check
    server ws2 127.0.0.1:3002 check
    server ws3 127.0.0.1:3003 check

# Statistics
stats enable
stats uri /haproxy-stats
stats refresh 30s
stats admin if TRUE
```

### **NGINX Load Balancer**
```nginx
# /etc/nginx/sites-available/load-balancer
upstream nodejs_backend {
    least_conn;
    server 127.0.0.1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:3003 weight=1 max_fails=3 fail_timeout=30s;
}

upstream websocket_backend {
    ip_hash;  # Sticky sessions for WebSocket
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # WebSocket Routes
    location /socket.io/ {
        proxy_pass http://websocket_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API Routes
    location /api/ {
        proxy_pass http://nodejs_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔐 **VPN Integration**

### **OpenVPN Server Setup**
```bash
# Install OpenVPN
sudo apt update
sudo apt install openvpn easy-rsa

# Setup CA
make-cadir ~/openvpn-ca
cd ~/openvpn-ca
source vars
./clean-all
./build-ca

# Generate server certificate
./build-key-server server

# Generate Diffie-Hellman parameters
./build-dh

# Generate client certificate
./build-key client1

# Configure OpenVPN server
sudo cp ~/openvpn-ca/keys/{server.crt,server.key,ca.crt,dh2048.pem} /etc/openvpn/
```

### **OpenVPN Server Configuration**
```conf
# /etc/openvpn/server.conf
port 1194
proto udp
dev tun

ca ca.crt
cert server.crt
key server.key
dh dh2048.pem

server 10.8.0.0 255.255.255.0
ifconfig-pool-persist ipp.txt

# Push routes to clients
push "route 192.168.1.0 255.255.255.0"
push "dhcp-option DNS 8.8.8.8"
push "dhcp-option DNS 8.8.4.4"

# Client-to-client communication
client-to-client

# Keepalive
keepalive 10 120

# Compression
comp-lzo

# User and group
user nobody
group nogroup

# Persistence
persist-key
persist-tun

# Logging
status openvpn-status.log
log-append /var/log/openvpn.log
verb 3
```

### **WireGuard Setup (Modern Alternative)**
```bash
# Install WireGuard
sudo apt install wireguard

# Generate server keys
wg genkey | sudo tee /etc/wireguard/private.key
sudo chmod go= /etc/wireguard/private.key
sudo cat /etc/wireguard/private.key | wg pubkey | sudo tee /etc/wireguard/public.key
```

```ini
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = [SERVER_PRIVATE_KEY]
Address = 10.0.0.1/24
ListenPort = 51820
SaveConfig = true

# Enable IP forwarding
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client configurations
[Peer]
PublicKey = [CLIENT_PUBLIC_KEY]
AllowedIPs = 10.0.0.2/32
```

---

## 🔧 **Network Monitoring**

### **Prometheus Network Metrics**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'nodejs-app'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

### **Grafana Network Dashboard**
```json
{
  "dashboard": {
    "title": "Network Performance",
    "panels": [
      {
        "title": "Network Traffic",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total[5m])",
            "legendFormat": "{{device}} - Received"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total[5m])",
            "legendFormat": "{{device}} - Transmitted"
          }
        ]
      },
      {
        "title": "Connection Count",
        "targets": [
          {
            "expr": "node_netstat_Tcp_CurrEstab",
            "legendFormat": "Established Connections"
          }
        ]
      }
    ]
  }
}
```

---

## 🔍 **Network Troubleshooting**

### **Common Network Issues**

#### **Connection Timeouts**
```bash
# Test connectivity
telnet your-domain.com 443
nc -zv your-domain.com 443

# Check DNS resolution
nslookup your-domain.com
dig your-domain.com

# Trace route
traceroute your-domain.com
mtr your-domain.com
```

#### **SSL/TLS Issues**
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
echo | openssl s_client -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
curl -I https://your-domain.com
```

#### **WebSocket Connection Issues**
```javascript
// Client-side debugging
const socket = io('wss://your-domain.com', {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
});

socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Disconnected:', reason);
});
```

### **Network Performance Testing**

#### **Bandwidth Testing**
```bash
# Install iperf3
sudo apt install iperf3

# Server mode
iperf3 -s

# Client mode
iperf3 -c server-ip -t 30 -P 4

# UDP testing
iperf3 -c server-ip -u -b 100M
```

#### **Load Testing**
```javascript
// artillery-load-test.yml
config:
  target: 'wss://your-domain.com'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "WebSocket Connection Test"
    weight: 100
    engine: ws
    beforeRequest: "setRandomId"
    flow:
      - connect:
          socketPath: "/socket.io/?EIO=4&transport=websocket"
      - send: '{"type":"message","data":"test"}'
      - wait: 2
      - disconnect
```

---

## 📈 **Performance Optimization**

### **TCP Tuning**
```bash
# /etc/sysctl.conf optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 8192

# Apply changes
sudo sysctl -p
```

### **NGINX Optimization**
```nginx
# Worker processes optimization
worker_processes auto;
worker_connections 4096;

# Buffer optimization
client_body_buffer_size 10K;
client_header_buffer_size 1k;
client_max_body_size 8m;
large_client_header_buffers 2 1k;

# Timeout optimization
client_body_timeout 12;
client_header_timeout 12;
keepalive_timeout 15;
send_timeout 10;

# Compression
gzip on;
gzip_comp_level 2;
gzip_min_length 1000;
gzip_proxied expired no-cache no-store private auth;
gzip_types text/plain application/xml text/css application/javascript;
```

---

## 🚨 **Security Best Practices**

### **Network Security Checklist**
- ✅ Enable HTTPS/WSS everywhere
- ✅ Use strong SSL/TLS configurations
- ✅ Implement rate limiting
- ✅ Configure firewall rules
- ✅ Enable DDoS protection
- ✅ Use VPN for admin access
- ✅ Monitor network traffic
- ✅ Regular security audits
- ✅ Keep systems updated
- ✅ Implement access logging

### **Security Headers**
```javascript
// Express.js security headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    next();
});
```

---

## 📚 **Additional Resources**

### **Network Documentation**
- [NGINX Configuration Guide](https://nginx.org/en/docs/)
- [HAProxy Documentation](http://www.haproxy.org/download/2.4/doc/configuration.txt)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [AWS VPC Guide](https://docs.aws.amazon.com/vpc/)

### **Security Resources**
- [OWASP Network Security](https://owasp.org/www-community/controls/Network_Intrusion_Detection)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Testing Tool](https://www.ssllabs.com/ssltest/)

---

**Network configuration is critical for security and performance. Always test configurations in a staging environment before applying to production.**

*This guide provides enterprise-grade network configuration for the Harvard Remote System project.*
