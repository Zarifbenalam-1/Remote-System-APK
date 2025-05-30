# 11. Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Environment Preparation](#environment-preparation)
4. [Production Server Deployment](#production-server-deployment)
5. [Cloud Platform Deployment](#cloud-platform-deployment)
6. [Container Deployment](#container-deployment)
7. [Mobile Application Distribution](#mobile-application-distribution)
8. [Configuration Management](#configuration-management)
9. [Security Hardening](#security-hardening)
10. [Monitoring and Logging](#monitoring-and-logging)
11. [Backup and Recovery](#backup-and-recovery)
12. [Scaling Strategies](#scaling-strategies)
13. [Maintenance Procedures](#maintenance-procedures)
14. [Rollback Procedures](#rollback-procedures)
15. [Performance Optimization](#performance-optimization)

## Overview

This deployment guide provides comprehensive instructions for deploying the Remote System APK project in production environments. The guide covers multiple deployment scenarios, from single-server setups to enterprise-scale distributed systems.

### Deployment Objectives
- **Reliability**: 99.9% uptime with automatic failover
- **Security**: End-to-end encryption and secure authentication
- **Scalability**: Handle 1000+ concurrent connections
- **Maintainability**: Easy updates and configuration changes
- **Monitoring**: Comprehensive logging and alerting

### Supported Platforms
- **Cloud Providers**: AWS, Google Cloud, Azure, DigitalOcean
- **Container Platforms**: Docker, Kubernetes, Docker Swarm
- **Operating Systems**: Ubuntu 20.04+, CentOS 8+, Amazon Linux 2
- **Mobile Platforms**: Google Play Store, Enterprise Distribution

## Deployment Architecture

### Production Architecture Overview
```
[Load Balancer] → [Application Servers] → [Database]
      ↓                    ↓                 ↓
[Monitoring]      [File Storage]      [Backup System]
      ↓                    ↓                 ↓
[Alerting]        [CDN/Cache]        [Log Aggregation]
```

### Component Responsibilities
| Component | Purpose | High Availability |
|-----------|---------|-------------------|
| Load Balancer | Traffic distribution, SSL termination | Active-Passive |
| Application Servers | Core business logic | Auto-scaling group |
| Database | Data persistence | Master-Slave replication |
| File Storage | Upload/download handling | Distributed storage |
| Monitoring | System health tracking | Redundant collectors |
| Cache Layer | Performance optimization | Redis cluster |

### Network Architecture
```
Internet → [Firewall] → [DMZ] → [Internal Network]
              ↓           ↓           ↓
          [WAF]     [Load Balancer] [App Servers]
              ↓           ↓           ↓
          [Logs]    [Health Checks] [Database]
```

## Environment Preparation

### System Requirements

#### Minimum Production Requirements
```yaml
Server Specifications:
  CPU: 4 cores (2.4GHz)
  RAM: 8GB
  Storage: 100GB SSD
  Network: 1Gbps
  OS: Ubuntu 20.04 LTS

Database Server:
  CPU: 2 cores (2.4GHz)
  RAM: 4GB
  Storage: 50GB SSD (with backup)
  
Load Balancer:
  CPU: 2 cores
  RAM: 2GB
  Storage: 20GB
```

#### Recommended Production Requirements
```yaml
Application Servers (3x):
  CPU: 8 cores (3.0GHz)
  RAM: 16GB
  Storage: 200GB SSD
  Network: 10Gbps

Database Cluster:
  Master: 8 cores, 32GB RAM, 500GB SSD
  Slave: 4 cores, 16GB RAM, 500GB SSD
  
Load Balancer (2x):
  CPU: 4 cores
  RAM: 8GB
  Storage: 50GB SSD
```

### Pre-deployment Checklist

#### Infrastructure Setup
- [ ] Provision servers with required specifications
- [ ] Configure network security groups/firewalls
- [ ] Set up DNS records and SSL certificates
- [ ] Establish backup storage locations
- [ ] Configure monitoring infrastructure
- [ ] Set up log aggregation systems

#### Security Configuration
- [ ] Generate and distribute SSH keys
- [ ] Configure fail2ban and intrusion detection
- [ ] Set up VPN access for administrative tasks
- [ ] Configure database encryption at rest
- [ ] Implement network segmentation
- [ ] Set up secret management system

#### Dependency Installation
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy
sudo apt install -y nginx

# Install Redis for caching
sudo apt install -y redis-server

# Install monitoring tools
sudo apt install -y htop iotop nethogs
```

## Production Server Deployment

### Single Server Deployment

#### Step 1: Server Preparation
```bash
# Create application user
sudo useradd -m -s /bin/bash remoteapp
sudo usermod -aG sudo remoteapp

# Create application directories
sudo mkdir -p /opt/remote-system
sudo chown remoteapp:remoteapp /opt/remote-system

# Switch to application user
sudo su - remoteapp
```

#### Step 2: Application Deployment
```bash
# Clone repository
cd /opt/remote-system
git clone https://github.com/your-org/Remote-System-APK.git .

# Install dependencies
cd SERVER/simple-server
npm install --production

# Copy configuration files
cp config/config.example.js config/config.js
# Edit configuration as needed
nano config/config.js
```

#### Step 3: Process Management Setup
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'remote-system-server',
    script: 'server.js',
    cwd: '/opt/remote-system/SERVER/simple-server',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/remote-system/error.log',
    out_file: '/var/log/remote-system/access.log',
    log_file: '/var/log/remote-system/combined.log',
    time: true
  }]
};
EOF

# Create log directory
sudo mkdir -p /var/log/remote-system
sudo chown remoteapp:remoteapp /var/log/remote-system

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 4: Reverse Proxy Configuration
```bash
# Configure nginx
sudo tee /etc/nginx/sites-available/remote-system << 'EOF'
upstream remote_system {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://remote_system;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # File upload endpoint
    location /upload {
        client_max_body_size 100M;
        proxy_pass http://remote_system;
        proxy_request_buffering off;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://remote_system;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/remote-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Multi-Server Deployment

#### Load Balancer Setup (HAProxy)
```bash
# Install HAProxy
sudo apt install -y haproxy

# Configure HAProxy
sudo tee /etc/haproxy/haproxy.cfg << 'EOF'
global
    daemon
    maxconn 4096
    
defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    
frontend remote_system_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/your-domain.pem
    redirect scheme https if !{ ssl_fc }
    
    # ACLs for routing
    acl is_api path_beg /api
    acl is_upload path_beg /upload
    
    # Backend selection
    use_backend api_servers if is_api
    use_backend upload_servers if is_upload
    default_backend web_servers
    
backend web_servers
    balance roundrobin
    option httpchk GET /health
    server web1 10.0.1.10:3000 check
    server web2 10.0.1.11:3000 check
    server web3 10.0.1.12:3000 check
    
backend api_servers
    balance leastconn
    option httpchk GET /api/health
    server api1 10.0.1.10:3000 check
    server api2 10.0.1.11:3000 check
    
backend upload_servers
    balance source
    option httpchk GET /health
    server upload1 10.0.1.10:3000 check
    server upload2 10.0.1.11:3000 check
    
listen stats
    bind *:8080
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE
EOF

# Start HAProxy
sudo systemctl enable haproxy
sudo systemctl start haproxy
```

#### Database Cluster Setup
```bash
# Master Database Configuration
sudo tee /etc/mysql/mysql.conf.d/master.cnf << 'EOF'
[mysqld]
server-id = 1
log-bin = /var/log/mysql/mysql-bin.log
binlog-do-db = remote_system
bind-address = 0.0.0.0

# Performance tuning
innodb_buffer_pool_size = 4G
innodb_log_file_size = 512M
max_connections = 1000
query_cache_size = 256M
EOF

# Slave Database Configuration
sudo tee /etc/mysql/mysql.conf.d/slave.cnf << 'EOF'
[mysqld]
server-id = 2
relay-log = /var/log/mysql/relay-log
log-bin = /var/log/mysql/mysql-bin.log
binlog-do-db = remote_system
read-only = 1
EOF

# Create replication user
mysql -u root -p << 'EOF'
CREATE USER 'replication'@'%' IDENTIFIED BY 'SecureReplicationPassword123!';
GRANT REPLICATION SLAVE ON *.* TO 'replication'@'%';
FLUSH PRIVILEGES;
SHOW MASTER STATUS;
EOF
```

## Cloud Platform Deployment

### AWS Deployment

#### Infrastructure as Code (Terraform)
```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "remote-system-vpc"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "private-subnet-${count.index + 1}"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "remote-system-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  
  tags = {
    Name = "remote-system-alb"
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "remote-system-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3
  
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "remote-system-instance"
    propagate_at_launch = true
  }
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier             = "remote-system-db"
  engine                 = "mysql"
  engine_version         = "8.0"
  instance_class         = "db.t3.medium"
  allocated_storage      = 100
  storage_type           = "gp2"
  storage_encrypted      = true
  
  db_name  = "remote_system"
  username = "admin"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name = "remote-system-db"
  }
}
```

#### Deployment Script
```bash
#!/bin/bash
# deploy-aws.sh

set -e

echo "Starting AWS deployment..."

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars"

# Apply infrastructure
terraform apply -var-file="production.tfvars" -auto-approve

# Get outputs
ALB_DNS=$(terraform output -raw alb_dns_name)
DB_ENDPOINT=$(terraform output -raw db_endpoint)

echo "Infrastructure deployed successfully!"
echo "Load Balancer: $ALB_DNS"
echo "Database: $DB_ENDPOINT"

# Deploy application code
aws s3 cp deployment-package.zip s3://remote-system-deployments/
aws autoscaling start-instance-refresh \
    --auto-scaling-group-name remote-system-asg \
    --preferences '{"InstanceWarmup": 300, "MinHealthyPercentage": 50}'

echo "Application deployment initiated!"
```

### Google Cloud Platform Deployment

#### Kubernetes Deployment
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: remote-system-app
  labels:
    app: remote-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: remote-system
  template:
    metadata:
      labels:
        app: remote-system
    spec:
      containers:
      - name: remote-system
        image: gcr.io/your-project/remote-system:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: remote-system-service
spec:
  selector:
    app: remote-system
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: remote-system-ingress
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "remote-system-ip"
    networking.gke.io/managed-certificates: "remote-system-cert"
spec:
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /*
        pathType: ImplementationSpecific
        backend:
          service:
            name: remote-system-service
            port:
              number: 80
```

## Container Deployment

### Docker Deployment

#### Multi-stage Dockerfile
```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY SERVER/simple-server/package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs SERVER/simple-server/ ./

# Set non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

#### Docker Compose Production Setup
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    image: remote-system:latest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=database
      - REDIS_HOST=redis
    depends_on:
      - database
      - redis
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "node", "healthcheck.js"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

  database:
    image: mysql:8.0
    restart: unless-stopped
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
      - MYSQL_DATABASE=remote_system
      - MYSQL_USER=${DB_USER}
      - MYSQL_PASSWORD=${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - app-network
    command: --default-authentication-plugin=mysql_native_password

  redis:
    image: redis:alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    networks:
      - app-network

volumes:
  db-data:
    driver: local
  redis-data:
    driver: local

networks:
  app-network:
    driver: bridge
```

### Kubernetes Deployment

#### Helm Chart Values
```yaml
# values.prod.yaml
replicaCount: 3

image:
  repository: your-registry/remote-system
  tag: "latest"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: your-domain.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: remote-system-tls
      hosts:
        - your-domain.com

resources:
  limits:
    cpu: 1000m
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

persistence:
  enabled: true
  storageClass: "fast-ssd"
  size: 10Gi

mysql:
  enabled: true
  auth:
    rootPassword: "SecureRootPassword123!"
    database: "remote_system"
    username: "app_user"
    password: "SecureAppPassword123!"
  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "fast-ssd"

redis:
  enabled: true
  auth:
    enabled: true
    password: "SecureRedisPassword123!"
  master:
    persistence:
      enabled: true
      size: 10Gi
```

## Mobile Application Distribution

### Google Play Store Distribution

#### Preparation Checklist
- [ ] App signing key generated and secured
- [ ] App Bundle built and tested
- [ ] Store listing content prepared
- [ ] Privacy policy published
- [ ] Terms of service created
- [ ] Content rating completed
- [ ] Target API level requirements met

#### Play Console Configuration
```bash
# Build release APK
cd APK
./gradlew assembleRelease

# Generate App Bundle
./gradlew bundleRelease

# Sign with release key
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore release-key.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  remote-system-key

# Align APK
zipalign -v 4 app-release-unsigned.apk app-release.apk
```

### Enterprise Distribution

#### Internal Distribution Setup
```bash
# Create enterprise distribution package
mkdir -p dist/enterprise

# Copy APK
cp APK/app/build/outputs/apk/release/app-release.apk \
   dist/enterprise/RemoteSystem-v1.0.0.apk

# Generate installation instructions
cat > dist/enterprise/INSTALL.md << 'EOF'
# Remote System APK - Enterprise Installation

## Requirements
- Android 7.0 (API level 24) or higher
- 50MB available storage
- Internet connection for initial setup

## Installation Steps
1. Enable "Unknown Sources" in Android Settings
2. Download RemoteSystem-v1.0.0.apk
3. Tap the APK file to install
4. Grant necessary permissions
5. Launch and configure server connection

## Configuration
- Server URL: https://your-company-server.com
- Authentication: Use company credentials
- Support: it-support@your-company.com
EOF

# Create distribution package
tar -czf RemoteSystem-Enterprise-v1.0.0.tar.gz \
    -C dist/enterprise .
```

## Configuration Management

### Environment Configuration

#### Production Environment Variables
```bash
# /opt/remote-system/.env.production
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=prod-db-cluster.region.rds.amazonaws.com
DB_PORT=3306
DB_NAME=remote_system
DB_USER=app_user
DB_PASSWORD=SecureDbPassword123!
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis Configuration
REDIS_HOST=prod-redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=SecureRedisPassword123!
REDIS_DB=0

# Security Configuration
JWT_SECRET=SuperSecureJWTSecret123!WithManyCharacters
ENCRYPTION_KEY=32CharacterEncryptionKey123456789
SESSION_SECRET=SecureSessionSecret123!

# API Configuration
API_RATE_LIMIT=100
MAX_FILE_SIZE=100MB
UPLOAD_TIMEOUT=300000

# Monitoring Configuration
LOG_LEVEL=warn
ENABLE_METRICS=true
METRICS_PORT=9090

# External Services
NOTIFICATION_SERVICE_URL=https://notifications.company.com
AUDIT_LOG_ENDPOINT=https://audit.company.com/api/logs
```

#### Configuration Validation
```javascript
// config/validator.js
const Joi = require('joi');

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  
  // Database
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().alphanum().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(12).required(),
  
  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  ENCRYPTION_KEY: Joi.string().length(32).required(),
  
  // Rate limiting
  API_RATE_LIMIT: Joi.number().min(1).max(1000).default(100),
  MAX_FILE_SIZE: Joi.string().regex(/^\d+[KMGT]?B$/).default('10MB')
});

function validateConfig() {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: false
  });
  
  if (error) {
    throw new Error(`Configuration validation failed: ${error.message}`);
  }
  
  return value;
}

module.exports = { validateConfig };
```

### Secret Management

#### HashiCorp Vault Integration
```javascript
// utils/secrets.js
const vault = require('node-vault');

class SecretManager {
  constructor() {
    this.client = vault({
      apiVersion: 'v1',
      endpoint: process.env.VAULT_ENDPOINT,
      token: process.env.VAULT_TOKEN
    });
  }
  
  async getSecret(path) {
    try {
      const result = await this.client.read(path);
      return result.data;
    } catch (error) {
      console.error(`Failed to retrieve secret from ${path}:`, error);
      throw error;
    }
  }
  
  async getDatabaseCredentials() {
    const secrets = await this.getSecret('secret/database');
    return {
      host: secrets.host,
      username: secrets.username,
      password: secrets.password
    };
  }
  
  async rotateSecret(path, newValue) {
    try {
      await this.client.write(path, newValue);
      console.log(`Secret at ${path} rotated successfully`);
    } catch (error) {
      console.error(`Failed to rotate secret at ${path}:`, error);
      throw error;
    }
  }
}

module.exports = SecretManager;
```

## Security Hardening

### System Security

#### Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw reset
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if needed)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (internal only)
sudo ufw allow from 10.0.0.0/8 to any port 3000

# Enable firewall
sudo ufw enable
```

#### SSL/TLS Configuration
```bash
# Generate SSL certificate with Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Set up automatic renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Security Headers
```nginx
# nginx security configuration
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

### Application Security

#### Input Validation Middleware
```javascript
// middleware/security.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: message });
    }
  });
};

// Input sanitization
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validator.escape(req.body[key]);
      }
    }
  }
  next();
};

// Security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = {
  apiRateLimit: createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'),
  uploadRateLimit: createRateLimit(15 * 60 * 1000, 10, 'Too many upload requests'),
  sanitizeInput,
  securityHeaders
};
```

## Monitoring and Logging

### Application Monitoring

#### Prometheus Metrics
```javascript
// utils/metrics.js
const promClient = require('prom-client');

// Create metrics registry
const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const fileUploadsTotal = new promClient.Counter({
  name: 'file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['status']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(fileUploadsTotal);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  activeConnections,
  fileUploadsTotal
};
```

#### Health Check Endpoints
```javascript
// routes/health.js
const express = require('express');
const mysql = require('mysql2/promise');
const redis = require('redis');
const { register } = require('../utils/metrics');

const router = express.Router();

// Basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0'
  });
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Database check
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    await connection.execute('SELECT 1');
    await connection.end();
    health.checks.database = { status: 'ok' };
  } catch (error) {
    health.status = 'error';
    health.checks.database = { status: 'error', message: error.message };
  }

  // Redis check
  try {
    const client = redis.createClient({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });
    await client.ping();
    await client.quit();
    health.checks.redis = { status: 'ok' };
  } catch (error) {
    health.status = 'error';
    health.checks.redis = { status: 'error', message: error.message };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
  health.checks.memory = {
    status: memUsageMB < 1000 ? 'ok' : 'warning',
    usage: `${memUsageMB}MB`
  };

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// Readiness check
router.get('/ready', async (req, res) => {
  // Check if application is ready to receive traffic
  const ready = {
    status: 'ready',
    timestamp: new Date().toISOString()
  };

  res.status(200).json(ready);
});

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

module.exports = router;
```

### Log Management

#### Structured Logging
```javascript
// utils/logger.js
const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      stack,
      ...meta
    });
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'remote-system',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // File transport for errors
    new winston.transports.File({
      filename: path.join('/var/log/remote-system', 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: path.join('/var/log/remote-system', 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10
    }),
    
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join('/var/log/remote-system', 'exceptions.log')
    })
  ]
});

// Security event logger
const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: {
    service: 'remote-system-security',
    type: 'security'
  },
  transports: [
    new winston.transports.File({
      filename: path.join('/var/log/remote-system', 'security.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

module.exports = { logger, securityLogger };
```

## Backup and Recovery

### Database Backup Strategy

#### Automated Backup Script
```bash
#!/bin/bash
# backup-database.sh

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-backup_user}"
DB_PASSWORD="${DB_PASSWORD}"
DB_NAME="${DB_NAME:-remote_system}"
BACKUP_DIR="/var/backups/mysql"
RETENTION_DAYS=30
S3_BUCKET="your-backup-bucket"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/remote_system_$TIMESTAMP.sql.gz"

echo "Starting database backup..."

# Create database dump
mysqldump \
  --host="$DB_HOST" \
  --user="$DB_USER" \
  --password="$DB_PASSWORD" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --set-gtid-purged=OFF \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "Database backup created: $BACKUP_FILE"

# Upload to S3
if command -v aws &> /dev/null; then
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/database/"
  echo "Backup uploaded to S3"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "remote_system_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Old backups cleaned up"

# Verify backup integrity
echo "Verifying backup integrity..."
if gzip -t "$BACKUP_FILE"; then
  echo "Backup integrity verified"
else
  echo "ERROR: Backup integrity check failed!"
  exit 1
fi

echo "Backup completed successfully"
```

#### Point-in-Time Recovery
```bash
#!/bin/bash
# restore-database.sh

set -e

BACKUP_FILE="$1"
TARGET_DB="${2:-remote_system_restore}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file> [target_database]"
  exit 1
fi

echo "Starting database restore..."

# Create target database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $TARGET_DB;"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | mysql -u root -p "$TARGET_DB"
else
  mysql -u root -p "$TARGET_DB" < "$BACKUP_FILE"
fi

echo "Database restored to $TARGET_DB"

# Verify restore
TABLES=$(mysql -u root -p -e "USE $TARGET_DB; SHOW TABLES;" | wc -l)
echo "Restored database contains $((TABLES - 1)) tables"
```

### Application Data Backup

#### File System Backup
```bash
#!/bin/bash
# backup-files.sh

set -e

APP_DIR="/opt/remote-system"
UPLOAD_DIR="/var/uploads/remote-system"
BACKUP_DIR="/var/backups/files"
RETENTION_DAYS=7
S3_BUCKET="your-backup-bucket"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/files_$TIMESTAMP.tar.gz"

echo "Starting file backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create compressed archive
tar -czf "$BACKUP_FILE" \
  --exclude="$APP_DIR/node_modules" \
  --exclude="$APP_DIR/.git" \
  --exclude="$APP_DIR/logs" \
  -C / \
  "opt/remote-system" \
  "var/uploads/remote-system"

echo "File backup created: $BACKUP_FILE"

# Upload to S3
if command -v aws &> /dev/null; then
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/files/"
  echo "File backup uploaded to S3"
fi

# Clean up old backups
find "$BACKUP_DIR" -name "files_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "File backup completed successfully"
```

### Disaster Recovery Plan

#### Recovery Procedures
1. **Database Recovery**
   - Restore from latest backup
   - Apply binary logs for point-in-time recovery
   - Verify data integrity

2. **Application Recovery**
   - Deploy from version control
   - Restore configuration files
   - Restart services

3. **File Recovery**
   - Restore uploaded files from backup
   - Verify file permissions
   - Update file paths if necessary

#### Recovery Testing
```bash
#!/bin/bash
# test-recovery.sh

set -e

echo "Starting disaster recovery test..."

# Test database restore
echo "Testing database restore..."
./restore-database.sh /var/backups/mysql/latest.sql.gz test_restore
mysql -u root -p -e "SELECT COUNT(*) FROM test_restore.users;"

# Test application deployment
echo "Testing application deployment..."
cd /tmp
git clone https://github.com/your-org/Remote-System-APK.git test-deploy
cd test-deploy/SERVER/simple-server
npm install
npm test

echo "Recovery test completed successfully"
```

## Scaling Strategies

### Horizontal Scaling

#### Auto Scaling Configuration
```yaml
# autoscaling.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: remote-system-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: remote-system-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

#### Load Balancer Configuration
```nginx
# Advanced nginx load balancing
upstream backend {
    least_conn;
    
    server 10.0.1.10:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 weight=3 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 weight=2 max_fails=3 fail_timeout=30s;
    
    # Backup server
    server 10.0.1.20:3000 backup;
    
    keepalive 32;
}

# Connection pooling
upstream backend_pool {
    keepalive_requests 1000;
    keepalive_timeout 60s;
    
    server 10.0.1.10:3000;
    server 10.0.1.11:3000;
    server 10.0.1.12:3000;
}
```

### Database Scaling

#### Read Replica Setup
```sql
-- Create read-only user
CREATE USER 'readonly'@'%' IDENTIFIED BY 'ReadOnlyPassword123!';
GRANT SELECT ON remote_system.* TO 'readonly'@'%';
FLUSH PRIVILEGES;

-- Configure read replica routing
-- In application code:
```

```javascript
// Database connection pooling
const mysql = require('mysql2/promise');

const masterPool = mysql.createPool({
  host: process.env.DB_MASTER_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000
});

const slavePool = mysql.createPool({
  host: process.env.DB_SLAVE_HOST,
  user: 'readonly',
  password: process.env.DB_READONLY_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 50,
  acquireTimeout: 60000,
  timeout: 60000
});

class DatabaseService {
  async executeRead(query, params = []) {
    const connection = await slavePool.getConnection();
    try {
      const [rows] = await connection.execute(query, params);
      return rows;
    } finally {
      connection.release();
    }
  }
  
  async executeWrite(query, params = []) {
    const connection = await masterPool.getConnection();
    try {
      const [result] = await connection.execute(query, params);
      return result;
    } finally {
      connection.release();
    }
  }
}

module.exports = DatabaseService;
```

### Caching Strategy

#### Redis Cluster Setup
```bash
# Create Redis cluster
redis-cli --cluster create \
  10.0.1.10:7000 10.0.1.11:7000 10.0.1.12:7000 \
  10.0.1.10:7001 10.0.1.11:7001 10.0.1.12:7001 \
  --cluster-replicas 1
```

#### Application Caching
```javascript
// Cache service implementation
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = redis.createCluster({
      rootNodes: [
        { url: 'redis://10.0.1.10:7000' },
        { url: 'redis://10.0.1.11:7000' },
        { url: 'redis://10.0.1.12:7000' }
      ],
      defaults: {
        password: process.env.REDIS_PASSWORD
      }
    });
  }
  
  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }
  
  async set(key, value, ttl = 3600) {
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
  
  async invalidatePattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

module.exports = CacheService;
```

## Maintenance Procedures

### Regular Maintenance Tasks

#### Weekly Maintenance Script
```bash
#!/bin/bash
# weekly-maintenance.sh

set -e

echo "Starting weekly maintenance..."

# Update system packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Clean up logs
echo "Cleaning up old logs..."
find /var/log/remote-system -name "*.log" -mtime +30 -delete
journalctl --vacuum-time=30d

# Database maintenance
echo "Running database maintenance..."
mysql -u root -p << 'EOF'
OPTIMIZE TABLE remote_system.users;
OPTIMIZE TABLE remote_system.sessions;
OPTIMIZE TABLE remote_system.files;
ANALYZE TABLE remote_system.users;
ANALYZE TABLE remote_system.sessions;
ANALYZE TABLE remote_system.files;
EOF

# Clean up temporary files
echo "Cleaning up temporary files..."
find /tmp -name "remote-system-*" -mtime +7 -delete
find /var/uploads/remote-system -name "temp_*" -mtime +1 -delete

# Restart services if needed
echo "Checking service health..."
pm2 restart all --update-env

# Update SSL certificates
echo "Updating SSL certificates..."
sudo certbot renew --quiet

echo "Weekly maintenance completed"
```

#### Daily Health Checks
```bash
#!/bin/bash
# daily-health-check.sh

set -e

echo "Starting daily health check..."

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
  echo "WARNING: Disk usage is at ${DISK_USAGE}%"
  # Send alert
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 85 ]; then
  echo "WARNING: Memory usage is at ${MEMORY_USAGE}%"
fi

# Check service status
if ! pm2 list | grep -q "online"; then
  echo "ERROR: Some services are not running"
  pm2 restart all
fi

# Check database connectivity
if ! mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -e "SELECT 1" > /dev/null 2>&1; then
  echo "ERROR: Database connectivity failed"
fi

# Check Redis connectivity
if ! redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
  echo "ERROR: Redis connectivity failed"
fi

echo "Daily health check completed"
```

### Update Procedures

#### Application Update Process
```bash
#!/bin/bash
# update-application.sh

set -e

NEW_VERSION="$1"
if [ -z "$NEW_VERSION" ]; then
  echo "Usage: $0 <version>"
  exit 1
fi

echo "Starting application update to version $NEW_VERSION..."

# Create backup
echo "Creating backup..."
./backup-database.sh
./backup-files.sh

# Download new version
echo "Downloading new version..."
cd /tmp
wget "https://github.com/your-org/Remote-System-APK/archive/v${NEW_VERSION}.tar.gz"
tar -xzf "v${NEW_VERSION}.tar.gz"

# Test new version
echo "Testing new version..."
cd "Remote-System-APK-${NEW_VERSION}/SERVER/simple-server"
npm install
npm test

# Stop current application
echo "Stopping current application..."
pm2 stop all

# Update application files
echo "Updating application files..."
rsync -av --exclude=node_modules \
  "/tmp/Remote-System-APK-${NEW_VERSION}/SERVER/simple-server/" \
  "/opt/remote-system/SERVER/simple-server/"

# Install dependencies
cd /opt/remote-system/SERVER/simple-server
npm install --production

# Run database migrations
echo "Running database migrations..."
npm run migrate

# Start application
echo "Starting application..."
pm2 start ecosystem.config.js

# Verify deployment
echo "Verifying deployment..."
sleep 30
curl -f http://localhost:3000/health || {
  echo "Health check failed, rolling back..."
  pm2 stop all
  # Restore from backup
  exit 1
}

echo "Application updated successfully to version $NEW_VERSION"
```

## Rollback Procedures

### Automated Rollback

#### Rollback Script
```bash
#!/bin/bash
# rollback-deployment.sh

set -e

BACKUP_VERSION="$1"
if [ -z "$BACKUP_VERSION" ]; then
  echo "Usage: $0 <backup_version>"
  exit 1
fi

echo "Starting rollback to version $BACKUP_VERSION..."

# Stop current application
pm2 stop all

# Restore application files
echo "Restoring application files..."
tar -xzf "/var/backups/files/files_${BACKUP_VERSION}.tar.gz" -C /

# Restore database
echo "Restoring database..."
./restore-database.sh "/var/backups/mysql/remote_system_${BACKUP_VERSION}.sql.gz"

# Install dependencies
cd /opt/remote-system/SERVER/simple-server
npm install --production

# Start application
pm2 start ecosystem.config.js

# Verify rollback
sleep 30
curl -f http://localhost:3000/health || {
  echo "Rollback verification failed!"
  exit 1
}

echo "Rollback completed successfully"
```

### Blue-Green Deployment

#### Blue-Green Switch Script
```bash
#!/bin/bash
# blue-green-switch.sh

set -e

CURRENT_ENV=$(cat /etc/nginx/current-env)
if [ "$CURRENT_ENV" = "blue" ]; then
  NEW_ENV="green"
  OLD_ENV="blue"
else
  NEW_ENV="blue"
  OLD_ENV="green"
fi

echo "Switching from $OLD_ENV to $NEW_ENV environment..."

# Update nginx configuration
sudo ln -sf "/etc/nginx/sites-available/remote-system-$NEW_ENV" \
            "/etc/nginx/sites-enabled/remote-system"

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Update current environment marker
echo "$NEW_ENV" | sudo tee /etc/nginx/current-env

# Wait for traffic to drain
sleep 30

# Stop old environment
pm2 stop "ecosystem-$OLD_ENV.config.js"

echo "Successfully switched to $NEW_ENV environment"
```

## Performance Optimization

### Application Performance

#### Performance Monitoring
```javascript
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url } = req;
    const { statusCode } = res;
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        url,
        statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Update metrics
    httpRequestDuration
      .labels(method, url, statusCode)
      .observe(duration / 1000);
      
    httpRequestsTotal
      .labels(method, url, statusCode)
      .inc();
  });
  
  next();
};

module.exports = performanceMonitor;
```

#### Database Query Optimization
```javascript
// Query optimization service
class QueryOptimizer {
  constructor(database) {
    this.db = database;
    this.queryCache = new Map();
  }
  
  async executeOptimized(query, params = []) {
    const queryKey = this.generateQueryKey(query, params);
    
    // Check cache first
    if (this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.result;
      }
    }
    
    const start = Date.now();
    const result = await this.db.execute(query, params);
    const duration = Date.now() - start;
    
    // Log slow queries
    if (duration > 500) {
      logger.warn('Slow query detected', {
        query,
        params,
        duration
      });
    }
    
    // Cache result if appropriate
    if (this.isCacheable(query)) {
      this.queryCache.set(queryKey, {
        result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
  
  generateQueryKey(query, params) {
    return `${query}:${JSON.stringify(params)}`;
  }
  
  isCacheable(query) {
    return query.toLowerCase().startsWith('select') &&
           !query.toLowerCase().includes('now()') &&
           !query.toLowerCase().includes('rand()');
  }
}

module.exports = QueryOptimizer;
```

### Infrastructure Optimization

#### CDN Configuration
```nginx
# CDN-optimized nginx configuration
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header X-Content-Type-Options nosniff;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/css application/javascript image/svg+xml;
    
    # Enable brotli if available
    brotli on;
    brotli_comp_level 6;
    brotli_types text/css application/javascript image/svg+xml;
}

# API response optimization
location /api/ {
    # Enable gzip for API responses
    gzip on;
    gzip_types application/json;
    
    # Add caching headers for appropriate endpoints
    location ~* /api/(users|settings) {
        expires 5m;
        add_header Cache-Control "private, must-revalidate";
    }
}
```

This comprehensive deployment guide provides detailed instructions for deploying the Remote System APK project in production environments, covering everything from single-server setups to enterprise-scale distributed systems. The guide includes security hardening, monitoring, backup strategies, and performance optimization techniques suitable for Harvard-level academic documentation.
