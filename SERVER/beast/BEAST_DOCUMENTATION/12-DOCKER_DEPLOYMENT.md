# 🐳 Docker Deployment Guide

Complete guide for deploying the BEAST using Docker containers for production and development.

## 📋 Table of Contents
- [Docker Overview](#docker-overview)
- [Single Container Deployment](#single-container-deployment)
- [Multi-Container with Docker Compose](#multi-container-with-docker-compose)
- [Production Docker Setup](#production-docker-setup)
- [Docker Swarm Deployment](#docker-swarm-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Docker Troubleshooting](#docker-troubleshooting)

## 🔧 Docker Overview

### Why Docker for BEAST?
- **Consistency**: Same environment across development, staging, and production
- **Scalability**: Easy horizontal scaling with container orchestration
- **Isolation**: Secure separation of components
- **Portability**: Deploy anywhere Docker runs

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 📦 Single Container Deployment

### Dockerfile
Create `Dockerfile` in the standalone-server directory:
```dockerfile
# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads logs temp

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "server.js"]
```

### Build and Run
```bash
# Build the image
docker build -t beast-server:latest .

# Run the container
docker run -d \
  --name beast-server \
  -p 3000:3000 \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-super-secret-jwt-key \
  beast-server:latest

# Check container status
docker ps
docker logs beast-server
```

### Environment Variables
```bash
# Run with environment file
docker run -d \
  --name beast-server \
  --env-file .env.production \
  -p 3000:3000 \
  beast-server:latest
```

## 🎼 Multi-Container with Docker Compose

### docker-compose.yml
```yaml
version: '3.8'

services:
  beast-server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: beast-server
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_ENABLED=true
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    env_file:
      - .env.production
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./config:/app/config
    depends_on:
      - redis
    networks:
      - beast-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: beast-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - beast-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: beast-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - beast-server
    networks:
      - beast-network

volumes:
  redis-data:
    driver: local

networks:
  beast-network:
    driver: bridge
```

### Redis Configuration
Create `redis.conf`:
```conf
# Redis configuration for BEAST
port 6379
bind 0.0.0.0
protected-mode yes
requirepass your-redis-password

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command EVAL ""
rename-command DEBUG ""
```

### Nginx Configuration
Create `nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream beast-backend {
        server beast-server:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=ws:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

        # API routes
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://beast-backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket routes
        location /socket.io/ {
            limit_req zone=ws burst=10 nodelay;
            proxy_pass http://beast-backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://beast-backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Deploy with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

## 🏭 Production Docker Setup

### Multi-stage Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

# Create necessary directories
RUN mkdir -p uploads logs temp && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
```

### Production Environment File
Create `.env.production`:
```env
# Production Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Security
JWT_SECRET=CHANGE_THIS_TO_SUPER_SECURE_SECRET
ENCRYPTION_KEY=CHANGE_THIS_TO_32_CHAR_SECRET_KEY

# Redis
REDIS_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# File Upload
MAX_FILE_SIZE=100MB
ALLOWED_FILE_TYPES=txt,log,json,xml,csv,pdf,doc,docx,zip

# Monitoring
ENABLE_HEALTH_CHECKS=true
HEALTH_CHECK_INTERVAL=30000

# Security Headers
ENABLE_SECURITY_HEADERS=true
ENABLE_CORS=false
CORS_ORIGIN=https://your-domain.com
```

### Docker Registry Deployment
```bash
# Tag for registry
docker tag beast-server:latest your-registry.com/beast-server:latest

# Push to registry
docker push your-registry.com/beast-server:latest

# Deploy from registry
docker pull your-registry.com/beast-server:latest
docker run -d --name beast-server your-registry.com/beast-server:latest
```

## 🐝 Docker Swarm Deployment

### Initialize Swarm
```bash
# Initialize swarm mode
docker swarm init

# Join worker nodes (run on worker machines)
docker swarm join --token SWMTKN-... manager-ip:2377
```

### Docker Stack File
Create `docker-stack.yml`:
```yaml
version: '3.8'

services:
  beast-server:
    image: beast-server:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    networks:
      - beast-network

  redis:
    image: redis:7-alpine
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
    volumes:
      - redis-data:/data
    networks:
      - beast-network

  nginx:
    image: nginx:alpine
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    networks:
      - beast-network

volumes:
  uploads:
    driver: local
  logs:
    driver: local
  redis-data:
    driver: local

networks:
  beast-network:
    driver: overlay
    attachable: true
```

### Deploy Stack
```bash
# Deploy the stack
docker stack deploy -c docker-stack.yml beast

# List services
docker service ls

# Scale service
docker service scale beast_beast-server=5

# Update service
docker service update --image beast-server:v2 beast_beast-server
```

## ☸️ Kubernetes Deployment

### Deployment YAML
Create `k8s-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: beast-server
  labels:
    app: beast-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: beast-server
  template:
    metadata:
      labels:
        app: beast-server
    spec:
      containers:
      - name: beast-server
        image: beast-server:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: REDIS_HOST
          value: "redis-service"
        envFrom:
        - secretRef:
            name: beast-secrets
        volumeMounts:
        - name: uploads
          mountPath: /app/uploads
        - name: logs
          mountPath: /app/logs
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: uploads
        persistentVolumeClaim:
          claimName: uploads-pvc
      - name: logs
        persistentVolumeClaim:
          claimName: logs-pvc

---
apiVersion: v1
kind: Service
metadata:
  name: beast-service
spec:
  selector:
    app: beast-server
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### Deploy to Kubernetes
```bash
# Create secrets
kubectl create secret generic beast-secrets \
  --from-env-file=.env.production

# Apply deployment
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods
kubectl get services

# Scale deployment
kubectl scale deployment beast-server --replicas=5
```

## 🔧 Docker Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker logs beast-server

# Check container status
docker ps -a

# Inspect container
docker inspect beast-server

# Execute shell in container
docker exec -it beast-server sh
```

#### Permission Issues
```bash
# Fix file permissions
docker exec -it beast-server chown -R node:node /app

# Run with different user
docker run --user $(id -u):$(id -g) beast-server
```

#### Network Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect beast-network

# Test connectivity
docker exec -it beast-server ping redis
```

#### Volume Issues
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect beast_uploads

# Remove unused volumes
docker volume prune
```

### Performance Monitoring
```bash
# Container stats
docker stats beast-server

# System resource usage
docker system df

# Container processes
docker exec -it beast-server ps aux
```

### Debugging Commands
```bash
# Enter container shell
docker exec -it beast-server /bin/sh

# Copy files from container
docker cp beast-server:/app/logs/app.log ./

# Copy files to container
docker cp ./config.json beast-server:/app/

# Check container environment
docker exec -it beast-server env
```

### Log Management
```bash
# View logs
docker logs beast-server

# Follow logs
docker logs -f beast-server

# Log rotation
docker run --log-driver=json-file --log-opt max-size=10m --log-opt max-file=3 beast-server
```

## 📊 Docker Monitoring

### Health Checks
```dockerfile
# Advanced health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health && \
      curl -f http://localhost:3000/api/status || exit 1
```

### Resource Limits
```yaml
# Docker Compose resource limits
services:
  beast-server:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Monitoring with Prometheus
```yaml
# Add Prometheus monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## 📚 Related Documentation
- [Installation Guide](03-INSTALLATION_GUIDE.md)
- [Local Deployment](10-LOCAL_DEPLOYMENT.md)
- [Configuration Guide](13-CONFIGURATION.md)
- [Monitoring & Logging](08-MONITORING_LOGGING.md)

> **Next:** Configure your deployment with [Configuration Guide](13-CONFIGURATION.md)
