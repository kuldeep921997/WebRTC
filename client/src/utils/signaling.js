/**
 * STEP 8: Architecture Cleanup - Signaling Utilities
 * 
 * Abstraction layer for signaling operations
 * Handles Socket.IO communication with signaling server
 */

import io from 'socket.io-client';

/**
 * Signaling Client Class
 * Manages WebSocket connection and signaling events
 */
export class SignalingClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.eventHandlers = {};
  }

  /**
   * Connect to signaling server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
          console.log('[Signaling] Connected:', this.socket.id);
          resolve(this.socket.id);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Signaling] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[Signaling] Disconnected:', reason);
          this.emit('disconnect', reason);
        });

        // Forward signaling events
        ['offer', 'answer', 'ice-candidate', 'user-joined', 'user-left'].forEach(event => {
          this.socket.on(event, (data) => {
            this.emit(event, data);
          });
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Create room
   */
  createRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to signaling server'));
        return;
      }

      this.socket.emit('create-room', roomId, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Join room
   */
  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to signaling server'));
        return;
      }

      this.socket.emit('join-room', roomId, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Send offer
   */
  sendOffer(offer, targetId) {
    if (!this.socket) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('offer', { offer, targetId });
  }

  /**
   * Send answer
   */
  sendAnswer(answer, targetId) {
    if (!this.socket) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('answer', { answer, targetId });
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(candidate, targetId) {
    if (!this.socket) {
      throw new Error('Not connected to signaling server');
    }
    this.socket.emit('ice-candidate', { candidate, targetId });
  }

  /**
   * Get room info
   */
  getRoomInfo(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected to signaling server'));
        return;
      }

      this.socket.emit('get-room-info', roomId, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  }

  /**
   * Event emitter for internal use
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  /**
   * Remove event handler
   */
  off(event, handler) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
  }

  /**
   * Emit event to handlers
   */
  emit(event, data) {
    if (!this.eventHandlers[event]) return;
    this.eventHandlers[event].forEach(handler => handler(data));
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.socket?.connected || false;
  }
}

/**
 * Create signaling client instance
 */
export const createSignalingClient = (serverUrl) => {
  return new SignalingClient(serverUrl);
};
