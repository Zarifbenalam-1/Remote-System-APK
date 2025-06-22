# 🚀 GHOST SQUARED - DEPLOYMENT GUIDE

## 📋 **Quick Deployment Overview**

Ghost Squared provides multiple deployment options for different needs:

### 🎯 **Deployment Options**
1. **Development**: `./start-dev.sh` - Local development with hot reload
2. **Production**: `./deploy-production.sh` - Docker-based production deployment
3. **Cloud**: Render.com, Heroku, AWS, Google Cloud
4. **Process Manager**: PM2 for production server management

---

## 🗂️ **DEPLOYMENT CONFIGURATION FILES EXPLAINED**

### **1. `Dockerfile` - Container Configuration** 🐳
**Purpose**: Creates a containerized version of Ghost Squared for consistent deployment across any environment.

**What it does**:
- ✅ Uses Node.js 18 Alpine (lightweight Linux distribution)
- ✅ Sets up the application directory structure
- ✅ Installs only production dependencies (excludes dev tools)
- ✅ Creates proper user permissions and security layers
- ✅ Exposes port 3000 for web traffic
- ✅ Includes automated health checks for monitoring
- ✅ Configures automatic application startup

**Key Features**:
```dockerfile
FROM node:18-alpine          # Lightweight, secure base image
WORKDIR /app                 # Application directory
COPY package*.json ./        # Copy dependency files first (Docker layer caching)
RUN npm ci --only=production # Install production dependencies only
COPY . .                     # Copy application code
EXPOSE 3000                  # Expose web port
HEALTHCHECK --interval=30s   # Monitor application health
CMD ["node", "server.js"]    # Start the application
```

### **2. `docker-compose.yml` - Multi-Environment Orchestration** 🎼
**Purpose**: Manages development and production Docker environments with single commands.

**What it does**:
- ✅ **Development mode**: Live code reloading, volume mounting for instant changes
- ✅ **Production mode**: Optimized container without development tools
- ✅ **Networking**: Creates isolated network for secure communication
- ✅ **Health monitoring**: Automatic health checks and restart policies
- ✅ **Port mapping**: Maps container ports to host system
- ✅ **Environment separation**: Different configs for dev/prod

**Services Configuration**:
```yaml
# Development Service
ghost-squared:
  ports: ["3000:3000"]          # Development port
  volumes: [./SERVER/simple-server:/app]  # Live code mounting
  environment: [NODE_ENV=development]

# Production Service  
ghost-squared-prod:
  ports: ["8080:3000"]          # Production port
  environment: [NODE_ENV=production]
  restart: unless-stopped       # Auto-restart policy
```

### **3. `render.yaml` - Cloud Deployment Configuration** ☁️
**Purpose**: One-click deployment to Render.com cloud platform.

**Build Command**: `cd SERVER/simple-server && npm install`
**Start Command**: `cd SERVER/simple-server && node server.js`

**What it does**:
- ✅ Defines web service configuration for cloud deployment
- ✅ Sets up automated build and start commands
- ✅ Configures environment variables for cloud environment
- ✅ Sets up health check endpoints for monitoring
- ✅ Handles automatic scaling and zero-downtime deployment

**Configuration Details**:
```yaml
services:
  - type: web                    # Web service type
    name: ghost-squared          # Service name
    env: node                    # Node.js runtime
    buildCommand: cd SERVER/simple-server && npm install    # Build command
    startCommand: cd SERVER/simple-server && node server.js # Start command
    envVars:
      - key: NODE_ENV
        value: production        # Production environment
      - key: PORT
        value: 10000            # Render.com assigned port
    healthCheckPath: /api/status # Health monitoring endpoint
```

### **4. `ecosystem.config.json` - Process Management** ⚙️
**Purpose**: Production-grade process management with PM2.

**What it does**:
- ✅ **Cluster mode**: Runs multiple instances for high availability
- ✅ **Auto-restart**: Automatically restarts if the application crashes
- ✅ **Memory management**: Restarts if memory usage exceeds limits
- ✅ **Centralized logging**: Unified logging with timestamps
- ✅ **Load balancing**: Distributes traffic across multiple instances
- ✅ **Zero-downtime deployment**: Graceful restarts without service interruption

**PM2 Configuration**:
```json
{
  "apps": [{
    "name": "ghost-squared",
    "script": "server.js",
    "instances": "max",          # Use all CPU cores
    "exec_mode": "cluster",      # Cluster mode for load balancing
    "autorestart": true,         # Auto-restart on crashes
    "max_memory_restart": "1G"   # Restart if memory > 1GB
  }]
}
```

### **5. `deploy-production.sh` - Automated Production Deployment** 🚀
**Purpose**: One-command production deployment with comprehensive checks and setup.

