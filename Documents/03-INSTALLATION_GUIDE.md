# 🔧 Installation Guide - Complete Setup Instructions

## 📖 **Comprehensive Installation for All Skill Levels**

This guide provides detailed, step-by-step installation instructions for the Harvard Remote System. Whether you're a beginner or experienced developer, this guide will get you set up correctly.

---

## 🎯 **Installation Overview**

### **What We'll Install:**
1. **Development Environment** (Android Studio, Node.js, Git)
2. **Project Dependencies** (NPM packages, Android SDK components)
3. **Harvard Remote System** (Source code and configuration)
4. **Testing Environment** (Emulator or device setup)

### **Estimated Time:**
- **Experienced Developers**: 15-20 minutes
- **Beginners**: 30-45 minutes
- **First-time Android Setup**: 60-90 minutes

---

## 🖥️ **System Requirements**

### **Hardware Requirements**
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 8GB | 16GB+ |
| **Storage** | 10GB free | 20GB+ free |
| **CPU** | Dual-core | Quad-core+ |
| **Graphics** | Integrated | Dedicated GPU |

### **Operating System Support**
- ✅ **Windows 10/11** (64-bit)
- ✅ **macOS 10.14+** (Mojave or later)
- ✅ **Linux** (Ubuntu 18.04+, Fedora, CentOS)

---

## 📦 **Phase 1: Install Development Tools**

### **1.1 Install Git** 

#### **Windows:**
```bash
# Download from: https://git-scm.com/download/win
# Or use Chocolatey:
choco install git

# Verify installation:
git --version
```

#### **macOS:**
```bash
# Using Homebrew (recommended):
brew install git

# Or download from: https://git-scm.com/download/mac

# Verify installation:
git --version
```

#### **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git

# Verify installation:
git --version
```

### **1.2 Install Node.js**

#### **All Platforms:**
1. Visit [nodejs.org](https://nodejs.org/)
2. Download **LTS version** (v18+ recommended)
3. Run installer with default settings
4. Verify installation:

```bash
node --version    # Should show v18+
npm --version     # Should show npm version
```

#### **Alternative - Using Package Managers:**

**Windows (Chocolatey):**
```bash
choco install nodejs
```

**macOS (Homebrew):**
```bash
brew install node
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### **1.3 Install Android Studio**

