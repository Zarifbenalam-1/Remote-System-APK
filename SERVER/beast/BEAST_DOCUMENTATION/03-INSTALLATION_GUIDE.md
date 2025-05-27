# 📦 Installation Guide - The Beast Setup Process

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Installation Methods](#installation-methods)
- [Dependency Installation](#dependency-installation)
- [Configuration Setup](#configuration-setup)
- [First Run Verification](#first-run-verification)
- [Troubleshooting Installation](#troubleshooting-installation)

## Prerequisites

### System Requirements
- **Node.js**: Version 16.x or higher (18.x recommended)
- **npm**: Version 8.x or higher
- **Memory**: Minimum 2GB RAM (4GB+ recommended for production)
- **Storage**: At least 1GB free space
- **Network**: Stable internet connection

### Optional (For Enhanced Features)
- **Redis**: For queue management and caching
- **Docker**: For containerized deployment
- **Git**: For version control and updates

## Environment Setup

### 1. Check Node.js Installation
```bash
node --version
npm --version
```

If Node.js is not installed:
- **Windows**: Download from [nodejs.org](https://nodejs.org)
- **macOS**: Use Homebrew: `brew install node`
- **Linux**: Use package manager: `sudo apt install nodejs npm`

### 2. Verify System Resources
```bash
# Check available memory
free -h

# Check disk space
df -h

# Check if ports are available
netstat -tulpn | grep :3000
netstat -tulpn | grep :8080
```

## Installation Methods

### Method 1: Direct Download (Recommended for Beginners)

1. **Download the Project**
```bash
# Clone from repository
git clone <repository-url>
cd Remote-System-Server
```

2. **Navigate to Server Directory**
```bash
cd standalone-server
```

3. **Install Dependencies**
```bash
npm install
```

### Method 2: Docker Installation (Advanced)

1. **Using Docker Compose**
```bash
# Navigate to project directory
cd Remote-System-Server/standalone-server

# Build and run with Docker
docker-compose up --build
```

### Method 3: Manual Setup

1. **Create Project Directory**
```bash
mkdir my-beast-server
cd my-beast-server
```

2. **Initialize npm Project**
```bash
npm init -y
```

3. **Install Required Dependencies**
```bash
npm install express socket.io multer helmet compression rate-limiting express-validator winston morgan cors dotenv bcryptjs jsonwebtoken bull redis crypto-js
```

## Dependency Installation

### Core Dependencies Explained

#### Essential Dependencies (Required)
```bash
npm install express                    # Web server framework
npm install socket.io                  # Real-time communication
npm install multer                     # File upload handling
npm install helmet                     # Security middleware
npm install compression                # Response compression
npm install rate-limiting              # Rate limiting protection
npm install express-validator          # Input validation
npm install winston                    # Logging system
npm install morgan                     # HTTP request logging
npm install cors                       # Cross-origin requests
npm install dotenv                     # Environment variables
```

#### Security Dependencies (Highly Recommended)
```bash
npm install bcryptjs                   # Password hashing
npm install jsonwebtoken              # JWT authentication
npm install crypto-js                 # Encryption utilities
```

#### Performance Dependencies (Optional but Recommended)
```bash
npm install bull                       # Queue management
npm install redis                     # Caching and sessions
```

### Development Dependencies (Optional)
```bash
npm install --save-dev nodemon        # Auto-restart during development
npm install --save-dev jest           # Testing framework
npm install --save-dev supertest      # API testing
```

## Configuration Setup

### 1. Environment Configuration

Create `.env` file in `standalone-server` directory:

```bash
# Navigate to server directory
cd standalone-server

# Create environment file
touch .env
```

Add the following configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-session-secret-change-this-too
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Redis Configuration (Optional)
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,txt,doc,docx

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=true
```

### 2. Directory Structure Creation

The Beast will automatically create necessary directories, but you can create them manually:

```bash
# Navigate to server directory
cd standalone-server

# Create required directories
mkdir -p uploads
mkdir -p logs
mkdir -p config
mkdir -p services
mkdir -p utils
mkdir -p middleware
```

### 3. Configuration Verification

Check if configuration is loaded correctly:

```bash
# Test configuration loading
node -e "console.log(require('./config/config.js'))"
```

## First Run Verification

### 1. Start the Beast

```bash
# Navigate to server directory
cd standalone-server

# Start the server
npm start
```

### 2. Verify Server Status

#### Check Console Output
Look for these success messages:
```
[INFO] Configuration loaded successfully
[INFO] Server starting on port 3000
[INFO] Socket.IO server initialized
[INFO] Authentication service initialized
[INFO] Monitoring service initialized
[INFO] Circuit breaker initialized
[INFO] Queue service initialized (or disabled)
[INFO] Beast Server is running on http://localhost:3000
[INFO] Dashboard available at http://localhost:3000
```

#### Test Server Response
Open another terminal and test:
```bash
# Test basic connectivity
curl http://localhost:3000

# Test API health
curl http://localhost:3000/api/health

# Test with browser
# Open: http://localhost:3000
```

### 3. Verify Generated Files

After first run, check these files were created:
```bash
# Check log files
ls -la logs/

# Check upload directory
ls -la uploads/

# Check if configuration is working
ls -la config/
```

## Troubleshooting Installation

### Common Installation Issues

#### 1. Port Already in Use
```bash
# Error: EADDRINUSE :::3000
# Solution: Change port in .env file or kill process
lsof -ti:3000 | xargs kill -9
```

#### 2. Permission Denied
```bash
# Error: EACCES permission denied
# Solution: Fix permissions
sudo chown -R $(whoami) ./
chmod 755 ./standalone-server
```

#### 3. Node Version Issues
```bash
# Error: Unsupported Node.js version
# Solution: Update Node.js
nvm install 18
nvm use 18
```

#### 4. npm Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 5. Missing Dependencies
```bash
# Error: Cannot find module 'xyz'
# Solution: Install missing dependency
npm install xyz
```

### Environment-Specific Issues

#### Windows Issues
```bash
# Use Windows-compatible commands
# Install windows-build-tools if needed
npm install --global windows-build-tools
```

#### macOS Issues
```bash
# Install Xcode command line tools
xcode-select --install
```

#### Linux Issues
```bash
# Install build essentials
sudo apt-get install build-essential
```

### Redis Connection Issues

If using Redis:
```bash
# Check Redis status
redis-cli ping

# Start Redis (if installed locally)
redis-server

# Or disable Redis in .env
REDIS_ENABLED=false
```

## Post-Installation Steps

### 1. Security Hardening

```bash
# Change default secrets in .env
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Performance Optimization

```bash
# Enable Redis for better performance
REDIS_ENABLED=true

# Adjust file upload limits based on needs
MAX_FILE_SIZE=52428800  # 50MB

# Configure rate limiting
RATE_LIMIT_MAX_REQUESTS=1000
```

### 3. Monitoring Setup

```bash
# Enable detailed logging
LOG_LEVEL=debug
LOG_FILE=true

# Check log rotation
ls -la logs/
```

## Installation Verification Checklist

- [ ] Node.js version 16+ installed
- [ ] All dependencies installed successfully
- [ ] Configuration file (.env) created
- [ ] Server starts without errors
- [ ] Web interface accessible
- [ ] API endpoints responding
- [ ] Log files being created
- [ ] Upload directory writable
- [ ] Security middleware active
- [ ] Rate limiting functional

## Next Steps

After successful installation:

1. **Read**: [04-SYSTEM_ARCHITECTURE.md](./04-SYSTEM_ARCHITECTURE.md) - Understand how The Beast works
2. **Configure**: [13-CONFIGURATION.md](./13-CONFIGURATION.md) - Customize your setup
3. **Deploy**: [11-RENDER_DEPLOYMENT.md](./11-RENDER_DEPLOYMENT.md) - Deploy to production
4. **Monitor**: [08-MONITORING_LOGGING.md](./08-MONITORING_LOGGING.md) - Set up monitoring

## Support

If you encounter issues:

1. Check [14-TROUBLESHOOTING.md](./14-TROUBLESHOOTING.md)
2. Review [18-FREQUENTLY_ASKED_QUESTIONS.md](./18-FREQUENTLY_ASKED_QUESTIONS.md)
3. Enable debug logging: `LOG_LEVEL=debug`
4. Check system resources and ports

---

**Installation Complete!** 🎉

Your Beast is now ready to manage remote devices like a true enterprise system!