**What it does**:
- ✅ **System verification**: Checks Docker and Docker Compose installation
- ✅ **Environment setup**: Creates necessary directories and permissions
- ✅ **Image building**: Builds optimized Docker image
- ✅ **Service deployment**: Starts production container with proper configuration
- ✅ **Health validation**: Performs health checks to ensure successful deployment
- ✅ **User guidance**: Provides status feedback and management commands

**Deployment Process**:
```bash
1. Check system requirements (Docker, Docker Compose)
2. Create directories (uploads/, logs/) with proper permissions
3. Build production Docker image
4. Start production container on port 8080
5. Wait for service to be ready
6. Perform health check (curl http://localhost:8080/api/status)
7. Provide management commands for ongoing operations
```

### **6. `start-dev.sh` - Development Environment Setup** 🔧
**Purpose**: Quick development environment setup and startup.

**What it does**:
- ✅ **Version verification**: Checks Node.js version requirements (16+)
- ✅ **Dependency management**: Automatically installs all dependencies
- ✅ **Directory creation**: Creates necessary directories (uploads/, logs/)
- ✅ **Permission setup**: Sets proper file and directory permissions
- ✅ **Configuration check**: Verifies Firebase configuration presence
- ✅ **Server startup**: Starts development server with live reload

**Development Features**:
```bash
1. Node.js version check (requires 16+)
2. npm install (all dependencies including dev tools)
3. Directory creation with proper permissions
4. Firebase configuration verification
5. Development server startup on port 3000
6. Live reload and debug mode enabled
```

### **7. `.env.example` - Environment Configuration Template** 📝
**Purpose**: Comprehensive template for environment variables and configuration.

**What it includes**:
- ✅ **Server configuration**: Port, environment, host settings
- ✅ **Firebase integration**: Complete Firebase service account setup
- ✅ **Security settings**: JWT secrets, encryption keys, session management
- ✅ **Database configuration**: PostgreSQL, Redis connection settings
- ✅ **File upload settings**: Upload paths, size limits, allowed types
- ✅ **Monitoring integration**: Sentry, logging, webhook configurations
- ✅ **Performance tuning**: Rate limiting, CORS, caching settings

**Configuration Categories**:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase (Device Communication)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret

# Performance & Monitoring
RATE_LIMIT_WINDOW=900000
LOG_LEVEL=info
```

### **8. Enhanced `package.json` - Project Management** 📦
**Purpose**: Centralized script management for all deployment scenarios.

**Enhanced Scripts**:
```json
{
  "scripts": {
    "start": "node server.js",                    # Production start
    "dev": "nodemon server.js",                   # Development with auto-reload
    "pm2:start": "pm2 start ecosystem.config.json", # PM2 cluster start
    "docker:build": "docker build -t ghost-squared .", # Docker image build
    "docker:compose": "docker-compose up -d",     # Docker Compose deployment
    "lint": "eslint .",                           # Code linting
    "test": "jest"                                # Testing
  }
}
```

---

## 🔧 **DEVELOPMENT DEPLOYMENT**

### **Using `start-dev.sh`**

#### **What it does:**
- ✅ Checks Node.js version (requires 16+)
- ✅ Installs all dependencies automatically
- ✅ Creates necessary directories (`uploads`, `logs`)
- ✅ Sets proper file permissions
- ✅ Checks for Firebase configuration
- ✅ Starts the development server with live reload

#### **Prerequisites:**
```bash
# Required:
- Node.js 16+ installed
- npm or yarn package manager
- Firebase service account JSON file (optional for basic testing)
```

#### **Step-by-Step Instructions:**

1. **Navigate to project root:**
```bash
cd /path/to/Remote-System-APK
```

2. **Make script executable (if not already):**
```bash
chmod +x start-dev.sh
```

3. **Run development deployment:**
```bash
./start-dev.sh
```

4. **What you'll see:**
```bash
🔧 Setting up Ghost Squared development environment...
📦 Installing dependencies...
⚠️  Firebase service account not found.
📋 Please add your firebase-service-account.json file to SERVER/simple-server/
🚀 Starting Ghost Squared development server...
🌐 Server will be available at: http://localhost:3000
🏠 Command Center: http://localhost:3000/ghost-squared-command-center.html

