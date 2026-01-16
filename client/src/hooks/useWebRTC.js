/**
 * STEP 8: Architecture Cleanup - Custom React Hook
 * 
 * Encapsulates WebRTC logic in a reusable hook
 * Simplifies component code and promotes reusability
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  createPeerConnection, 
  getUserMedia, 
  addMediaTracks,
  stopMediaStream,
  toggleTrack,
  MEDIA_CONSTRAINTS
} from '../utils/webrtc';
import { handleWebRTCError } from '../utils/errorHandler';

/**
 * useWebRTC Hook
 * Manages WebRTC peer connection state and operations
 */
export const useWebRTC = (signalingClient, remotePeerId, onLog) => {
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  /**
   * Handle ICE candidate
   */
  const handleIceCandidate = useCallback((candidate) => {
    if (signalingClient && remotePeerId) {
      try {
        signalingClient.sendIceCandidate(candidate, remotePeerId);
        if (onLog) onLog('🧊 ICE candidate sent', 'info');
      } catch (error) {
        handleWebRTCError(error, 'Sending ICE candidate', onLog);
      }
    }
  }, [signalingClient, remotePeerId, onLog]);

  /**
   * Handle remote track
   */
  const handleTrack = useCallback((event) => {
    if (event.streams && event.streams[0]) {
      setRemoteStream(event.streams[0]);
      if (onLog) onLog('✅ Remote stream received', 'success');
    }
  }, [onLog]);

  /**
   * Handle connection state change
   */
  const handleConnectionStateChange = useCallback((state) => {
    setConnectionState(state);
    if (onLog) onLog(`📊 Connection state: ${state}`, state === 'connected' ? 'success' : 'info');
  }, [onLog]);

  /**
   * Initialize peer connection
   */
  const initializePeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      if (onLog) onLog('⚠️ Peer connection already exists', 'info');
      return peerConnectionRef.current;
    }

    const pc = createPeerConnection(
      handleIceCandidate,
      handleTrack,
      handleConnectionStateChange
    );

    // Add local tracks if available
    if (localStreamRef.current) {
      addMediaTracks(pc, localStreamRef.current);
    }

    peerConnectionRef.current = pc;
    setPeerConnection(pc);

    if (onLog) onLog('✅ Peer connection initialized', 'success');
    return pc;
  }, [handleIceCandidate, handleTrack, handleConnectionStateChange, onLog]);

  /**
   * Start local media
   */
  const startMedia = useCallback(async (mode = 'video') => {
    try {
      const constraints = {
        audio: MEDIA_CONSTRAINTS.audio,
        video: mode === 'video' ? MEDIA_CONSTRAINTS.video : false
      };

      const result = await getUserMedia(constraints);
      
      if (!result.success) {
        handleWebRTCError(new Error(result.error), 'Getting user media', onLog);
        return { success: false, error: result.error };
      }

      localStreamRef.current = result.stream;
      setLocalStream(result.stream);

      // Add tracks to peer connection if it exists
      if (peerConnectionRef.current) {
        addMediaTracks(peerConnectionRef.current, result.stream);
      }

      if (onLog) onLog(`✅ ${mode === 'video' ? 'Camera and microphone' : 'Microphone'} started`, 'success');
      return { success: true, stream: result.stream };

    } catch (error) {
      handleWebRTCError(error, 'Starting media', onLog);
      return { success: false, error: error.message };
    }
  }, [onLog]);

  /**
   * Stop local media
   */
  const stopMedia = useCallback(() => {
    if (localStreamRef.current) {
      stopMediaStream(localStreamRef.current);
      localStreamRef.current = null;
      setLocalStream(null);
      setIsAudioEnabled(true);
      setIsVideoEnabled(true);
      if (onLog) onLog('⏹️ Media stopped', 'info');
    }
  }, [onLog]);

  /**
   * Toggle audio
   */
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isAudioEnabled;
      toggleTrack(localStreamRef.current, 'audio', newState);
      setIsAudioEnabled(newState);
      if (onLog) onLog(`🎤 Microphone ${newState ? 'unmuted' : 'muted'}`, 'info');
    }
  }, [isAudioEnabled, onLog]);

  /**
   * Toggle video
   */
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isVideoEnabled;
      toggleTrack(localStreamRef.current, 'video', newState);
      setIsVideoEnabled(newState);
      if (onLog) onLog(`📹 Camera ${newState ? 'enabled' : 'disabled'}`, 'info');
    }
  }, [isVideoEnabled, onLog]);

  /**
   * Create offer
   */
  const createOffer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      return { success: false, error: 'No peer connection' };
    }

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      if (onLog) onLog('✅ Offer created', 'success');
      return { success: true, offer };
    } catch (error) {
      handleWebRTCError(error, 'Creating offer', onLog);
      return { success: false, error: error.message };
    }
  }, [onLog]);

  /**
   * Create answer
   */
  const createAnswer = useCallback(async () => {
    if (!peerConnectionRef.current) {
      return { success: false, error: 'No peer connection' };
    }

    try {
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      if (onLog) onLog('✅ Answer created', 'success');
      return { success: true, answer };
    } catch (error) {
      handleWebRTCError(error, 'Creating answer', onLog);
      return { success: false, error: error.message };
    }
  }, [onLog]);

  /**
   * Set remote description
   */
  const setRemoteDescription = useCallback(async (description) => {
    if (!peerConnectionRef.current) {
      return { success: false, error: 'No peer connection' };
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(description));
      if (onLog) onLog('✅ Remote description set', 'success');
      return { success: true };
    } catch (error) {
      handleWebRTCError(error, 'Setting remote description', onLog);
      return { success: false, error: error.message };
    }
  }, [onLog]);

  /**
   * Add ICE candidate
   */
  const addIceCandidate = useCallback(async (candidate) => {
    if (!peerConnectionRef.current) {
      return { success: false, error: 'No peer connection' };
    }

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      if (onLog) onLog('✅ ICE candidate added', 'success');
      return { success: true };
    } catch (error) {
      handleWebRTCError(error, 'Adding ICE candidate', onLog);
      return { success: false, error: error.message };
    }
  }, [onLog]);

  /**
   * Cleanup
   */
  const cleanup = useCallback(() => {
    stopMedia();
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      setPeerConnection(null);
    }

    setRemoteStream(null);
    setConnectionState('new');
    
    if (onLog) onLog('🧹 WebRTC cleaned up', 'info');
  }, [stopMedia, onLog]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    // State
    peerConnection,
    localStream,
    remoteStream,
    connectionState,
    isAudioEnabled,
    isVideoEnabled,
    
    // Actions
    initializePeerConnection,
    startMedia,
    stopMedia,
    toggleAudio,
    toggleVideo,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    cleanup
  };
};
