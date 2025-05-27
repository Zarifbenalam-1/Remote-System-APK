# Render Deployment Instructions

## Quick Deploy to Render

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up

2. **Connect GitHub**: Link your GitHub account to Render

3. **New Web Service**: 
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select the repository containing this server

4. **Configuration**:
   - **Name**: `remote-device-management-server`
   - **Region**: Choose closest to your location
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `standalone-server` (if server is in subfolder)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Environment Variables**: (Optional)
   - `PORT`: Leave empty (Render sets automatically)

6. **Deploy**: Click "Create Web Service"

## After Deployment

Your server will be available at: `https://your-app-name.onrender.com`

### Update Your Android App
```java
// Change WebSocket URL in your Android app
String serverUrl = "https://your-app-name.onrender.com";
```

### Update Your Windows Client
```csharp
// Change WebSocket URL in your Windows client
var socket = new SocketIOClient.SocketIO("https://your-app-name.onrender.com");
```

## Free Tier Limitations

- **Sleeping**: Service sleeps after 15 minutes of inactivity
- **Cold Start**: 30-60 seconds to wake up
- **Bandwidth**: 100GB/month
- **Runtime**: 750 hours/month

## Keep-Alive (Optional)

To prevent sleeping, add this to your Android app:
```java
// Ping server every 10 minutes
Timer timer = new Timer();
timer.scheduleAtFixedRate(new TimerTask() {
    @Override
    public void run() {
        socket.emit("ping");
    }
}, 0, 600000); // 10 minutes
```