Press Ctrl+C to stop the server
```

5. **Access the application:**
- **Command Center**: http://localhost:3000/ghost-squared-command-center.html
- **API Status**: http://localhost:3000/api/status
- **Any module**: Navigate using the sidebar or feature cards

#### **Development Features:**
- 🔄 **Live Reload**: Changes to code are reflected immediately
- 📝 **Console Logging**: Detailed logs in terminal
- 🐛 **Debug Mode**: Full error messages and stack traces
- 🔧 **Easy Configuration**: Simple file-based configuration

---

## 🏭 **PRODUCTION DEPLOYMENT**

### **Using `deploy-production.sh`**

#### **What it does:**
- ✅ Checks Docker and Docker Compose installation
- ✅ Creates production directories and permissions
- ✅ Builds optimized Docker image
- ✅ Starts production container with proper configuration
- ✅ Performs health checks to ensure successful deployment
- ✅ Provides management commands for ongoing operations

#### **Prerequisites:**
```bash
# Required:
- Docker 20+ installed
- Docker Compose 2+ installed
- At least 1GB free disk space
- Port 8080 available (production runs on 8080, development on 3000)
```

#### **Step-by-Step Instructions:**

1. **Install Docker (if not installed):**
```bash
# Ubuntu/Debian:
sudo apt update && sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER

# macOS:
brew install --cask docker

# Windows:
# Download Docker Desktop from docker.com
```

2. **Navigate to project root:**
```bash
cd /path/to/Remote-System-APK
```

3. **Make script executable:**
```bash
chmod +x deploy-production.sh
```

4. **Run production deployment:**
```bash
./deploy-production.sh
```

5. **Deployment process output:**
```bash
🚀 Starting Ghost Squared deployment...
🏗️ Building Docker image...
[+] Building 45.2s (12/12) FINISHED
🚀 Starting Ghost Squared in production mode...
[+] Running 1/1
✅ ghost-squared-prod  Started
⏳ Waiting for service to be ready...
✅ Ghost Squared is running successfully!
🌐 Access the dashboard at: http://localhost:8080/ghost-squared-command-center.html
🎯 Deployment complete!

📊 Useful commands:
  View logs: docker-compose logs -f ghost-squared-prod
  Stop: docker-compose --profile production down
  Restart: docker-compose --profile production restart ghost-squared-prod
```

6. **Access production application:**
- **Command Center**: http://localhost:8080/ghost-squared-command-center.html
- **API Status**: http://localhost:8080/api/status

#### **Production Features:**
- 🔒 **Security**: Optimized security settings and minimal attack surface
- ⚡ **Performance**: Production-optimized build with better performance
- 🛡️ **Isolation**: Containerized environment prevents conflicts
- 📊 **Monitoring**: Built-in health checks and logging
- 🔄 **Auto-restart**: Automatic restart on failures
- 💾 **Persistent Data**: Data persists between container restarts

---

## 🎛️ **PRODUCTION MANAGEMENT COMMANDS**

### **Using Docker Compose:**

```bash
# View real-time logs
docker-compose logs -f ghost-squared-prod

# Stop the application
docker-compose --profile production down

# Restart the application
docker-compose --profile production restart ghost-squared-prod

# View running containers
docker-compose ps

# Update and redeploy
./deploy-production.sh

# Access container shell (for debugging)
docker-compose exec ghost-squared-prod sh
```

### **Using PM2 (Alternative Production Setup):**

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
cd SERVER/simple-server
npm run pm2:start

# View status
pm2 status

# View logs
pm2 logs ghost-squared

# Restart
pm2 restart ghost-squared

# Stop
pm2 stop ghost-squared
```

---

## ☁️ **CLOUD DEPLOYMENT**

### **Render.com (Recommended Cloud Option)** 🌟

Render.com provides seamless deployment with the included `render.yaml` configuration.

#### **Build and Run Commands for Render.com**:
- **Build Command**: `cd SERVER/simple-server && npm install`
- **Start Command**: `cd SERVER/simple-server && node server.js`
- **Health Check Path**: `/api/status`
- **Environment**: `node` (Node.js runtime)
- **Port**: `10000` (automatically assigned by Render)

#### **Step-by-Step Render.com Deployment**:

