# 📋 Simple Instructions - Run The BEAST in 3 Steps

> **For people who just want it to WORK immediately! 🚀**

## 🎯 What You Need to Know

**The BEAST** is a remote device management server that lets you control Android devices from Windows computers. Think TeamViewer but for Android devices.

## ⚡ 3-Step Quick Start

### Step 1: Get The Code
```bash
# If you don't have it yet
git clone <your-repo-url>
cd Remote-System-Server/standalone-server

# If you already have it
cd Remote-System-Server/standalone-server
```

### Step 2: Install & Configure
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the environment file (optional for testing)
nano .env
```

### Step 3: Start The BEAST
```bash
# Start the server
npm start

# You should see:
# ✅ BEAST Server running on http://localhost:3000
# ✅ WebSocket server initialized
# ✅ All systems operational
```

## 🎉 Test It Works

Open your browser and go to: **http://localhost:3000**

You should see the BEAST control panel!

## 🔧 Common Issues & Quick Fixes

### Problem: "Port 3000 is already in use"
```bash
# Kill whatever is using port 3000
sudo lsof -ti:3000 | xargs kill -9

# Or use a different port
export PORT=3001
npm start
```

### Problem: "npm install fails"
```bash
# Clear npm cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Problem: "Permission denied"
```bash
# Fix permissions
chmod +x server.js
sudo chown -R $USER:$USER .
```

## 🚀 What's Next?

### For Basic Use:
- ✅ Server is running - you're done!
- 🌐 Access at http://localhost:3000
- 📱 Connect your Android devices using the API

### For Production Deployment:
- 📖 Read **[11-RENDER_DEPLOYMENT.md](11-RENDER_DEPLOYMENT.md)** for free cloud hosting
- 🐳 Read **[12-DOCKER_DEPLOYMENT.md](12-DOCKER_DEPLOYMENT.md)** for containerized deployment
- ⚙️ Read **[13-CONFIGURATION.md](13-CONFIGURATION.md)** for advanced settings

### For Understanding How It Works:
- 🦁 Read **[01-WHAT_IS_THE_BEAST.md](01-WHAT_IS_THE_BEAST.md)** for system overview
- 🏗️ Read **[04-SYSTEM_ARCHITECTURE.md](04-SYSTEM_ARCHITECTURE.md)** for technical details

## 📞 Need Help?

1. **Quick answers** → **[18-FREQUENTLY_ASKED_QUESTIONS.md](18-FREQUENTLY_ASKED_QUESTIONS.md)**
2. **Problems** → **[14-TROUBLESHOOTING.md](14-TROUBLESHOOTING.md)**
3. **API questions** → **[16-API_REFERENCE.md](16-API_REFERENCE.md)**

## 🎯 Environment Variables (Optional)

If you want to customize settings, edit your `.env` file:

```bash
# Basic settings
PORT=3000                    # Server port
NODE_ENV=development         # Environment mode

# Security (change these for production!)
JWT_SECRET=your-secret-key
API_KEY=your-api-key

# Features
ENABLE_MONITORING=true       # System monitoring
ENABLE_CLUSTERING=false      # Multi-core support
REDIS_ENABLED=false          # Queue system

# File uploads
MAX_FILE_SIZE=50MB           # Maximum upload size
UPLOAD_DIR=uploads           # Upload directory
```

## 🔥 Pro Tips

### Development Mode
```bash
# Auto-restart on file changes
npm run dev
```

### Production Mode
```bash
# Optimized for production
npm run start:prod
```

### With Clustering (Multiple CPU cores)
```bash
# Use all CPU cores
npm run cluster
```

### Check Server Health
```bash
# Test if server is working
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","uptime":123,"memory":{"used":45,"total":2048}}
```

---

**🦁 That's it! The BEAST is now running and ready to manage your devices!** 

**For more advanced features and deployment options, check out the other documentation files in this folder.** 📚🔥