#### **Download & Install:**
1. Visit [developer.android.com/studio](https://developer.android.com/studio)
2. Download Android Studio for your platform
3. Run installer and follow setup wizard

#### **Initial Setup:**
1. **Start Android Studio**
2. **Complete Setup Wizard**:
   - Accept license agreements
   - Choose "Standard" installation
   - Download Android SDK components
3. **Configure SDK**:
   - Go to `File > Settings > Appearance & Behavior > System Settings > Android SDK`
   - Install Android 10+ (API 29+)
   - Install Android SDK Build-Tools
   - Install Android Emulator

#### **Verify Android Installation:**
```bash
# Add Android SDK to PATH (replace with your SDK path)
# Windows:
set PATH=%PATH%;C:\Users\[Username]\AppData\Local\Android\Sdk\platform-tools

# macOS/Linux:
export PATH=$PATH:~/Android/Sdk/platform-tools

# Test ADB
adb version
```

---

## 📱 **Phase 2: Android Environment Setup**

### **2.1 Create Android Virtual Device (AVD)**

1. **Open Android Studio**
2. **Go to**: `Tools > AVD Manager`
3. **Click**: "Create Virtual Device"
4. **Select**: A modern phone (Pixel 4, Pixel 5, etc.)
5. **Choose System Image**: Android 10+ (API 29+)
6. **Configure AVD**:
   - Name: "Harvard_Test_Device"
   - RAM: 2048MB or higher
   - Enable hardware keyboard
7. **Click**: "Finish"

### **2.2 Test AVD**
```bash
# Start emulator from command line
emulator -avd Harvard_Test_Device

# Or use Android Studio AVD Manager GUI
```

### **2.3 Configure Real Device (Optional)**

#### **Enable Developer Options:**
1. Go to `Settings > About Phone`
2. Tap "Build Number" 7 times
3. Go back to `Settings > Developer Options`
4. Enable "USB Debugging"
5. Enable "Stay Awake"

#### **Connect Device:**
```bash
# Connect via USB and verify
adb devices
# Should show your device
```

---

## 🚀 **Phase 3: Harvard Remote System Installation**

### **3.1 Clone the Repository**

```bash
# Create development directory
mkdir ~/Harvard-Projects
cd ~/Harvard-Projects

# Clone the repository
git clone <your-repository-url> Remote-System-APK
cd Remote-System-APK

# Verify structure
ls -la
# Should show: APK/, SERVER/, Documents/
```

### **3.2 Set Up Server Environment**

```bash
# Navigate to server directory
cd SERVER/simple-server

# Install Node.js dependencies
npm install

# Verify installation
npm list
# Should show all dependencies installed
```

### **3.3 Configure Server Settings**

#### **Basic Configuration:**
```bash
# Create configuration file (optional)
cp config.example.js config.js
# Edit server settings if needed
```

#### **Network Configuration:**
1. **For Emulator**: No changes needed (uses `10.0.2.2`)
2. **For Real Device**: Update server URL in Android app
3. **For Remote Access**: Configure firewall and network settings

### **3.4 Test Server Installation**

```bash
# Start the server
npm start

# Test in browser
# Open: http://localhost:3000
# Should see: "Harvard Remote System Server"
```

---

## 📱 **Phase 4: Android App Setup**

### **4.1 Open Project in Android Studio**

1. **Launch Android Studio**
2. **Click**: "Open an existing Android Studio project"
3. **Navigate to**: `Remote-System-APK/APK/`
4. **Click**: "OK"
5. **Wait for**: Gradle sync to complete

### **4.2 Configure Build Environment**

#### **Check Gradle Configuration:**
```kotlin
// In app/build.gradle.kts
android {
    compileSdk = 34
    
    defaultConfig {
        minSdk = 24
        targetSdk = 34
    }
}
```

#### **Sync Dependencies:**
1. **Click**: "Sync Now" if prompted
2. **Wait for**: All dependencies to download
3. **Resolve**: Any version conflicts

### **4.3 Update Network Configuration**

#### **For Real Device Setup:**
```kotlin
// In RemoteControlService.kt
companion object {
    private const val SERVER_URL = "http://YOUR_COMPUTER_IP:3000/"
    // Replace YOUR_COMPUTER_IP with your actual IP
}
```

#### **Find Your Computer's IP:**
```bash
# Windows
ipconfig | findstr IPv4

# macOS
ifconfig | grep "inet " | grep -v 127.0.0.1

# Linux
hostname -I
```

---

## 🔨 **Phase 5: Build and Install**

### **5.1 Build the APK**

#### **Using Android Studio GUI:**
1. **Click**: `Build > Build APK(s)`
2. **Wait for**: Build to complete
3. **Click**: "locate" in notification to find APK

#### **Using Command Line:**
```bash
# Navigate to APK directory
cd APK

# Build debug APK
./gradlew assembleDebug

# APK location: app/build/outputs/apk/debug/app-debug.apk
```

### **5.2 Install on Device**

#### **Install via ADB:**
```bash
# Install on connected device/emulator
adb install app/build/outputs/apk/debug/app-debug.apk

# Verify installation
adb shell pm list packages | grep com.remote.system
```

#### **Install via Android Studio:**
1. **Click**: `Run > Run 'app'`
2. **Select**: Target device (emulator or connected device)
3. **Wait for**: Installation and launch

---

## ✅ **Phase 6: Verification & Testing**

### **6.1 Verify Installation**

#### **Check Server:**
```bash
# Server should be running
cd SERVER/simple-server
npm start
# Should show: "Server running on port 3000"
```

#### **Check Android App:**
1. **Find**: "Google Services" app in app drawer
2. **Open**: The app
3. **Check**: Connection status
4. **Verify**: Notification appears

### **6.2 Test Basic Functionality**

#### **Connection Test:**
1. **Start server** (if not running)
2. **Open Android app**
3. **Check server logs** for device connection
4. **Verify bidirectional communication**

#### **Command Test:**
```javascript
// From server, send test command
// Check browser interface at http://localhost:3000
// Send "device_info" command
// Should receive device details
```

---

## 🐛 **Common Installation Issues & Solutions**

### **Issue 1: Android SDK Not Found**
```bash
# Solution: Set ANDROID_HOME environment variable
# Windows:
set ANDROID_HOME=C:\Users\[Username]\AppData\Local\Android\Sdk

# macOS/Linux:
export ANDROID_HOME=~/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### **Issue 2: Node.js Modules Not Installing**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### **Issue 3: APK Build Fails**
```bash
# Clean and rebuild
cd APK
./gradlew clean
./gradlew assembleDebug
```

### **Issue 4: Device Not Detected**
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### **Issue 5: Connection Issues**
1. **Check firewall settings**
2. **Verify IP addresses**
3. **Test network connectivity**
4. **Check server logs for errors**

---

## 🎓 **Post-Installation Setup**

### **Development Environment Optimization**
```bash
# Increase Android Studio memory
# Edit: studio.vmoptions
-Xms2048m
-Xmx4096m
```

### **Useful Aliases**
```bash
# Add to ~/.bashrc or ~/.zshrc
alias harvard-server='cd ~/Harvard-Projects/Remote-System-APK/SERVER/simple-server && npm start'
alias harvard-build='cd ~/Harvard-Projects/Remote-System-APK/APK && ./gradlew assembleDebug'
```

### **IDE Configuration**
1. **Install useful plugins**: Kotlin, Android, Git
2. **Configure code style**: Follow Android conventions
3. **Set up version control**: Git integration
4. **Configure debugging**: Breakpoints and logging

---

## 🚀 **What's Next?**

### **Immediate Next Steps:**
1. **Test all commands**: [`14-COMMAND_REFERENCE.md`](14-COMMAND_REFERENCE.md)
2. **Understand architecture**: [`04-SYSTEM_ARCHITECTURE.md`](04-SYSTEM_ARCHITECTURE.md)
3. **Explore the code**: [`05-CODE_STRUCTURE.md`](05-CODE_STRUCTURE.md)

### **Advanced Configuration:**
1. **Security setup**: [`16-SECURITY_FEATURES.md`](16-SECURITY_FEATURES.md)
2. **Performance tuning**: [`20-PERFORMANCE_METRICS.md`](20-PERFORMANCE_METRICS.md)
3. **Production deployment**: [`11-DEPLOYMENT_GUIDE.md`](11-DEPLOYMENT_GUIDE.md)

---

## 📊 **Installation Checklist**

- [ ] **Git installed and configured**
- [ ] **Node.js v18+ installed**
- [ ] **Android Studio installed with SDK**
- [ ] **Android emulator or device configured**
- [ ] **Project cloned and dependencies installed**
- [ ] **Server running on localhost:3000**
- [ ] **Android app built and installed**
- [ ] **Connection established between app and server**
- [ ] **Basic commands tested and working**
- [ ] **Documentation reviewed and understood**

---

**🎉 Congratulations! You now have a fully functional Harvard Remote System installation!**

*Ready to explore the system architecture? Continue with [`04-SYSTEM_ARCHITECTURE.md`](04-SYSTEM_ARCHITECTURE.md)!*
