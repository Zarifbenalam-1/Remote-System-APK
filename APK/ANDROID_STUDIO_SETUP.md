# Android Studio Setup Checklist ✅

## Pre-Opening Checklist
- [ ] Android Studio is installed (Arctic Fox or newer)
- [ ] Android SDK with API Level 24+ is installed
- [ ] JDK 11+ is installed
- [ ] You have a physical Android device or emulator ready

## Opening Project
1. [ ] Open Android Studio
2. [ ] Choose "Open an Existing Project"
3. [ ] Navigate to this **APK** folder (`/path/to/Remote-System-APK/APK/`)
4. [ ] Click "Open"
5. [ ] Wait for Gradle sync to complete (may take 3-5 minutes first time)

## Initial Setup in Android Studio
1. [ ] Check if Gradle sync completed successfully (green checkmark in bottom bar)
2. [ ] Verify no build errors in "Build" tab
3. [ ] Connect your Android device or start emulator
4. [ ] Enable USB debugging on device (Settings → Developer Options)

## Server Setup (Important!)
1. [ ] Update server URL in `RemoteControlService.kt` line ~42:
   - For **emulator**: `http://10.0.2.2:3000/` (already set)
   - For **real device**: `http://YOUR_COMPUTER_IP:3000/`
   - For **production**: `https://your-server.com/`

## Building APK
### Option 1: Using Android Studio UI
1. [ ] Build → Generate Signed Bundle/APK
2. [ ] Choose "APK"
3. [ ] Create keystore (for testing) or use existing
4. [ ] Select "debug" for testing or "release" for production

### Option 2: Using Terminal in Android Studio
```bash
# For testing
./gradlew assembleDebug

# For production
./gradlew assembleRelease
```

## Testing Checklist
1. [ ] Install APK on device
2. [ ] Grant all permissions when prompted:
   - [ ] Location
   - [ ] Camera
   - [ ] Microphone
   - [ ] Storage
   - [ ] SMS
   - [ ] Phone
3. [ ] Check if app shows "Connected" status
4. [ ] Test server connection from Windows client

## Common Issues & Solutions

### Gradle Sync Issues
- [ ] File → Invalidate Caches and Restart
- [ ] Update Android Studio to latest version
- [ ] Check internet connection

### Build Errors
- [ ] Clean project: Build → Clean Project
- [ ] Rebuild: Build → Rebuild Project
- [ ] Check JDK version (should be 11+)

### Connection Issues
- [ ] Verify server is running
- [ ] Check server URL matches your setup
- [ ] Ensure device and server are on same network (for local testing)
- [ ] Check firewall settings

### Permission Issues
- [ ] Manually grant permissions in Android Settings → Apps → Harvard Remote System
- [ ] Check if "Special app access" permissions are needed

## File Locations After Build
- **Debug APK**: `app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `app/build/outputs/apk/release/app-release.apk`

## Ready for Production?
- [ ] Server URL points to production server
- [ ] APK is signed with proper keystore
- [ ] All features tested on target devices
- [ ] Privacy compliance verified

---
**🎯 Quick Start**: Just open the APK folder in Android Studio, wait for Gradle sync, then click the green play button to build and run!
