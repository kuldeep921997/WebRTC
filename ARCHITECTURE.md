# Architecture Documentation

## Project Overview

This is a production-grade WebRTC MERN application built incrementally, following WebRTC best practices. Each component is designed with separation of concerns, reusability, and maintainability in mind.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser Client 1                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React UI   │  │   WebRTC     │  │  Socket.IO Client    │  │
│  │              │  │   Peer       │  │  (Signaling)         │  │
│  │  Components  │  │   Connection │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────┬──────────────────────┬─────────────────┘
                         │                      │
                    Media (P2P)            Signaling
                         │                      │
                         │                 ┌────▼────┐
                         │                 │ Node.js │
                         │                 │ Express │
                         │                 │Socket.IO│
                         │                 │ Server  │
                         │                 └────┬────┘
                         │                      │
                    Media (P2P)            Signaling
                         │                      │
┌────────────────────────▼──────────────────────▼─────────────────┐
│                         Browser Client 2                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   React UI   │  │   WebRTC     │  │  Socket.IO Client    │  │
│  │              │  │   Peer       │  │  (Signaling)         │  │
│  │  Components  │  │   Connection │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ STUN Servers │  │ HLS Streams  │  │  TURN Servers        │  │
│  │ (Google)     │  │ (CDN/Media)  │  │  (Optional)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Backend (server/)

#### `server/index.js`
**Purpose**: Signaling server for WebRTC peer coordination

**Responsibilities**:
- Room management (create/join/leave)
- SDP offer/answer forwarding
- ICE candidate relay
- User presence tracking

**Key Events**:
- `create-room`: Initialize new room
- `join-room`: Add user to existing room
- `offer`: Forward SDP offer to target peer
- `answer`: Forward SDP answer to target peer
- `ice-candidate`: Relay ICE candidates
- `disconnect`: Cleanup on user disconnect

**Design Decisions**:
- In-memory storage (Map) for MVP speed
- Ready to migrate to Redis for horizontal scaling
- No media handling (P2P architecture)

### Frontend (client/src/)

#### `App.jsx`
**Purpose**: Main application component

**Responsibilities**:
- Room management UI
- Call controls (start/end/mute/toggle)
- Local/remote video rendering
- Data channel messaging
- Log aggregation

**State Management**:
- Socket connection
- Peer connection
- Media streams (local/remote)
- UI state (mute, video enable, connection state)

#### `components/ExternalStream.jsx`
**Purpose**: HLS video streaming component

**Responsibilities**:
- HLS stream playback using hls.js
- Quality level management
- Stream statistics display
- Error handling

**Why Separate**:
- HLS != WebRTC (different latency/use cases)
- Can be used independently
- Different lifecycle management

#### `components/WebRTCStream.jsx`
**Purpose**: WebRTC-based streaming (screen/canvas)

**Responsibilities**:
- Screen sharing via getDisplayMedia
- Canvas streaming via captureStream
- Track replacement in peer connection

**Why Separate**:
- Optional advanced features
- Can be added to existing calls
- Different user interactions

### Utilities (client/src/utils/)

#### `webrtc.js`
**Purpose**: WebRTC helper functions and configuration

**Exports**:
- `ICE_SERVERS`: STUN/TURN configuration
- `MEDIA_CONSTRAINTS`: Default media settings
- `createPeerConnection()`: Factory with callbacks
- `getUserMedia()`: Promisified with error handling
- `getDisplayMedia()`: Screen capture helper
- `addMediaTracks()`: Track management
- `replaceVideoTrack()`: Dynamic track switching
- `toggleTrack()`: Mute/unmute
- `stopMediaStream()`: Cleanup
- `checkWebRTCSupport()`: Feature detection

**Design Pattern**: Pure functions, no side effects

#### `signaling.js`
**Purpose**: Signaling client abstraction

**Class**: `SignalingClient`
- Encapsulates Socket.IO logic
- Promise-based API
- Event emitter for callbacks

**Methods**:
- `connect()`: Initialize connection
- `createRoom(roomId)`: Create room
- `joinRoom(roomId)`: Join existing room
- `sendOffer(offer, targetId)`: Send offer
- `sendAnswer(answer, targetId)`: Send answer
- `sendIceCandidate(candidate, targetId)`: Send candidate
- `disconnect()`: Cleanup

**Why Class**: Stateful connection management, easy testing

#### `errorHandler.js`
**Purpose**: Centralized error handling

**Exports**:
- `ErrorTypes`: Enum of error categories
- `parseError()`: Convert browser errors to types
- `getErrorMessage()`: User-friendly messages
- `handleWebRTCError()`: Log and notify
- `retryOperation()`: Retry with backoff
- `logErrorToService()`: External logging (placeholder)

**Design Pattern**: Error categorization for better UX

### Hooks (client/src/hooks/)

#### `useWebRTC.js`
**Purpose**: Encapsulate WebRTC logic in React hook

**State**:
- Peer connection
- Local/remote streams
- Connection state
- Audio/video enabled state

**Actions**:
- `initializePeerConnection()`
- `startMedia(mode)`
- `stopMedia()`
- `toggleAudio()`
- `toggleVideo()`
- `createOffer()`
- `createAnswer()`
- `setRemoteDescription()`
- `addIceCandidate()`
- `cleanup()`

**Benefits**:
- Reusable across components
- Testable in isolation
- Clean component code

## Data Flow

### Call Initiation Flow

