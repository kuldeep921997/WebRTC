/**
 * STEP 7: Streaming via Data/Media Channel
 * 
 * WebRTC-Based Streaming Options:
 * 
 * 1. Screen Sharing:
 *    - getDisplayMedia() captures screen/window/tab
 *    - Treated as a video track, added to peer connection
 *    - Sub-second latency
 *    - Perfect for screen sharing, presentations, game streaming
 * 
 * 2. Canvas Streaming:
 *    - captureStream() on canvas element
 *    - Generate video programmatically
 *    - Useful for graphics, animations, overlays
 *    - Can composite multiple sources
 * 
 * 3. WebRTC Gateway (Media Server):
 *    - Treat media server as a virtual peer
 *    - Server handles RTSP/RTMP → WebRTC conversion
 *    - Examples: Janus Gateway, Mediasoup, Kurento
 *    - Sub-second latency, bidirectional
 * 
 * 4. Data Channel Streaming:
 *    - Send raw data chunks via data channel
 *    - Useful for file transfer, custom protocols
 *    - Not recommended for video (use media tracks instead)
 * 
 * Key Differences from HLS (Step 6):
 * - WebRTC: <1s latency, requires signaling, P2P or media server
 * - HLS: 2-30s latency, HTTP-based, works with CDNs
 * 
 * This implementation shows:
 * - Screen sharing as media track
 * - Canvas streaming as media track
 * - How to integrate with WebRTC gateway (conceptual)
 */

import React, { useState, useRef, useEffect } from 'react';

