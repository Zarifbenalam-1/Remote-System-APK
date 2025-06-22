# 🚀 GHOST SQUARED - QUICK DEPLOYMENT REFERENCE

## ⚡ **INSTANT DEPLOYMENT COMMANDS**

### **🔥 One-Command Deployments**
```bash
# Development (Local):
./start-dev.sh

# Production (Docker):
./deploy-production.sh

# Verify System:
./verify-system.sh
```

### **☁️ Cloud Deployment (Render.com)**
**Build Command**: `cd SERVER/simple-server && npm install`
**Start Command**: `cd SERVER/simple-server && node server.js`
**Health Check**: `/api/status`

### **📦 Manual Commands**
```bash
# Local Development:
cd SERVER/simple-server && npm install && node server.js

# Docker Production:
docker-compose --profile production up -d

# PM2 Production:
cd SERVER/simple-server && npm run pm2:start
```

---

## 🌍 **ACCESS URLS**

### **Development (Port 3000)**:
- Command Center: http://localhost:3000/ghost-squared-command-center.html
- API Status: http://localhost:3000/api/status

### **Production (Port 8080)**:
- Command Center: http://localhost:8080/ghost-squared-command-center.html
- API Status: http://localhost:8080/api/status

### **Cloud (Render.com)**:
- Command Center: https://your-app.onrender.com/ghost-squared-command-center.html
- API Status: https://your-app.onrender.com/api/status

---

## 🛠️ **MANAGEMENT COMMANDS**

### **Docker Management**:
```bash
# View logs:
docker-compose logs -f ghost-squared-prod

# Stop service:
docker-compose --profile production down

# Restart service:
docker-compose --profile production restart ghost-squared-prod

# View running containers:
docker-compose ps
```

### **PM2 Management**:
```bash
# View status:
pm2 status

# View logs:
pm2 logs ghost-squared

# Restart:
pm2 restart ghost-squared

# Stop:
pm2 stop ghost-squared

# Monitor:
pm2 monit
```

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**:
```bash
# Port already in use:
sudo netstat -tulpn | grep :3000
sudo kill -9 <PID>

# Check server status:
curl http://localhost:3000/api/status

# Docker permission issues:
sudo usermod -aG docker $USER
# (logout and login again)

# Node.js version issues:
node --version  # Should be 16+
```

### **Health Checks**:
```bash
# Local:
curl http://localhost:3000/api/status

# Production:
curl http://localhost:8080/api/status

# Docker container health:
docker-compose ps
```

---

## 📋 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**:
- [ ] Node.js 16+ installed
- [ ] Docker installed (for production)
- [ ] Ports available (3000 dev, 8080 prod)
- [ ] Firebase service account configured (optional)

### **Post-Deployment**:
- [ ] Server responds to status endpoint
- [ ] All 8 Ghost Squared modules accessible
- [ ] Navigation between modules working
- [ ] No critical errors in logs

---

## 🎯 **SUCCESS INDICATORS**

✅ **Development Ready**: Server running on http://localhost:3000
✅ **Production Ready**: Server running on http://localhost:8080  
✅ **Cloud Ready**: App accessible via public URL
✅ **All Modules Working**: 8/8 modules accessible and functional
✅ **API Responding**: `/api/status` returns 200 OK
✅ **Navigation Working**: Can navigate between all modules

**🎉 Ghost Squared is ready for action!**
