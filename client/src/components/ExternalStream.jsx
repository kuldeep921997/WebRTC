/**
 * STEP 6: External Video Streaming Integration
 * 
 * External Streaming Options:
 * 
 * 1. HLS (HTTP Live Streaming):
 *    - HTTP-based adaptive streaming
 *    - Wide browser support (native on Safari, hls.js for others)
 *    - Higher latency (2-30 seconds) but reliable
 *    - Good for one-to-many broadcasting
 *    - Uses standard web servers, no special infrastructure
 * 
 * 2. WebRTC-based streaming:
 *    - Sub-second latency
 *    - Requires WebRTC media server (Janus, Mediasoup, etc.)
 *    - More complex setup but better for real-time
 *    - Can be a "virtual peer" in your WebRTC mesh
 * 
 * 3. RTSP (Real-Time Streaming Protocol):
 *    - Common for IP cameras
 *    - Needs gateway to convert to browser-compatible format
 *    - Usually converted to WebRTC or HLS for browser playback
 * 
 * This implementation uses HLS with hls.js:
 * - Easy to integrate
 * - Works with existing video CDNs
 * - No special server infrastructure needed
 * - Fallback to native HLS on Safari
 * 
 * Trade-offs:
 * - Higher latency than WebRTC (acceptable for most use cases)
 * - One-way stream (can't send data back to source easily)
 * - Bandwidth efficient (adaptive bitrate)
 * 
 * For true low-latency bidirectional streaming, would need WebRTC gateway
 * (covered in Step 7)
 */

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const ExternalStream = ({ onLog }) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  
  const [streamUrl, setStreamUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamStats, setStreamStats] = useState({
    buffered: 0,
    currentTime: 0,
    duration: 0,
    bitrate: 0
  });
  const [error, setError] = useState(null);

  const addLog = (message, type = 'info') => {
    if (onLog) onLog(message, type);
  };

  /**
   * Sample HLS streams for testing
   * These are public test streams commonly used for development
   */
  const sampleStreams = [
    {
      name: 'Big Buck Bunny (Akamai)',
      url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
    },
    {
      name: 'Apple Test Stream',
      url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8'
    },
    {
      name: 'Tears of Steel (Blender)',
      url: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8'
    }
  ];

  /**
   * Initialize HLS player
   * hls.js handles adaptive bitrate streaming and segment downloading
   */
  const loadStream = (url) => {
    if (!url) {
      addLog('⚠️ Please enter a stream URL', 'error');
      return;
    }

    setError(null);
    addLog(`🔄 Loading HLS stream: ${url}`, 'info');

    const video = videoRef.current;
    if (!video) return;

    /**
     * Check if HLS is natively supported (Safari)
     * Otherwise use hls.js for browsers that don't support HLS natively
     */
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      addLog('✅ Native HLS support detected (Safari)', 'success');
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        addLog('✅ Stream metadata loaded', 'success');
        video.play().catch(err => {
          addLog(`❌ Autoplay failed: ${err.message}`, 'error');
        });
      });
    } else if (Hls.isSupported()) {
      addLog('✅ Using hls.js for HLS playback', 'success');
      
      // Cleanup previous instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Set true for LL-HLS
        backBufferLength: 90
      });
      
      hlsRef.current = hls;

      /**
       * HLS Events
       * Monitor stream loading, quality changes, and errors
       */
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        addLog(`✅ Manifest parsed. ${data.levels.length} quality levels available`, 'success');
        
        // Log available quality levels
        data.levels.forEach((level, index) => {
          addLog(`   Level ${index}: ${level.width}x${level.height} @ ${Math.round(level.bitrate / 1000)}kbps`, 'info');
        });

        // Start playback
        video.play().catch(err => {
          addLog(`⚠️ Autoplay blocked. Click play button. (${err.message})`, 'error');
        });
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        addLog(`📊 Quality switched to ${level.width}x${level.height}`, 'info');
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          addLog(`❌ Fatal HLS error: ${data.type} - ${data.details}`, 'error');
          setError(`${data.type}: ${data.details}`);
          
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              addLog('🔄 Network error, attempting recovery...', 'info');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              addLog('🔄 Media error, attempting recovery...', 'info');
              hls.recoverMediaError();
              break;
            default:
              addLog('❌ Unrecoverable error', 'error');
              hls.destroy();
              break;
          }
        } else {
          addLog(`⚠️ HLS warning: ${data.details}`, 'info');
        }
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        // Update bitrate stats
        const bitrate = Math.round(data.frag.stats.loaded * 8 / data.frag.stats.loading.end - data.frag.stats.loading.start);
        setStreamStats(prev => ({ ...prev, bitrate }));
      });

      // Load stream
      hls.loadSource(url);
      hls.attachMedia(video);

    } else {
      addLog('❌ HLS is not supported in this browser', 'error');
      setError('HLS not supported. Please use a modern browser.');
    }
  };

  /**
   * Stop stream and cleanup
   */
  const stopStream = () => {
    addLog('⏹️ Stopping stream...', 'info');
    
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = '';
    }

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setIsPlaying(false);
    setError(null);
    setStreamStats({
      buffered: 0,
      currentTime: 0,
      duration: 0,
      bitrate: 0
    });
    
    addLog('✅ Stream stopped', 'success');
  };

  /**
   * Update stream stats
   */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateStats = () => {
      if (video.buffered.length > 0) {
        const buffered = video.buffered.end(video.buffered.length - 1) - video.currentTime;
        setStreamStats(prev => ({
          ...prev,
          buffered,
          currentTime: video.currentTime,
          duration: video.duration
        }));
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      addLog('▶️ Stream playing', 'success');
    };

    const handlePause = () => {
      setIsPlaying(false);
      addLog('⏸️ Stream paused', 'info');
    };

    const handleWaiting = () => {
      addLog('⏳ Buffering...', 'info');
    };

    const handleCanPlay = () => {
      addLog('✅ Stream ready to play', 'success');
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', updateStats);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', updateStats);
    };
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, []);

  return (
    <div style={{ marginTop: '30px' }}>
      <h2 style={{ color: '#ffd700' }}>📡 External Video Stream</h2>

      <div className="info-box" style={{ borderLeftColor: '#ffd700' }}>
        <h3>🔌 Stream Source Options</h3>
        <ul>
          <li><strong>HLS (Current):</strong> HTTP Live Streaming - reliable, 2-30s latency</li>
          <li><strong>WebRTC Gateway:</strong> Sub-second latency - requires media server</li>
          <li><strong>RTSP Camera:</strong> Needs gateway to convert to browser format</li>
        </ul>
        <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#888' }}>
          <strong>Trade-off:</strong> HLS is easier to integrate but has higher latency. 
          For real-time bidirectional streaming, use WebRTC gateway (Step 7).
        </p>
      </div>

      {/* Sample Streams */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>🎬 Sample Streams</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {sampleStreams.map((stream, index) => (
            <button
              key={index}
              onClick={() => {
                setStreamUrl(stream.url);
                loadStream(stream.url);
              }}
              style={{ fontSize: '0.9em' }}
            >
              {stream.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL Input */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>🔗 Custom HLS Stream</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Enter HLS stream URL (.m3u8)"
            value={streamUrl}
            onChange={(e) => setStreamUrl(e.target.value)}
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
          <button onClick={() => loadStream(streamUrl)}>
            ▶️ Load Stream
          </button>
          <button onClick={stopStream} disabled={!isPlaying}>
            ⏹️ Stop
          </button>
        </div>
      </div>

      {/* Video Player */}
      <div style={{ 
        background: '#000', 
        borderRadius: '10px', 
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video
          ref={videoRef}
          controls
          style={{
            width: '100%',
            maxHeight: '500px',
            display: 'block'
          }}
        />
      </div>

      {/* Stream Statistics */}
      {isPlaying && (
        <div style={{ 
          background: '#2a2a2a', 
          borderRadius: '5px', 
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '1.1em', marginBottom: '10px' }}>📊 Stream Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <strong>Current Time:</strong> {streamStats.currentTime.toFixed(2)}s
            </div>
            <div>
              <strong>Duration:</strong> {isFinite(streamStats.duration) ? streamStats.duration.toFixed(2) + 's' : 'Live'}
            </div>
            <div>
              <strong>Buffer:</strong> {streamStats.buffered.toFixed(2)}s
            </div>
            <div>
              <strong>Bitrate:</strong> {streamStats.bitrate > 0 ? `${Math.round(streamStats.bitrate / 1000)}kbps` : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#f443364d', 
          border: '2px solid #f44336',
          borderRadius: '5px', 
          padding: '15px',
          marginBottom: '20px',
          color: '#f44336'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div className="info-box" style={{ borderLeftColor: '#4CAF50' }}>
        <h3>💡 How to use your own stream:</h3>
        <ol>
          <li><strong>IP Camera:</strong> Use RTSP URL with a gateway like FFmpeg to convert to HLS</li>
          <li><strong>OBS/Streaming Software:</strong> Stream to media server that outputs HLS</li>
          <li><strong>Media Server:</strong> Use Nginx with RTMP module, Node-Media-Server, or cloud services</li>
          <li><strong>WebRTC Gateway:</strong> Use Janus, Mediasoup, or similar (covered in Step 7)</li>
        </ol>
        <p style={{ marginTop: '10px', fontSize: '0.9em' }}>
          <strong>Example FFmpeg command to convert RTSP to HLS:</strong>
        </p>
        <code style={{ display: 'block', marginTop: '5px', padding: '10px', background: '#1a1a1a' }}>
          ffmpeg -i rtsp://camera-ip:554/stream -c copy -f hls output.m3u8
        </code>
      </div>
    </div>
  );
};

export default ExternalStream;
