/**
 * STEP 8: Architecture Cleanup - WebRTC Utilities
 * 
 * Centralized WebRTC configuration and utilities
 * Separates business logic from UI components
 */

/**
 * ICE Server Configuration
 * STUN servers for NAT traversal
 * Add TURN servers for production (e.g., Twilio, Xirsys)
 */
export const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
    // Production: Add TURN servers
    // {
    //   urls: 'turn:turn.example.com:3478',
    //   username: 'user',
    //   credential: 'pass'
    // }
  ],
  // Optional: Configure ICE transport policy
  // iceTransportPolicy: 'relay' // Force TURN usage
};

/**
 * Media Constraints
 * Default constraints for getUserMedia
 */
export const MEDIA_CONSTRAINTS = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user'
  }
};

/**
 * Create RTCPeerConnection with standard configuration
 * @param {Function} onIceCandidate - Callback for ICE candidates
 * @param {Function} onTrack - Callback for remote tracks
 * @param {Function} onConnectionStateChange - Callback for connection state
 * @returns {RTCPeerConnection}
 */
export const createPeerConnection = (
  onIceCandidate,
  onTrack,
  onConnectionStateChange
) => {
  const pc = new RTCPeerConnection(ICE_SERVERS);

  pc.onicecandidate = (event) => {
    if (event.candidate && onIceCandidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.ontrack = (event) => {
    if (onTrack) {
      onTrack(event);
    }
  };

  pc.onconnectionstatechange = () => {
    if (onConnectionStateChange) {
      onConnectionStateChange(pc.connectionState);
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
  };

  pc.onicegatheringstatechange = () => {
    console.log('[WebRTC] ICE gathering state:', pc.iceGatheringState);
  };

  return pc;
};

/**
 * Get user media with error handling
 * @param {Object} constraints - Media constraints
 * @returns {Promise<MediaStream>}
 */
export const getUserMedia = async (constraints = MEDIA_CONSTRAINTS) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { success: true, stream };
  } catch (error) {
    console.error('[WebRTC] getUserMedia error:', error);
    return { 
      success: false, 
      error: error.message,
      errorType: error.name 
    };
  }
};

/**
 * Get display media (screen sharing)
 * @param {Object} constraints - Display constraints
 * @returns {Promise<MediaStream>}
 */
export const getDisplayMedia = async (constraints = {
  video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false
}) => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    return { success: true, stream };
  } catch (error) {
    console.error('[WebRTC] getDisplayMedia error:', error);
    return { 
      success: false, 
      error: error.message,
      errorType: error.name 
    };
  }
};

/**
 * Add media tracks to peer connection
 * @param {RTCPeerConnection} pc - Peer connection
 * @param {MediaStream} stream - Media stream
 */
export const addMediaTracks = (pc, stream) => {
  const senders = [];
  stream.getTracks().forEach(track => {
    const sender = pc.addTrack(track, stream);
    senders.push(sender);
  });
  return senders;
};

/**
 * Replace video track (for screen sharing, camera switching)
 * @param {RTCPeerConnection} pc - Peer connection
 * @param {MediaStreamTrack} newTrack - New video track
 */
export const replaceVideoTrack = async (pc, newTrack) => {
  const senders = pc.getSenders();
  const videoSender = senders.find(sender => sender.track?.kind === 'video');
  
  if (videoSender) {
    await videoSender.replaceTrack(newTrack);
    return { success: true };
  }
  
  return { success: false, error: 'No video sender found' };
};

/**
 * Toggle track enabled state
 * @param {MediaStream} stream - Media stream
 * @param {String} kind - Track kind ('audio' or 'video')
 * @param {Boolean} enabled - Enable or disable
 */
export const toggleTrack = (stream, kind, enabled) => {
  if (!stream) return false;
  
  stream.getTracks().forEach(track => {
    if (track.kind === kind) {
      track.enabled = enabled;
    }
  });
  
  return true;
};

/**
 * Stop all tracks in a stream
 * @param {MediaStream} stream - Media stream to stop
 */
export const stopMediaStream = (stream) => {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
  });
};

/**
 * Create data channel with standard configuration
 * @param {RTCPeerConnection} pc - Peer connection
 * @param {String} label - Channel label
 * @param {Object} options - Channel options
 */
export const createDataChannel = (pc, label = 'data', options = { ordered: true }) => {
  return pc.createDataChannel(label, options);
};

/**
 * Check WebRTC support
 * @returns {Object} Support status
 */
export const checkWebRTCSupport = () => {
  return {
    rtcPeerConnection: !!window.RTCPeerConnection,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    getDisplayMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
    webSocket: !!window.WebSocket
  };
};