1. **Connect Repository to Render**:
   - Go to [render.com](https://render.com) and sign up/login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository containing Ghost Squared

2. **Automatic Configuration**:
   - Render will automatically detect the `render.yaml` file
   - The configuration will be applied automatically:
     ```yaml
     Build Command: cd SERVER/simple-server && npm install
     Start Command: cd SERVER/simple-server && node server.js
     Environment: Node.js
     Port: 10000 (automatically assigned by Render)
     Health Check: /api/status
     ```

3. **Set Environment Variables** (Optional but Recommended):
   ```env
   NODE_ENV=production
   PORT=10000
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_PRIVATE_KEY=your-firebase-private-key
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   SESSION_SECRET=your-session-secret
   JWT_SECRET=your-jwt-secret
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically:
     - Clone your repository
     - Run the build command
     - Start the application
     - Assign a public URL (e.g., `https://ghost-squared.onrender.com`)

5. **Access Your Application**:
   - **Command Center**: `https://your-app.onrender.com/ghost-squared-command-center.html`
   - **API Status**: `https://your-app.onrender.com/api/status`
   - **All Modules**: Navigate using the dashboard

#### **Render.com Features**:
- ✅ **Automatic HTTPS**: SSL certificates included
- ✅ **Custom Domains**: Add your own domain
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **Zero-downtime Deployment**: Seamless updates
- ✅ **Built-in Monitoring**: Health checks and metrics
- ✅ **Global CDN**: Fast content delivery worldwide

#### **Render.com Configuration Details**:
```yaml
# render.yaml contents
services:
  - type: web
    name: ghost-squared
    env: node
    buildCommand: cd SERVER/simple-server && npm install
    startCommand: cd SERVER/simple-server && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /api/status
```

### **Alternative Cloud Platforms**:

#### **Heroku Deployment**:
```bash
# Install Heroku CLI and login
npm install -g heroku
heroku login

# Create Heroku app
heroku create ghost-squared-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FIREBASE_PROJECT_ID=your-project-id

# Deploy
git push heroku main

# Open application
heroku open
```

#### **AWS/Google Cloud Deployment**:
Use the `Dockerfile` to deploy to any cloud container service:
```bash
# Build image
docker build -t ghost-squared .

# Tag for cloud registry
docker tag ghost-squared gcr.io/your-project/ghost-squared

# Push to cloud
docker push gcr.io/your-project/ghost-squared

# Deploy to cloud run/ECS/etc.
```

---

## 🔧 **CONFIGURATION**

### **Environment Variables:**
Copy `.env.example` to `.env` and configure:

```env
# Basic Configuration
PORT=3000
NODE_ENV=development

# Firebase (for device communication)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# Security
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-jwt-secret

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### **Firebase Setup:**
1. Go to Firebase Console
2. Create a new project or use existing
3. Generate service account key
4. Download JSON file
5. Place in `SERVER/simple-server/firebase-service-account.json`

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues:**

#### **Port Already in Use:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>

# Or use different port
PORT=3001 ./start-dev.sh
```

#### **Docker Permission Issues:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

#### **Node.js Version Issues:**
```bash
# Install/update Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### **Firebase Connection Issues:**
- Verify `firebase-service-account.json` exists
- Check Firebase project settings
- Ensure proper permissions in Firebase Console

### **Health Checks:**

```bash
# Check if server is responding
curl http://localhost:3000/api/status

# Check Docker container health
docker-compose ps

# View detailed logs
docker-compose logs ghost-squared-prod
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Log Files:**
- **Development**: Console output
- **Production Docker**: `docker-compose logs`
- **PM2**: `~/.pm2/logs/`

### **Performance Monitoring:**
```bash
# View container stats
docker stats

# View PM2 monitoring
pm2 monit

# Check disk usage
df -h
```

### **Updates:**
```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./deploy-production.sh

# Or for development
./start-dev.sh
```

---

## 🔨 **BUILD AND RUN COMMANDS REFERENCE**

### **For Render.com Cloud Deployment**:
```bash
# Build Command (installs dependencies):
cd SERVER/simple-server && npm install

# Start Command (runs the application):
cd SERVER/simple-server && node server.js

# Health Check Endpoint:
/api/status

# Environment:
node (Node.js runtime)

# Port:
10000 (automatically assigned by Render)
```

### **For Local Development**:
```bash
# Quick Start:
./start-dev.sh

# Manual Commands:
cd SERVER/simple-server
npm install
node server.js

# Development with Auto-reload:
npm run dev
```

### **For Production Deployment**:
```bash
# Docker-based Production:
./deploy-production.sh

# Manual Docker Commands:
docker-compose --profile production up -d

# PM2 Process Manager:
cd SERVER/simple-server
npm run pm2:start
```

### **Package.json Scripts Reference**:
```json
{
  "scripts": {
    "start": "node server.js",                    # Production start
    "dev": "nodemon server.js",                   # Development with auto-reload
    "pm2:start": "pm2 start ecosystem.config.json", # PM2 cluster mode
    "pm2:stop": "pm2 stop ghost-squared",         # Stop PM2 service
    "pm2:restart": "pm2 restart ghost-squared",   # Restart PM2 service
    "docker:build": "docker build -t ghost-squared .", # Build Docker image
    "docker:run": "docker run -p 3000:3000 ghost-squared", # Run Docker container
    "docker:compose": "docker-compose up -d",     # Docker Compose start
    "docker:stop": "docker-compose down"          # Docker Compose stop
  }
}
```
