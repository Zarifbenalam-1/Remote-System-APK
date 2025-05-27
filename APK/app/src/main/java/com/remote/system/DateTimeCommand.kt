package com.remote.system

import android.content.Context
import android.util.Log
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

class DateTimeCommand(private val context: Context) : CommandHandler {
    private val tag = "DateTimeCommand" // Changed to lowercase for convention

    override fun execute(params: JSONObject, clientSocketId: String, socket: Socket) {
        // Removed nullable type (?) to match the interface
        try {
            val response = JSONObject()
            val data = JSONObject()

            val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault())
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            val currentDateTime = sdf.format(Date())

            data.put("datetime", currentDateTime)
            data.put("timezone", "UTC")

            response.put("success", true)
            response.put("timestamp", System.currentTimeMillis())
            response.put("data", data)
            response.put("command", "get_datetime")
            response.put("clientSocketId", clientSocketId)

            socket.emit("device_response", response)
        } catch (e: JSONException) {
            Log.e(tag, "Error creating datetime response", e)

            // Send error response
            try {
                val errorResponse = JSONObject()
                errorResponse.put("success", false)
            errorResponse.put("timestamp", System.currentTimeMillis())
                errorResponse.put("error", "Failed to get date/time: ${e.message}")
                errorResponse.put("command", "get_datetime")
                errorResponse.put("clientSocketId", clientSocketId)
                socket.emit("device_response", errorResponse)
            } catch (ex: JSONException) {
                Log.e(tag, "Error sending error response", ex)
            }
        }
    }
}