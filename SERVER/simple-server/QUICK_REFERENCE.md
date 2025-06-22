# 🎯 Ghost² Server - Quick Reference

## 📁 **File Summary** (Post-Cleanup)

### 🔧 **Essential Files Only**
```
server.js                    - Main server application
package.json                 - Dependencies and scripts
email-config.json           - Email settings storage
firebase-service-account.json - Firebase credentials

ghost-resurrection-manager.js - Core device management
zombie-routes.js            - API route definitions  
advanced-analytics-api.js   - System analytics
live-streaming-manager.js   - Real-time streaming
command-scheduler.js        - Automated operations

public/
├── ghost-mission-report.html      - ⭐ PRIMARY DASHBOARD
├── ghost-squared-command-center.html - Central control hub
├── zombie-army-manager.html       - Device management
├── ghost-analytics.html           - Analytics dashboard
├── live-surveillance-grid.html    - Surveillance interface
├── quick-strike-panel.html        - Rapid operations
├── remote-operations.html         - Remote device control
├── security-shield.html           - Security management
└── ghost-config.html              - System configuration
```

## 🗑️ **Files Deleted** (Unnecessary)
- `test.js` - Simple test server
- `test-startup.js` - Startup test script  
- `minimal-server.js` - Alternative server
- `setup-email.js` - One-time setup script
- `GHOST_RESURRECTION_COMPLETE.md` - Outdated docs
- `PHASE_3_ADVANCED_FEATURES.md` - Outdated docs
- All duplicate HTML dashboards (11 files removed)

## 🚀 **Quick Start**
```bash
npm start                    # Start server
http://localhost:3000/ghost-mission-report.html  # Main dashboard
```

## 📧 **Email Setup**
1. Open Mission Report dashboard
2. Click "Configure" 
3. Add Gmail credentials (App Password required)
4. Add recipient emails
5. Send test alert

## 🔗 **Key URLs**
- Mission Report: `/ghost-mission-report.html`
- Command Center: `/ghost-squared-command-center.html`
- System Status API: `/api/system-status`
- Email Config API: `/api/configure-alerts`

---
**Server Status:** Production Ready ✅  
**Main Interface:** Ghost Mission Report 👻  
**Documentation:** See GHOST_SERVER_DOCUMENTATION.md
