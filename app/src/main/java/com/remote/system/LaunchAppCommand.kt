package com.remote.system

import android.content.Context
import android.content.Intent
import android.util.Log
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket

class LaunchAppCommand(private val context: Context) : CommandHandler {
    private val tag = "LaunchAppCommand" // Changed to lowercase for convention

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        // Removed nullable type (?) to match the interface
        try {
            val response = JSONObject()

            if (params.has("package")) {
                val packageName = params.getString("package")
                val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)

                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)

                    response.put("success", true)
                    response.put("message", "Application launched successfully")
                } else {
                    response.put("success", false)
                    response.put("error", "Could not find launch intent for package: $packageName")
                }
            } else {
                response.put("success", false)
                response.put("error", "No package name provided")
            }

            response.put("command", "launch_app")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
        } catch (e: JSONException) {
            Log.e(tag, "Error launching app", e)

            // Send error response
            try {
                val errorResponse = JSONObject()
                errorResponse.put("success", false)
                errorResponse.put("error", "Failed to launch app: ${e.message}")
                errorResponse.put("command", "launch_app")
                errorResponse.put("clientId", clientId)
                socket.emit("command-response", errorResponse)
            } catch (ex: JSONException) {
                Log.e(tag, "Error sending error response", ex)
            }
        }
    }
}