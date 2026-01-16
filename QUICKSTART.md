# Quick Start Guide

Get up and running with the WebRTC MERN app in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- Modern browser (Chrome/Firefox/Safari/Edge)
- Two browser windows/tabs for testing

## Installation (1 minute)

```bash
# Install all dependencies (server + client)
npm install
```

This automatically installs dependencies for both server and client.

## Running the App (1 minute)

### Option 1: Run Both Together
```bash
npm run dev
```

### Option 2: Run Separately
```bash
# Terminal 1 - Start signaling server
npm run server

# Terminal 2 - Start React app
cd client
npm run dev
```

You should see:
```
[SERVER] Signaling server running on port 5000
[CLIENT] Local: http://localhost:3000
```

## Testing (2 minutes)

### Basic Video Call Test

1. **Open two browser windows**
   - Window 1: `http://localhost:3000`
   - Window 2: `http://localhost:3000`

2. **Create room (Window 1)**
   - Enter room ID: `test123`
   - Click "Create Room"
   - Click "Start Video Call"
   - Allow camera/microphone permissions

3. **Join room (Window 2)**
   - Enter room ID: `test123`
   - Click "Join Room"
   - Click "Start Video Call"
   - Allow camera/microphone permissions

4. **Verify**
   - ✅ See your video in both windows
   - ✅ See remote video in both windows
   - ✅ Hear audio (use headphones to avoid echo)
   - ✅ Connection state shows "connected"

### Test Other Features

**Data Channel Messages**
- Type message in input box
- Click "Send"
- See message in remote window

**Controls**
- Click "Mute" - remote stops hearing you
- Click "Stop Video" - remote stops seeing you
- Click "End Call" - connection closes

**Screen Sharing**
- Scroll down to "WebRTC-Based Streaming"
- Click "Start Screen Share"
- Select screen/window/tab
- Remote peer sees your screen

**Canvas Streaming**
- Click "Start Canvas Stream"
- See animated graphics
- Remote peer receives canvas as video

**External HLS Stream**
- Scroll to "External Video Stream"
- Click a sample stream button
- Video plays independently

## Troubleshooting

### No video/audio?
```bash
# Check browser permissions
# Chrome: chrome://settings/content/camera
# Firefox: about:preferences#privacy
```

### Connection fails?
```bash
# Verify server is running
curl http://localhost:5000/health

# Should return: {"status":"ok","roomCount":0}
```

### Port already in use?
```bash
# Change server port in package.json
"server": "PORT=5001 node server/index.js"

# Update client signaling URL in src/App.jsx
const SIGNALING_SERVER = 'http://localhost:5001';
```

### Echo/feedback?
- Use headphones
- Or mute one window's audio

## Next Steps

### Explore the Code
- `server/index.js` - Signaling server
- `client/src/App.jsx` - Main app
- `client/src/utils/webrtc.js` - WebRTC utilities

### Read Documentation
- `README.md` - Full documentation
- `ARCHITECTURE.md` - Technical details
- `PROJECT_SUMMARY.md` - Project overview

### Customize
- Change video quality in `client/src/utils/webrtc.js`
- Add TURN server for production
- Integrate MongoDB for persistence
- Add authentication

## Common Commands

```bash
# Install all dependencies
npm run install:all

# Run both server and client
npm run dev

# Run server only
npm run server

# Run server with auto-restart
npm run server:dev

# Build client for production
npm run build:client

# Test signaling server
npm run test:signaling
```

## Production Deployment

### Quick Deploy (Heroku)
```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Deploy
git push heroku main

# 3. Update client signaling URL
# In client/src/App.jsx:
const SIGNALING_SERVER = 'https://your-app-name.herokuapp.com';

# 4. Build and deploy client
cd client
npm run build
# Upload dist/ to Netlify/Vercel/S3
```

### Environment Variables
```bash
# Server (.env)
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb://...

# Client (.env)
VITE_SIGNALING_SERVER=https://your-server.com
```

## Getting Help

### Check Logs
```bash
# Server logs
npm run server

# Browser console
F12 → Console tab
```

### Verify WebRTC Support
```javascript
// In browser console
console.log({
  RTCPeerConnection: !!window.RTCPeerConnection,
  getUserMedia: !!(navigator.mediaDevices?.getUserMedia),
  getDisplayMedia: !!(navigator.mediaDevices?.getDisplayMedia)
});
```

### Test Network
```bash
# Check if signaling server is reachable
curl http://localhost:5000/health

# Check rooms
curl http://localhost:5000/rooms
```

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐
│  Browser 1  │         │  Browser 2  │
│             │         │             │
│  React App  │         │  React App  │
└──────┬──────┘         └──────┬──────┘
       │                       │
       │    Signaling (WS)     │
       └───────┬───────────────┘
               │
        ┌──────▼──────┐
        │   Node.js   │
        │  Socket.IO  │
        │   Server    │
        └─────────────┘
       
       P2P Media (direct)
Browser 1 ←──────────→ Browser 2
```

## What You Get

✅ **Working video calling app**  
✅ **Screen sharing**  
✅ **Canvas streaming**  
✅ **HLS video playback**  
✅ **Data channel messaging**  
✅ **Production-ready architecture**  
✅ **Comprehensive documentation**  

## Resources

- [WebRTC.org](https://webrtc.org/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.IO Docs](https://socket.io/docs/)

---

**That's it! You're ready to build on this foundation.**

Need more details? Check `README.md` for comprehensive documentation.
