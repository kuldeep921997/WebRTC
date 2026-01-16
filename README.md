# WebRTC MERN Application

A production-grade WebRTC application for voice/video calling with external video streaming capabilities. Built incrementally following WebRTC best practices.

## 🎯 Features

- **P2P Voice & Video Calling**: Direct peer-to-peer communication using WebRTC
- **Data Channels**: Real-time messaging alongside media streams
- **Screen Sharing**: Share screen, window, or tab with sub-second latency
- **Canvas Streaming**: Programmatic video generation and streaming
- **External Streaming**: Play HLS video streams from external sources
- **NAT Traversal**: STUN-based ICE for connecting peers across networks
- **Production-Ready**: Clean architecture, error handling, reusable utilities

## 📚 Tech Stack

### Backend
- **Node.js** + **Express**: HTTP server
- **Socket.IO**: WebSocket-based signaling server
- **MongoDB**: User/room metadata (ready for integration)

### Frontend
- **React** + **Vite**: Modern UI with fast development
- **WebRTC APIs**: Native browser APIs (no abstractions)
- **hls.js**: HLS video streaming support

### Infrastructure
- **STUN Servers**: Google's public STUN for NAT traversal
- **TURN Servers**: (Optional) For restrictive networks

## 🏗️ Architecture

```
webrtc-mern-app/
├── server/
│   ├── index.js                  # Signaling server (Socket.IO)
│   ├── test-signaling.js         # Test script
│   └── package.json              # Server dependencies
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ExternalStream.jsx    # HLS streaming
│   │   │   └── WebRTCStream.jsx      # Screen/canvas streaming
│   │   ├── hooks/
│   │   │   └── useWebRTC.js          # WebRTC hook
│   │   ├── utils/
│   │   │   ├── webrtc.js             # WebRTC utilities
│   │   │   ├── signaling.js          # Signaling client
│   │   │   └── errorHandler.js       # Error handling
│   │   ├── App.jsx                   # Main app
│   │   └── main.jsx                  # Entry point
│   └── package.json              # Client dependencies
├── package.json                  # Root orchestration
├── README.md                     # Documentation
├── ARCHITECTURE.md               # Technical docs
├── PROJECT_SUMMARY.md            # Overview
├── QUICKSTART.md                 # Quick start guide
└── .gitignore
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern browser (Chrome, Firefox, Safari, Edge)
- HTTPS or localhost (required for camera/microphone access)

### Installation

1. **Install all dependencies** (automatically installs server + client):
```bash
npm install
```

2. **Start both server and client**:
```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Server
npm run server

# Terminal 2 - Client  
npm run client
```

- Server runs on `http://localhost:5000`
- Client runs on `http://localhost:3000`

### Testing

1. Open `http://localhost:3000` in two browser windows/tabs
2. In first window: Enter room ID (e.g., "test123") → Click "Create Room"
3. In second window: Enter same room ID → Click "Join Room"
4. Click "Start Video Call" in one window to initiate connection
5. Accept permissions for camera/microphone
6. Enjoy P2P video calling!

## 📖 Development Journey

### ✅ Step 1: Peer Signaling Server

**What**: Socket.IO-based signaling server for WebRTC metadata exchange.

**Why**: WebRTC peers need a signaling channel to exchange:
- SDP offers/answers (media capabilities)
- ICE candidates (network paths)
- Room management

**Files**: `server/index.js`