```
User A (Initiator)                    Server                    User B (Receiver)
      |                                 |                              |
      |--- Create Room ---------------→ |                              |
      |← Room Created ----------------- |                              |
      |                                 |                              |
      |                                 | ←--- Join Room -------------|
      |                                 | --- Room Joined -----------→|
      |← User Joined Event ----------- |                              |
      |                                 |                              |
      |--- Start Media (camera/mic)     |                              |
      |--- Initialize PeerConnection    |                              |
      |--- Create Offer ---------------→|--- Forward Offer ----------→|
      |                                 |                              |--- Set Remote Desc
      |                                 |                              |--- Create Answer
      |                                 |← Forward Answer ------------|
      |← Set Remote Desc               |                              |
      |                                 |                              |
      |←==== ICE Candidates Exchanged ==========================→|
      |                                 |                              |
      |←========== P2P Media Connection Established ===========→|
      |                                 |                              |
      |← Receive Remote Stream         |                              |
      |                                 |                              |← Receive Remote Stream
```

### ICE Gathering Flow

```
Browser                    STUN Server                  Remote Peer
   |                            |                             |
   |--- Create Offer            |                             |
   |--- Set Local Description   |                             |
   |                            |                             |
   |=== ICE Gathering Start === |                             |
   |                            |                             |
   |--- Host Candidates --------|                             |
   |    (local IPs)             |                             |
   |                            |                             |
   |--- STUN Request ----------→|                             |
   |← STUN Response ------------|                             |
   |    (public IP)             |                             |
   |                            |                             |
   |--- Srflx Candidates -------|                             |
   |    (public IP)             |                             |
   |                            |                             |
   |--- Send Candidates --------→ [Via Signaling] ----------→|
   |                            |                             |--- Add ICE Candidate
   |                            |                             |
   |← Receive Candidates ←------ [Via Signaling] ------------|
   |--- Add ICE Candidate       |                             |
   |                            |                             |
   |←====== Connectivity Checks ============================→|
   |                            |                             |
   |←========== Best Path Selected =========================→|
```

## Security Considerations

### Current Implementation
- ✅ STUN for NAT traversal
- ✅ Socket.IO for reliable signaling
- ✅ CORS enabled (restrict in production)
- ✅ Input validation on room IDs

### Production Requirements
- [ ] HTTPS mandatory (getUserMedia requirement)
- [ ] Authentication (JWT/OAuth)
- [ ] Room access control
- [ ] Rate limiting on signaling
- [ ] TURN server authentication
- [ ] E2E encryption for data channels
- [ ] Content Security Policy
- [ ] Sanitize user inputs

## Performance Considerations

### Bandwidth Usage
- **Audio**: ~50 kbps
- **Video (720p)**: 1-2 Mbps
- **Screen Share**: 2-5 Mbps (varies by content)
- **Data Channel**: Minimal (<10 kbps)

### Optimization Strategies
1. **Adaptive Bitrate**: WebRTC adjusts automatically
2. **Simulcast**: Send multiple quality levels (advanced)
3. **SVC**: Scalable Video Coding (advanced)
4. **Track Management**: Stop unused tracks
5. **Stats Monitoring**: Track bitrate, packet loss

### Latency
- **P2P Media**: <100ms (ideal)
- **Data Channel**: <50ms
- **HLS Stream**: 2-30s (acceptable for VOD)
- **Signaling**: <100ms (WebSocket)

## Scalability

### Current Architecture
- Single signaling server
- P2P media (no server load)
- In-memory room storage

### Scaling Strategies

#### Horizontal Scaling (Signaling)
1. Multiple signaling servers
2. Redis for shared room state
3. Load balancer with sticky sessions
4. Service discovery

#### Media Scaling (Advanced)
1. **SFU (Selective Forwarding Unit)**:
   - Server receives from all, forwards to all
   - Lower bandwidth per client
   - Server CPU load

2. **MCU (Multipoint Control Unit)**:
   - Server mixes all streams
   - Single stream to each client
   - High server CPU load

3. **Mesh (Current)**:
   - P2P between all peers
   - No server load
   - High client bandwidth (N-1 connections)

## Testing Strategy

### Unit Tests
- WebRTC utilities (pure functions)
- Error handler logic
- Signaling client methods

### Integration Tests
- Signaling flow (offer/answer/ICE)
- Media track handling
- Room management

### E2E Tests
- Full call flow
- Screen sharing
- External streaming
- Error scenarios

### Manual Testing Checklist
- [ ] Create/join room
- [ ] Audio-only call
- [ ] Video call
- [ ] Screen sharing
- [ ] Canvas streaming
- [ ] HLS playback
- [ ] Mute/unmute
- [ ] Camera toggle
- [ ] Network interruption
- [ ] Reconnection
- [ ] Multiple tabs
- [ ] Different browsers

## Future Architecture Enhancements

1. **MongoDB Integration**
   - Persistent rooms
   - User profiles
   - Call history

2. **Authentication Layer**
   - JWT-based auth
   - Room passwords
   - User permissions

3. **Media Server (SFU)**
   - Multi-party calls (>2 participants)
   - Recording capabilities
   - Stream mixing

4. **Analytics**
   - WebRTC stats collection
   - Quality monitoring
   - Usage analytics

5. **Mobile Support**
   - React Native app
   - WebRTC mobile SDK
   - Push notifications

## References

- [WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [IETF RFCs](https://datatracker.ietf.org/wg/rtcweb/documents/)
- [WebRTC Samples](https://webrtc.github.io/samples/)

---

**Last Updated**: Step 8 - Architecture Cleanup Complete
