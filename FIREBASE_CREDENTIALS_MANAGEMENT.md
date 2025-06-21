# 🔥 Firebase Service Account Management Guide

## 🚨 **SECURITY REMINDER**

**⚠️ NEVER commit `firebase-service-account.json` to public repositories!**  
**⚠️ Always keep Firebase credentials secure and private!**  
**⚠️ Rotate credentials immediately if exposed!**

---

## 📋 **Quick Reference**

### **Files Involved:**
- **Server**: `SERVER/simple-server/firebase-service-account.json` (Service Account)
- **Android**: `APK/app/google-services.json` (App Configuration)

### **When to Replace:**
- ✅ New Firebase project setup
- ✅ Credentials compromised/exposed
- ✅ Google Cloud security alert received
- ✅ Key rotation (security best practice)

---

## 🔧 **Step 1: Generate New Firebase Service Account**

### **1.1 Access Firebase Console**
```
1. Go to: https://console.firebase.google.com/
2. Select your project: ghost-420 (or create new)
3. Click gear icon ⚙️ → Project Settings
```

### **1.2 Navigate to Service Accounts**
```
4. Click "Service accounts" tab
5. You'll see: "Firebase Admin SDK"
6. Language: Node.js (should be selected)
```

### **1.3 Generate New Private Key**
```
7. Click "Generate new private key" button
8. Confirm dialog: "Generate key"
9. JSON file downloads automatically
10. File name: ghost-420-firebase-adminsdk-xxxxx.json
```

### **1.4 Rename Downloaded File**
```bash
# Rename the downloaded file to standard name
mv ~/Downloads/ghost-420-firebase-adminsdk-*.json firebase-service-account.json
```

---

## 🔧 **Step 2: Generate google-services.json (Android App)**

### **2.1 Project Settings**
```
1. Same Firebase Console → Project Settings
2. Click "General" tab
3. Scroll to "Your apps" section
```

### **2.2 Android App Configuration**
```
4. Click Android icon or "Add app" if not exists
5. Package name: com.remote.system
6. App nickname: Remote System APK
7. SHA-1: (optional for development)
8. Click "Register app"
```

### **2.3 Download Configuration**
```
9. Download google-services.json button appears
10. Click download
11. Save as: google-services.json
```

---

## 🔄 **Step 3: Replace Server Credentials**

### **3.1 Backup Current Credentials (if working)**
```bash
cd /workspaces/Remote-System-APK/SERVER/simple-server/
cp firebase-service-account.json firebase-service-account.json.backup
```

### **3.2 Replace Server Service Account**
```bash
# Method 1: Copy new file
cp ~/Downloads/firebase-service-account.json SERVER/simple-server/

# Method 2: Move new file
mv ~/Downloads/firebase-service-account.json SERVER/simple-server/

# Method 3: Via VS Code
# Drag and drop the downloaded JSON file to SERVER/simple-server/ folder
```

### **3.3 Verify Server File**
```bash
cd SERVER/simple-server/
ls -la firebase-service-account.json
# Should show: -rw-r--r-- 1 user user 2400+ bytes

# Check content structure
head -5 firebase-service-account.json
# Should show: {"type": "service_account", "project_id": "ghost-420"...
```

### **3.4 Test Server Connection**
```bash
# Start server
cd SERVER/simple-server/
node server.js

# Look for success message:
# "🔥 Firebase Admin SDK initialized successfully"
# If you see this, credentials are working!
```

---

## 📱 **Step 4: Replace Android App Configuration**

### **4.1 Backup Current Config**
```bash
cd /workspaces/Remote-System-APK/APK/app/
cp google-services.json google-services.json.backup
```

### **4.2 Replace Android Configuration**
```bash
# Method 1: Copy new file
cp ~/Downloads/google-services.json APK/app/

# Method 2: Move new file
mv ~/Downloads/google-services.json APK/app/

# Method 3: Via VS Code
# Drag and drop to APK/app/ folder, replace existing
```

### **4.3 Verify Android File**
```bash
cd APK/app/
ls -la google-services.json
# Should show recent timestamp

# Check project ID matches
grep "project_id" google-services.json
# Should show: "project_id": "ghost-420"
```

### **4.4 Clean and Rebuild APK**
```bash
cd APK/
./gradlew clean
./gradlew assembleDebug
# New APK will have updated Firebase config
```

---

## 🔍 **Step 5: Verify Integration**

### **5.1 Server Verification**
```bash
cd SERVER/simple-server/
node server.js

# ✅ Success indicators:
# "🔥 Firebase Admin SDK initialized successfully"
# "Server running on port 3000"
# No Firebase authentication errors
```

### **5.2 Android Verification**
```bash
cd APK/
./gradlew assembleDebug

# ✅ Success indicators:
# Build successful
# No google-services.json errors
# APK created in app/build/outputs/apk/debug/
```

### **5.3 End-to-End Test**
```
1. Install new APK on Android device
2. Open app and register device
3. Check server logs for device registration
4. Test sending FCM message from server
5. Verify device receives notification
```

---

## 🛡️ **Security Best Practices**

### **DO:**
✅ Keep credentials in private repositories only  
✅ Use environment variables in production  
✅ Rotate credentials every 90 days  
✅ Monitor Google Cloud activity logs  
✅ Use least-privilege IAM roles  

### **DON'T:**
❌ Commit credentials to public repos  
❌ Share credential files via email/chat  
❌ Use same credentials across environments  
❌ Store credentials in plain text  
❌ Ignore Google Cloud security alerts  

---

## 🚨 **Emergency: Credentials Compromised**

### **Immediate Actions (Within 5 minutes):**
```bash
1. Make repository private (if public)
2. Remove credentials from git:
   git rm SERVER/simple-server/firebase-service-account.json
   git rm APK/app/google-services.json
   git commit -m "Remove compromised credentials"
   git push origin main

3. Generate new credentials (follow Step 1 & 2)
4. Replace local files (follow Step 3 & 4)
5. Test integration (follow Step 5)
```

### **Follow-up Actions (Within 24 hours):**
- Review Google Cloud audit logs
- Check for unauthorized API usage
- Consider rotating other project credentials
- Update security policies

---

## 📞 **Troubleshooting**

### **Common Issues:**

**❌ "Firebase Admin SDK initialization failed"**
```
Solution: Check firebase-service-account.json format and permissions
Command: head -5 SERVER/simple-server/firebase-service-account.json
```

**❌ "google-services.json not found"**
```
Solution: Ensure file is in APK/app/ directory
Command: ls -la APK/app/google-services.json
```

**❌ "Project ID mismatch"**
```
Solution: Ensure both files have same project_id
Commands:
grep "project_id" SERVER/simple-server/firebase-service-account.json
grep "project_id" APK/app/google-services.json
```

**❌ "FCM messages not received"**
```
Solution: Check server logs and device registration
Test: Send test notification from Firebase Console
```

---

## 📚 **Additional Resources**

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
- [Google Cloud Security Best Practices](https://cloud.google.com/security/best-practices)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## 🎯 **Quick Commands Reference**

```bash
# Generate new credentials and replace
cd /workspaces/Remote-System-APK
cp ~/Downloads/firebase-service-account.json SERVER/simple-server/
cp ~/Downloads/google-services.json APK/app/

# Test server
cd SERVER/simple-server && node server.js

# Build APK
cd APK && ./gradlew assembleDebug

# Check file integrity
grep "project_id" SERVER/simple-server/firebase-service-account.json
grep "project_id" APK/app/google-services.json
```

---

**🔒 Remember: Security first! Always keep Firebase credentials private and secure.**
