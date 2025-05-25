package com.remote.system

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private val permissionRequestCode = 123  // Changed to camelCase
    private lateinit var statusTextView: TextView
    private lateinit var startButton: Button
    private lateinit var stopButton: Button

    private val requiredPermissions = arrayOf(
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION,
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize UI elements
        statusTextView = findViewById(R.id.statusTextView)
        startButton = findViewById(R.id.startButton)
        stopButton = findViewById(R.id.stopButton)

        startButton.setOnClickListener {
            // Start service without waiting for permissions
            startRemoteService()
            // Request permissions for future functionality
            checkAndRequestPermissions()
        }

        stopButton.setOnClickListener {
            stopRemoteService()
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = ArrayList<String>()

        for (permission in requiredPermissions) {
            if (ContextCompat.checkSelfPermission(this, permission) !=
                PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(permission)
            }
        }

        // Add notification permission for Android 13+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(
                this,
                permissionsToRequest.toTypedArray(),
                permissionRequestCode
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == permissionRequestCode) {
            val deniedPermissions = ArrayList<String>()

            for (i in permissions.indices) {
                if (grantResults[i] != PackageManager.PERMISSION_GRANTED) {
                    deniedPermissions.add(permissions[i])
                }
            }

            if (deniedPermissions.isNotEmpty()) {
                Toast.makeText(this,
                    getString(R.string.permission_denied_message),
                    Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun startRemoteService() {
        val serviceIntent = Intent(this, RemoteControlService::class.java)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }

        statusTextView.text = getString(R.string.service_running)
    }

    private fun stopRemoteService() {
        val serviceIntent = Intent(this, RemoteControlService::class.java)
        stopService(serviceIntent)
        statusTextView.text = getString(R.string.service_stopped)
    }
}