const WebRTCStream = ({ peerConnection, onLog, remotePeerId, socket }) => {
  const [screenStream, setScreenStream] = useState(null);
  const [canvasStream, setCanvasStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isCanvasStreaming, setIsCanvasStreaming] = useState(false);
  
  const screenVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasVideoRef = useRef(null);
  const animationRef = useRef(null);

  const screenStreamRef = useRef(null);
  const canvasStreamRef = useRef(null);

  const addLog = (message, type = 'info') => {
    if (onLog) onLog(message, type);
  };

  /**
   * Screen Sharing via getDisplayMedia
   * Captures screen, window, or browser tab
   */
  const startScreenShare = async () => {
    try {
      addLog('🖥️ Requesting screen share...', 'info');

      /**
       * getDisplayMedia constraints
       * - video: required for screen capture
       * - audio: optional, captures system audio
       */
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: false // Set true to capture system audio
      });

      addLog('✅ Screen capture started', 'success');
      
      screenStreamRef.current = stream;
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Display locally
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
      }

      /**
       * Add screen track to peer connection
       * This replaces the camera video track with screen track
       */
      if (peerConnection) {
        const videoTrack = stream.getVideoTracks()[0];
        
        // Find existing video sender and replace track
        const senders = peerConnection.getSenders();
        const videoSender = senders.find(sender => sender.track?.kind === 'video');
        
        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
          addLog('✅ Screen track added to peer connection (replaced camera)', 'success');
        } else {
          peerConnection.addTrack(videoTrack, stream);
          addLog('✅ Screen track added to peer connection', 'success');
        }
      } else {
        addLog('⚠️ No peer connection. Screen visible locally only.', 'info');
      }

      /**
       * Handle user stopping share via browser UI
       * Browser provides stop button when sharing screen
       */
      stream.getVideoTracks()[0].onended = () => {
        addLog('🖥️ Screen sharing stopped by user', 'info');
        stopScreenShare();
      };

    } catch (error) {
      addLog(`❌ Screen share failed: ${error.message}`, 'error');
    }
  };

  /**
   * Stop screen sharing
   */
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      addLog('✅ Screen sharing stopped', 'info');
    }
  };

  /**
   * Canvas Streaming
   * Generate video from canvas and stream it
   */
  const startCanvasStream = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    addLog('🎨 Starting canvas stream...', 'info');

    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    /**
     * Animate canvas content
     * This is just a demo - you can draw anything:
     * - Overlays, graphics, text
     * - Composite multiple video sources
     * - Real-time data visualization
     */
    let frame = 0;
    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw animated elements
      const time = Date.now() / 1000;
      
      // Animated circle
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + Math.cos(time) * 200,
        canvas.height / 2 + Math.sin(time) * 150,
        50,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `hsl(${frame % 360}, 70%, 60%)`;
      ctx.fill();

      // Text overlay
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`WebRTC Canvas Stream`, canvas.width / 2, 50);
      ctx.font = '20px Arial';
      ctx.fillText(`Frame: ${frame}`, canvas.width / 2, 450);

      // Animated bars
      for (let i = 0; i < 10; i++) {
        const height = Math.sin(time + i * 0.5) * 100 + 100;
        ctx.fillStyle = `hsl(${(frame + i * 36) % 360}, 70%, 50%)`;
        ctx.fillRect(i * 64, canvas.height - height, 60, height);
      }

      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    /**
     * Capture canvas as MediaStream
     * frameRate: FPS for the stream (higher = smoother but more bandwidth)
     */
    const stream = canvas.captureStream(30);
    
    canvasStreamRef.current = stream;
    setCanvasStream(stream);
    setIsCanvasStreaming(true);

    // Display locally
    if (canvasVideoRef.current) {
      canvasVideoRef.current.srcObject = stream;
    }

    addLog('✅ Canvas stream started', 'success');

    /**
     * Add canvas track to peer connection
     */
    if (peerConnection) {
      const videoTrack = stream.getVideoTracks()[0];
      
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(sender => sender.track?.kind === 'video');
      
      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
        addLog('✅ Canvas track added to peer connection (replaced camera)', 'success');
      } else {
        peerConnection.addTrack(videoTrack, stream);
        addLog('✅ Canvas track added to peer connection', 'success');
      }
    } else {
      addLog('⚠️ No peer connection. Canvas visible locally only.', 'info');
    }
  };

  /**
   * Stop canvas streaming
   */
  const stopCanvasStream = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (canvasStreamRef.current) {
      canvasStreamRef.current.getTracks().forEach(track => track.stop());
      canvasStreamRef.current = null;
      setCanvasStream(null);
      setIsCanvasStreaming(false);
      addLog('✅ Canvas stream stopped', 'info');
    }
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopScreenShare();
      stopCanvasStream();
    };
  }, []);

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ color: '#61dafb' }}>🎥 WebRTC-Based Streaming</h2>

      <div className="info-box" style={{ borderLeftColor: '#61dafb' }}>
        <h3>🚀 Low-Latency Streaming</h3>
        <ul>
          <li><strong>Screen Share:</strong> Capture screen/window/tab - perfect for presentations</li>
          <li><strong>Canvas Stream:</strong> Programmatic video generation - overlays, graphics</li>
          <li><strong>WebRTC Gateway:</strong> Connect to media server for RTSP/RTMP sources</li>
          <li><strong>Latency:</strong> Sub-second (vs. 2-30s for HLS)</li>
        </ul>
      </div>

      {/* Screen Sharing */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>🖥️ Screen Sharing</h3>
        <div className="controls" style={{ marginBottom: '15px' }}>
          {!isScreenSharing ? (
            <button onClick={startScreenShare}>
              🖥️ Start Screen Share
            </button>
          ) : (
            <button onClick={stopScreenShare} style={{ background: '#f44336' }}>
              ⏹️ Stop Screen Share
            </button>
          )}
        </div>

        {isScreenSharing && (
          <div style={{ 
            background: '#000', 
            borderRadius: '10px', 
            overflow: 'hidden'
          }}>
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                maxHeight: '400px',
                display: 'block',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </div>

      {/* Canvas Streaming */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>🎨 Canvas Streaming</h3>
        <div className="controls" style={{ marginBottom: '15px' }}>
          {!isCanvasStreaming ? (
            <button onClick={startCanvasStream}>
              🎨 Start Canvas Stream
            </button>
          ) : (
            <button onClick={stopCanvasStream} style={{ background: '#f44336' }}>
              ⏹️ Stop Canvas Stream
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Canvas (hidden, just for generation) */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h4 style={{ marginBottom: '10px', fontSize: '0.9em' }}>Canvas Source:</h4>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                background: '#000',
                borderRadius: '10px',
                display: isCanvasStreaming ? 'block' : 'none'
              }}
            />
          </div>

          {/* Video Preview */}
          {isCanvasStreaming && (
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.9em' }}>Streamed Output:</h4>
              <div style={{ 
                background: '#000', 
                borderRadius: '10px', 
                overflow: 'hidden'
              }}>
                <video
                  ref={canvasVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    display: 'block'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WebRTC Gateway Info */}
      <div className="info-box" style={{ borderLeftColor: '#4CAF50' }}>
        <h3>🌐 Consuming Streams from WebRTC Gateway</h3>
        <p style={{ marginBottom: '10px' }}>
          To stream from external sources (IP cameras, RTSP streams) with low latency:
        </p>
        <ol>
          <li><strong>Setup Media Server:</strong> Janus Gateway, Mediasoup, Kurento, MediaMTX</li>
          <li><strong>Ingest Source:</strong> Server converts RTSP/RTMP to WebRTC</li>
          <li><strong>Connect as Peer:</strong> Treat server as a peer in your signaling</li>
          <li><strong>Receive Track:</strong> Use ontrack event to receive stream</li>
        </ol>
        <p style={{ marginTop: '15px', fontSize: '0.9em' }}>
          <strong>Example with Janus Gateway:</strong>
        </p>
        <code style={{ display: 'block', marginTop: '5px', padding: '10px', background: '#1a1a1a', fontSize: '0.85em' }}>
          {`// Connect to Janus WebRTC server\nconst pc = new RTCPeerConnection(config);\npc.ontrack = (event) => {\n  // Receive stream from media server\n  remoteVideo.srcObject = event.streams[0];\n};\n\n// Create offer and exchange via Janus signaling\nconst offer = await pc.createOffer();\nawait pc.setLocalDescription(offer);\n\n// Send to Janus via HTTP/WebSocket\nawait fetch('https://janus-server/offer', {\n  method: 'POST',\n  body: JSON.stringify({ sdp: offer })\n});`}
        </code>
        <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#888' }}>
          <strong>Trade-off:</strong> WebRTC gateway requires more infrastructure than HLS, 
          but provides sub-second latency essential for interactive applications.
        </p>
      </div>

      {!peerConnection && (
        <div style={{
          background: '#ff98004d',
          border: '2px solid #ff9800',
          borderRadius: '5px',
          padding: '15px',
          marginTop: '20px'
        }}>
          <strong>⚠️ Note:</strong> No active peer connection. Streams are visible locally only. 
          Create a room and connect to a peer to share these streams.
        </div>
      )}
    </div>
  );
};

export default WebRTCStream;
