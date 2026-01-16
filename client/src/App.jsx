/**
 * STEP 5: Video Calling (Audio + Video)
 * STEP 6: External Video Streaming Integration (HLS)
 * 
 * Adding Video to WebRTC:
 * 
 * getUserMedia with video:
 * - Request both audio and video
 * - Browser shows camera/microphone permission prompt
 * - Returns MediaStream with both audio and video tracks
 * 
 * Video Tracks:
 * - Each video track represents a camera feed
 * - Can specify constraints: resolution, framerate, facingMode
 * - Added to peer connection same as audio tracks
 * 
 * Video Elements:
 * - <video> element displays video stream
 * - srcObject = MediaStream attaches stream to element
 * - autoPlay starts playback immediately
 * - playsInline prevents fullscreen on iOS
 * 
 * Important Considerations:
 * - Bandwidth: Video requires much more bandwidth than audio
 * - Resolution negotiation happens during offer/answer
 * - Can toggle video without renegotiation using track.enabled
 * - Always stop tracks when done to release camera/microphone
 */

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import ExternalStream from './components/ExternalStream';
import WebRTCStream from './components/WebRTCStream';

const SIGNALING_SERVER = import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:5000';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [dataChannel, setDataChannel] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [logs, setLogs] = useState([]);
  const [remotePeerId, setRemotePeerId] = useState(null);
  
  // Media state
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callMode, setCallMode] = useState('video'); // 'audio' or 'video'
  
  // Media elements
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Use refs to access latest state in callbacks
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    const socketConnection = io(SIGNALING_SERVER);
    socketRef.current = socketConnection;
    
    socketConnection.on('connect', () => {
      addLog(`✅ Connected to signaling server (ID: ${socketConnection.id})`, 'success');
      setSocket(socketConnection);
    });

    socketConnection.on('disconnect', () => {
      addLog('❌ Disconnected from signaling server', 'error');
    });

    socketConnection.on('offer', async ({ offer, senderId }) => {
      addLog(`📥 Received offer from ${senderId}`, 'info');
      setRemotePeerId(senderId);
      
      if (!peerConnectionRef.current) {
        const pc = createPeerConnection(senderId);
        
        pc.ondatachannel = (event) => {
          addLog('📡 Data channel received from remote peer', 'success');
          setupDataChannel(event.channel);
        };
        
        peerConnectionRef.current = pc;
        setPeerConnection(pc);
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
        addLog('✅ Remote description (offer) set', 'success');

        addLog('📝 Creating answer...', 'info');
        const answer = await peerConnectionRef.current.createAnswer();
        
        await peerConnectionRef.current.setLocalDescription(answer);
        addLog('✅ Local description (answer) set', 'success');

        socketConnection.emit('answer', { answer, targetId: senderId });
        addLog('📤 Answer sent to remote peer', 'info');
      } catch (error) {
        addLog(`❌ Error handling offer: ${error.message}`, 'error');
      }
    });

    socketConnection.on('answer', async ({ answer, senderId }) => {
      addLog(`📥 Received answer from ${senderId}`, 'info');
      
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          addLog('✅ Remote description (answer) set', 'success');
        } catch (error) {
          addLog(`❌ Error setting remote description: ${error.message}`, 'error');
        }
      }
    });

    socketConnection.on('ice-candidate', async ({ candidate, senderId }) => {
      addLog(`🧊 Received ICE candidate from ${senderId}`, 'info');
      
      if (peerConnectionRef.current && candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          addLog('✅ ICE candidate added', 'success');
        } catch (error) {
          addLog(`❌ Error adding ICE candidate: ${error.message}`, 'error');
        }
      }
    });

    socketConnection.on('user-joined', ({ userId }) => {
      addLog(`👥 User ${userId} joined the room`, 'info');
      setRemotePeerId(userId);
    });

    socketConnection.on('user-left', ({ userId }) => {
      addLog(`👋 User ${userId} left the room`, 'info');
      cleanup();
    });

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  /**
   * Attach local stream to video element
   */
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  /**
   * Attach remote stream to video element
   */
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  /**
   * Request media access (audio and/or video)
   */
  const startCall = async (mode = 'video') => {
    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };

      /**
       * Video constraints
       * - width/height: Preferred resolution
       * - frameRate: Preferred FPS
       * - facingMode: 'user' (front camera) or 'environment' (back camera)
       * 
       * Browser will try to match constraints but may use closest available
       */
      if (mode === 'video') {
        addLog('🎥 Requesting camera and microphone access...', 'info');
        constraints.video = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user'
        };
      } else {
        addLog('🎤 Requesting microphone access...', 'info');
        constraints.video = false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const audioTracks = stream.getAudioTracks().length;
      const videoTracks = stream.getVideoTracks().length;
      addLog(`✅ Media access granted. Audio: ${audioTracks}, Video: ${videoTracks}`, 'success');
      
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCallActive(true);
      setCallMode(mode);
      
      // Log track details
      stream.getTracks().forEach(track => {
        addLog(`🎵 ${track.kind} track: ${track.label}`, 'info');
        if (track.kind === 'video') {
          const settings = track.getSettings();
          addLog(`📹 Video: ${settings.width}x${settings.height} @ ${settings.frameRate}fps`, 'info');
        }
      });

      // If peer connection exists, add tracks
      if (peerConnectionRef.current) {
        addMediaTracks(peerConnectionRef.current, stream);
      }
      
    } catch (error) {
      addLog(`❌ Media access denied: ${error.message}`, 'error');
      alert(`Media access denied: ${error.message}\n\nPlease allow camera/microphone access and try again.`);
    }
  };

  /**
   * Add media tracks to peer connection
   */
  const addMediaTracks = (pc, stream) => {
    addLog('➕ Adding media tracks to peer connection...', 'info');
    
    stream.getTracks().forEach(track => {
      const sender = pc.addTrack(track, stream);
      addLog(`✅ ${track.kind} track added: ${track.label}`, 'success');
    });
  };

  /**
   * Create RTCPeerConnection with media handlers
   */
  const createPeerConnection = (remotePeer) => {
    addLog('🔧 Creating RTCPeerConnection...', 'info');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          candidate: event.candidate,
          targetId: remotePeer
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      addLog(`📊 ICE connection state: ${state}`, state === 'connected' ? 'success' : 'info');
      
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        addLog('⚠️ Connection lost or failed', 'error');
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);
      addLog(`📊 Connection state: ${state}`, state === 'connected' ? 'success' : 'info');
      
      if (state === 'connected') {
        addLog('🎉 Peer connection established!', 'success');
      }
    };

    /**
     * ontrack: Receive remote media tracks
     * Can receive multiple tracks (audio + video)
     * Each track triggers this event separately
     */
    pc.ontrack = (event) => {
      addLog(`📹 Received remote ${event.track.kind} track`, 'success');
      
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        addLog('✅ Remote media stream set', 'success');
      } else {
        const stream = new MediaStream([event.track]);
        setRemoteStream(stream);
        addLog('✅ Remote media stream created from track', 'success');
      }
    };

    // If local stream exists, add tracks immediately
    if (localStreamRef.current) {
      addMediaTracks(pc, localStreamRef.current);
    }

    addLog('✅ RTCPeerConnection created', 'success');
    return pc;
  };

  /**
   * Setup data channel
   */
  const setupDataChannel = (channel) => {
    channel.onopen = () => {
      addLog('✅ Data channel opened', 'success');
      setMessages(prev => [...prev, { 
        type: 'system', 
        text: 'Data channel connected!',
        timestamp: new Date().toISOString()
      }]);
    };

    channel.onclose = () => {
      addLog('❌ Data channel closed', 'error');
    };

    channel.onerror = (error) => {
      addLog(`❌ Data channel error: ${error}`, 'error');
    };

    channel.onmessage = (event) => {
      setMessages(prev => [...prev, {
        type: 'received',
        text: event.data,
        timestamp: new Date().toISOString()
      }]);
    };

    dataChannelRef.current = channel;
    setDataChannel(channel);
  };

  /**
   * Create room
   */
  const createRoom = () => {
    if (!roomId.trim()) {
      addLog('⚠️ Please enter a room ID', 'error');
      return;
    }

    socket?.emit('create-room', roomId, (response) => {
      if (response.success) {
        addLog(`✅ Room created: ${roomId}`, 'success');
        setCurrentRoom(roomId);
      } else {
        addLog(`❌ Failed to create room: ${response.message}`, 'error');
      }
    });
  };

  /**
   * Join room
   */
  const joinRoom = () => {
    if (!roomId.trim()) {
      addLog('⚠️ Please enter a room ID', 'error');
      return;
    }

    socket?.emit('join-room', roomId, (response) => {
      if (response.success) {
        addLog(`✅ Joined room: ${roomId}`, 'success');
        setCurrentRoom(roomId);
        
        if (response.existingParticipants && response.existingParticipants.length > 0) {
          const remotePeer = response.existingParticipants[0];
          setRemotePeerId(remotePeer);
        }
      } else {
        addLog(`❌ Failed to join room: ${response.message}`, 'error');
      }
    });
  };

  /**
   * Initiate call to remote peer
   */
  const initiateCall = async (mode = 'video') => {
    if (!remotePeerId) {
      addLog('⚠️ No remote peer to call', 'error');
      return;
    }

    if (!localStreamRef.current) {
      await startCall(mode);
    }

    addLog(`📞 Initiating ${mode} call to ${remotePeerId}...`, 'info');
    
    const pc = createPeerConnection(remotePeerId);
    peerConnectionRef.current = pc;
    setPeerConnection(pc);

    const channel = pc.createDataChannel('messaging', { ordered: true });
    setupDataChannel(channel);

    try {
      addLog('📝 Creating offer...', 'info');
      const offer = await pc.createOffer();
      
      await pc.setLocalDescription(offer);
      addLog('✅ Local description (offer) set', 'success');

      socketRef.current?.emit('offer', { offer, targetId: remotePeerId });
      addLog('📤 Offer sent to remote peer', 'info');
    } catch (error) {
      addLog(`❌ Error creating offer: ${error.message}`, 'error');
    }
  };

  /**
   * Toggle microphone mute
   */
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      addLog(`🎤 Microphone ${!isAudioEnabled ? 'unmuted' : 'muted'}`, 'info');
    }
  };

  /**
   * Toggle video on/off
   * Uses track.enabled to avoid renegotiation
   */
  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      addLog(`📹 Video ${!isVideoEnabled ? 'enabled' : 'disabled'}`, 'info');
    }
  };

  /**
   * End call and cleanup
   */
  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`⏹️ Stopped ${track.kind} track: ${track.label}`, 'info');
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setIsCallActive(false);
    setIsAudioEnabled(true);
    setIsVideoEnabled(true);
    addLog('📞 Call ended', 'info');
    
    cleanup();
  };

  /**
   * Send message via data channel
   */
  const sendMessage = () => {
    if (!messageInput.trim()) return;

    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      dataChannelRef.current.send(messageInput);
      
      setMessages(prev => [...prev, {
        type: 'sent',
        text: messageInput,
        timestamp: new Date().toISOString()
      }]);
      
      setMessageInput('');
    } else {
      addLog('⚠️ Data channel not open', 'error');
    }
  };

  /**
   * Cleanup connection
   */
  const cleanup = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
      setDataChannel(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      setPeerConnection(null);
    }

    setRemoteStream(null);
    setConnectionState('disconnected');
    setRemotePeerId(null);
    addLog('🧹 Connection cleaned up', 'info');
  };

  /**
   * Leave room
   */
  const leaveRoom = () => {
    endCall();
    setCurrentRoom(null);
    setMessages([]);
    addLog('👋 Left room', 'info');
  };

  return (
    <div className="app">
      <h1>🌐 WebRTC MERN App - Video Calling + Streaming</h1>

      <div className="info-box">
        <h3>📚 Application Features</h3>
        <ul>
          <li><strong>P2P Calling:</strong> Direct peer-to-peer audio/video calls via WebRTC</li>
          <li><strong>External Streaming:</strong> Play live video streams from external sources (HLS)</li>
          <li><strong>Data Channel:</strong> Real-time messaging alongside media</li>
          <li><strong>ICE/STUN:</strong> NAT traversal for connecting peers across networks</li>
        </ul>
      </div>

      {!currentRoom ? (
        <>
          <h2>🚪 Join or Create Room</h2>
          <div className="controls">
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{
                padding: '12px',
                fontSize: '1em',
                borderRadius: '5px',
                border: '2px solid #444',
                background: '#2a2a2a',
                color: '#fff',
                flex: 1,
                maxWidth: '300px'
              }}
            />
            <button onClick={createRoom} disabled={!socket}>
              📦 Create Room
            </button>
            <button onClick={joinRoom} disabled={!socket}>
              🚪 Join Room
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="status">
            <p><strong>Room:</strong> {currentRoom}</p>
            <p><strong>Your ID:</strong> {socket?.id}</p>
            <p><strong>Remote Peer:</strong> {remotePeerId || 'Waiting...'}</p>
            <p><strong>Connection State:</strong> {connectionState}</p>
            <p><strong>Call Status:</strong> {isCallActive ? `📞 ${callMode === 'video' ? 'Video' : 'Audio'} Active` : '⏸️ Inactive'}</p>
            <p><strong>Microphone:</strong> {isCallActive ? (isAudioEnabled ? '🎤 On' : '🔇 Muted') : '❌ Off'}</p>
            {callMode === 'video' && <p><strong>Camera:</strong> {isCallActive ? (isVideoEnabled ? '📹 On' : '🚫 Off') : '❌ Off'}</p>}
            <p><strong>Remote Stream:</strong> {remoteStream ? '✅ Receiving' : '❌ Not receiving'}</p>
          </div>

          {/* Video Display */}
          {isCallActive && callMode === 'video' && (
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {/* Local Video */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ marginBottom: '10px', color: '#61dafb' }}>📹 Your Video</h3>
                <div style={{ position: 'relative', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      display: 'block',
                      objectFit: 'cover'
                    }}
                  />
                  {!isVideoEnabled && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#1a1a1a',
                      fontSize: '3em'
                    }}>
                      📷
                    </div>
                  )}
                </div>
              </div>

              {/* Remote Video */}
              <div style={{ flex: 1, minWidth: '300px' }}>
                <h3 style={{ marginBottom: '10px', color: '#4CAF50' }}>📹 Remote Video</h3>
                <div style={{ position: 'relative', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      display: 'block',
                      objectFit: 'cover'
                    }}
                  />
                  {!remoteStream && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#1a1a1a',
                      fontSize: '3em',
                      color: '#666'
                    }}>
                      ⏳ Waiting...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <h2>📞 Call Controls</h2>
          <div className="controls">
            {!isCallActive ? (
              <>
                <button onClick={() => startCall('video')}>
                  🎥 Start Video Call
                </button>
                <button onClick={() => startCall('audio')}>
                  🎤 Start Audio Only
                </button>
              </>
            ) : (
              <>
                <button onClick={toggleMute}>
                  {isAudioEnabled ? '🔇 Mute' : '🎤 Unmute'}
                </button>
                {callMode === 'video' && (
                  <button onClick={toggleVideo}>
                    {isVideoEnabled ? '🚫 Stop Video' : '📹 Start Video'}
                  </button>
                )}
                <button onClick={endCall} style={{ background: '#f44336' }}>
                  📞 End Call
                </button>
              </>
            )}
            
            {remotePeerId && !peerConnection && (
              <>
                <button onClick={() => initiateCall('video')}>
                  🎥 Video Call {remotePeerId.substring(0, 8)}...
                </button>
                <button onClick={() => initiateCall('audio')}>
                  🎤 Audio Call {remotePeerId.substring(0, 8)}...
                </button>
              </>
            )}
            
            <button onClick={leaveRoom}>
              👋 Leave Room
            </button>
          </div>

          {dataChannel && dataChannel.readyState === 'open' && (
            <>
              <h2>💬 Data Channel Messages</h2>
              <div style={{ 
                background: '#2a2a2a', 
                borderRadius: '5px', 
                padding: '15px',
                marginBottom: '20px',
                minHeight: '150px',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {messages.length === 0 ? (
                  <div style={{ color: '#888' }}>No messages yet.</div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      margin: '6px 0',
                      borderRadius: '5px',
                      background: msg.type === 'sent' ? '#1e3a5f' : msg.type === 'received' ? '#1e5f3a' : '#444',
                      textAlign: msg.type === 'sent' ? 'right' : 'left'
                    }}>
                      <div style={{ fontSize: '0.9em' }}>{msg.text}</div>
                      <div style={{ fontSize: '0.7em', color: '#888', marginTop: '4px' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  style={{
                    padding: '12px',
                    fontSize: '1em',
                    borderRadius: '5px',
                    border: '2px solid #444',
                    background: '#2a2a2a',
                    color: '#fff',
                    flex: 1
                  }}
                />
                <button onClick={sendMessage}>
                  📤 Send
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* WebRTC-Based Streaming Component */}
      <WebRTCStream 
        peerConnection={peerConnection}
        onLog={addLog}
        remotePeerId={remotePeerId}
        socket={socket}
      />

      {/* External Video Stream Component (HLS) */}
      <ExternalStream onLog={addLog} />

      <h2>📋 Event Logs</h2>
      <div className="log-container" style={{ maxHeight: '300px' }}>
        {logs.length === 0 ? (
          <div style={{ color: '#888' }}>No logs yet. Create or join a room to start.</div>
        ) : (
          logs.slice(-50).map((log, i) => (
            <div key={i} className="log-entry">
              <span className="log-timestamp">{log.timestamp}</span>
              <span className="log-message" style={{
                color: log.type === 'success' ? '#4CAF50' : log.type === 'error' ? '#f44336' : '#0f0'
              }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;