**Key Concepts**:
- WebRTC is transport-agnostic (doesn't dictate signaling)
- Signaling can be WebSocket, HTTP, or any messaging protocol
- Server acts as middleman, never handles media

**Testing**:
```bash
npm run server          # Start server
npm run test:signaling  # Run test script
```

### ✅ Step 2: ICE Candidates and Public IP Discovery

**What**: Configure RTCPeerConnection with STUN servers, log ICE candidates.

**Why**: 
- Most devices are behind NATs with private IPs
- ICE discovers multiple network paths (host, srflx, relay)
- STUN servers reveal public IP for NAT traversal

**Files**: Initial `client/src/App.jsx`

**Key Concepts**:
- **Host candidates**: Local network interfaces (192.168.x.x)
- **Srflx candidates**: Public IP from STUN (works through most NATs)
- **Relay candidates**: Via TURN server (guaranteed to work)

**ICE Flow**:
1. Browser discovers local interfaces
2. Queries STUN server for public IP
3. Tests connectivity with remote peer
4. Selects best path based on priority

**Testing**: Open app, click "Gather ICE Candidates", observe candidate types.

### ✅ Step 3: Frontend Peer Connection Setup

**What**: Complete WebRTC signaling flow with data channels.

**Why**: 
- Verify signaling works before adding media
- Data channels provide bidirectional messaging
- Foundation for media track exchange

**Files**: Enhanced `client/src/App.jsx`

**Signaling Flow**:
```
Peer A                  Signaling Server                 Peer B
  |                           |                              |
  |--- createOffer() -------->|                              |
  |<-- offer ----------------|-------- offer --------------->|
  |                           |                              |--- setRemoteDescription()
  |                           |                              |--- createAnswer()
  |                           |<------- answer -------------|
  |<-- answer ---------------|                              |
  |--- setRemoteDescription() |                              |
  |                           |                              |
  |<===== ICE candidates exchanged continuously ============>|
  |                           |                              |
  |<============== P2P Connection Established ==============>|
```

**Testing**: Create room in window 1, join from window 2, send data channel messages.

### ✅ Step 4: Voice Calling (Audio Only)

**What**: Add audio tracks using getUserMedia API.

**Why**:
- Verify media works before adding video
- Lower bandwidth than video
- Essential for voice-only scenarios

**Files**: Enhanced `client/src/App.jsx` with audio handling

**Key APIs**:
- `getUserMedia({ audio: true })`: Request microphone access
- `addTrack(track, stream)`: Add audio to peer connection
- `ontrack`: Receive remote audio
- `track.enabled`: Mute without renegotiation

**Audio Constraints**:
```javascript
audio: {
  echoCancellation: true,   // Reduce echo
  noiseSuppression: true,   // Reduce background noise
  autoGainControl: true     // Normalize volume
}
```

**Testing**: Start audio call, verify audio in both directions, test mute/unmute.

### ✅ Step 5: Video Calling (Audio + Video)

**What**: Extend media constraints to include video.

**Why**: Full-duplex audio/video communication.

**Files**: Enhanced `client/src/App.jsx` with video rendering

**Video Constraints**:
```javascript
video: {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 },
  facingMode: 'user'        // 'user' = front, 'environment' = back
}
```

**Important**:
- Add tracks BEFORE creating offer (avoid renegotiation)
- Use `track.enabled` for camera toggle (no renegotiation needed)
- Always stop tracks when done (releases camera/mic)

**Testing**: Start video call, toggle camera/microphone, verify both video feeds.

### ✅ Step 6: External Video Streaming Integration

**What**: Play HLS video streams from external sources.

**Why**: 
- Display live streams from external servers
- IP cameras, broadcast streams, CDN content
- Separate from P2P calling

**Files**: `client/src/components/ExternalStream.jsx`

**Streaming Options**:

| Method | Latency | Infrastructure | Use Case |
|--------|---------|----------------|----------|
| **HLS** | 2-30s | HTTP/CDN | VOD, broadcast, CDN |
| **WebRTC** | <1s | Media server | Real-time, interactive |
| **RTSP** | Low | Gateway needed | IP cameras |

**HLS Architecture**:
```
Video Source → Encoder → HLS Segments → CDN → Browser (hls.js)
```

**Testing**: 
- Use included sample streams
- Or provide your own HLS URL (.m3u8)

**Creating HLS from RTSP**:
```bash
ffmpeg -i rtsp://camera-ip:554/stream \
  -codec copy -f hls -hls_time 2 \
  -hls_list_size 5 output.m3u8
```

### ✅ Step 7: Streaming via Data/Media Channel

**What**: WebRTC-based streaming with screen sharing and canvas.

**Why**:
- Sub-second latency vs. HLS
- Screen sharing for presentations
- Canvas for graphics/overlays
- Foundation for WebRTC gateway integration

**Files**: `client/src/components/WebRTCStream.jsx`

**Streaming Methods**:

1. **Screen Sharing**:
   - `getDisplayMedia()`: Capture screen/window/tab
   - Treated as video track
   - User controls via browser UI

2. **Canvas Streaming**:
   - `canvas.captureStream()`: Generate video from canvas
   - Programmatic video generation
   - Compositing, overlays, graphics

3. **WebRTC Gateway** (conceptual):
   - Media server as virtual peer
   - Converts RTSP/RTMP → WebRTC
   - Examples: Janus, Mediasoup, Kurento

**Testing**: 
- Start screen share, verify in remote peer
- Start canvas stream, observe animated graphics

### ✅ Step 8: Architecture Cleanup

**What**: Refactor for production-grade code organization.

**Why**:
- Separation of concerns
- Reusable utilities
- Better error handling
- Easier testing and maintenance

**New Structure**:

```
client/src/
├── components/         # UI components
├── hooks/             # Custom React hooks
│   └── useWebRTC.js   # WebRTC logic hook
├── utils/             # Utilities
│   ├── webrtc.js      # WebRTC helpers
│   ├── signaling.js   # Signaling client
│   └── errorHandler.js # Error handling
```

**Key Improvements**:
- **Utilities**: Centralized WebRTC configuration and helpers
- **Signaling Client**: Clean abstraction for Socket.IO
- **Error Handler**: User-friendly error messages
- **Custom Hook**: Encapsulated WebRTC logic
- **Type Safety**: Better code organization for future TypeScript migration

**Testing**: All previous functionality works with cleaner code.

## 🔧 Configuration

### Environment Variables

Create `.env` in server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/webrtc
```

### TURN Server (Production)

For production, add TURN servers in `client/src/utils/webrtc.js`:

```javascript
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:turn.example.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ]
};
```

**TURN Providers**:
- Twilio (easiest)
- Xirsys
- Self-hosted (coturn)

## 📱 Browser Support

| Browser | WebRTC | Screen Share | Notes |
|---------|--------|--------------|-------|
| Chrome 90+ | ✅ | ✅ | Full support |
| Firefox 88+ | ✅ | ✅ | Full support |
| Safari 14+ | ✅ | ✅ | Native HLS |
| Edge 90+ | ✅ | ✅ | Chromium-based |

## 🐛 Troubleshooting

### No Video/Audio
- Check browser permissions (camera/microphone)
- Verify HTTPS or localhost
- Check console for errors

### Connection Failed
- Verify signaling server is running
- Check network connectivity
- May need TURN server for restrictive networks

### ICE Gathering Slow
- Normal for first connection
- STUN servers may be slow
- Consider adding multiple STUN servers

### Echo Issues
- Ensure `echoCancellation: true`
- Use headphones
- May need better audio constraints

## 🚀 Production Deployment

### Quick Deploy (Recommended)

**Server**: Render.com (Free tier available)  
**Client**: Vercel (Free tier available)  
**CI/CD**: GitHub Actions (Automated)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for complete step-by-step guide.

### Quick Start Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy Server (Render)**:
   - Go to https://render.com
   - New Web Service → Connect GitHub repo
   - Select `server` directory
   - Deploy (auto-detects Node.js)

3. **Deploy Client (Vercel)**:
   - Go to https://vercel.com
   - Import GitHub repo
   - Select `client` directory
   - Add env var: `VITE_SIGNALING_SERVER=<your-render-url>`
   - Deploy

4. **Configure CI/CD**:
   - Add GitHub secrets (see DEPLOYMENT.md)
   - Push to main → Auto-deploy! 🚀

### Deployment Scripts

**Windows (PowerShell)**:
```powershell
.\deploy.ps1
```

**Linux/Mac (Bash)**:
```bash
chmod +x deploy.sh
./deploy.sh
```

### Security Checklist
- [ ] Use HTTPS (required for getUserMedia)
- [ ] Restrict CORS origins to your domains
- [ ] Add authentication for rooms
- [ ] Rate limiting on signaling server
- [ ] Configure TURN server for production
- [ ] Monitor server logs and errors
- [ ] Set up error tracking (Sentry)
- [ ] Add uptime monitoring

## 📚 Key WebRTC Concepts

### SDP (Session Description Protocol)
- Describes media capabilities, codecs, formats
- Exchanged via offer/answer
- Not human-readable

### ICE (Interactive Connectivity Establishment)
- Finds best network path between peers
- Gathers candidates (host, srflx, relay)
- Tests connectivity, selects optimal path

### STUN (Session Traversal Utilities for NAT)
- Reveals public IP behind NAT
- Lightweight, typically free
- Used for candidate gathering

### TURN (Traversal Using Relays around NAT)
- Relays media when direct connection fails
- Required for ~8% of connections
- Bandwidth intensive, costs money

### Signaling
- Exchange of SDP and ICE candidates
- Not part of WebRTC spec
- Can use any transport (WebSocket, HTTP, etc.)

## 🤝 Contributing

This is a reference implementation. Feel free to:
- Add features
- Improve architecture
- Fix bugs
- Enhance documentation

## 📄 License

MIT License - feel free to use in your projects.

## 🙏 Acknowledgments

- WebRTC.org for excellent documentation
- Google for public STUN servers
- Sample stream providers for test content

## 📞 Support

For issues or questions:
1. Check troubleshooting section
2. Review WebRTC logs in console
3. Verify signaling server is running
4. Test with sample streams first

## 🔮 Future Enhancements

- [ ] MongoDB integration for persistent rooms
- [ ] User authentication
- [ ] Multi-party calling (SFU/MCU)
- [ ] Recording capabilities
- [ ] WebRTC statistics dashboard
- [ ] Mobile app (React Native)
- [ ] E2E encryption
- [ ] Simulcast support
- [ ] SVC (Scalable Video Coding)

---

**Built with ❤️ following WebRTC best practices**
