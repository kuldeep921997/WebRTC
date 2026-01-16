/**
 * STEP 1: Peer Signaling Server
 * 
 * Purpose: WebRTC peers need a signaling channel to exchange connection metadata.
 * This server acts as the middleman for:
 * - Room management (create/join)
 * - SDP offer/answer exchange (session description)
 * - ICE candidate exchange (network path discovery)
 * 
 * WebRTC does NOT handle signaling - it's transport agnostic.
 * We use Socket.IO over WebSocket for reliable, bidirectional messaging.
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Enable CORS for frontend communication
app.use(cors());
app.use(express.json());

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict to specific origins
    methods: ['GET', 'POST']
  }
});

// In-memory storage for rooms and participants
// Structure: { roomId: { participants: [socketId1, socketId2, ...] } }
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[SIGNALING] Client connected: ${socket.id}`);

  /**
   * CREATE_ROOM: Initialize a new room
   * User becomes the first participant
   */
  socket.on('create-room', (roomId, callback) => {
    console.log(`[SIGNALING] Creating room: ${roomId} by ${socket.id}`);
    
    if (rooms.has(roomId)) {
      callback({ success: false, message: 'Room already exists' });
      return;
    }

    rooms.set(roomId, { participants: [socket.id] });
    socket.join(roomId);
    socket.roomId = roomId; // Store room reference on socket
    
    console.log(`[SIGNALING] Room ${roomId} created. Participants: 1`);
    callback({ success: true, roomId, participantCount: 1 });
  });

  /**
   * JOIN_ROOM: Add user to existing room
   * Notifies existing participants that someone new joined
   */
  socket.on('join-room', (roomId, callback) => {
    console.log(`[SIGNALING] ${socket.id} attempting to join room: ${roomId}`);

    if (!rooms.has(roomId)) {
      callback({ success: false, message: 'Room does not exist' });
      return;
    }

    const room = rooms.get(roomId);
    room.participants.push(socket.id);
    socket.join(roomId);
    socket.roomId = roomId;

    console.log(`[SIGNALING] ${socket.id} joined room ${roomId}. Participants: ${room.participants.length}`);
    
    // Notify existing participants about the new joiner
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      participantCount: room.participants.length
    });

    callback({ 
      success: true, 
      roomId, 
      participantCount: room.participants.length,
      existingParticipants: room.participants.filter(id => id !== socket.id)
    });
  });

  /**
   * OFFER: WebRTC session initiation
   * Sender creates an SDP offer describing their media capabilities
   * Server forwards it to the target peer
   */
  socket.on('offer', ({ offer, targetId }) => {
    console.log(`[SIGNALING] Offer from ${socket.id} to ${targetId}`);
    console.log(`[SIGNALING] Offer type: ${offer.type}, SDP length: ${offer.sdp?.length || 0} bytes`);
    
    io.to(targetId).emit('offer', {
      offer,
      senderId: socket.id
    });
  });

  /**
   * ANSWER: WebRTC session acceptance
   * Receiver responds with their SDP answer
   * Server forwards it back to the offerer
   */
  socket.on('answer', ({ answer, targetId }) => {
    console.log(`[SIGNALING] Answer from ${socket.id} to ${targetId}`);
    console.log(`[SIGNALING] Answer type: ${answer.type}, SDP length: ${answer.sdp?.length || 0} bytes`);
    
    io.to(targetId).emit('answer', {
      answer,
      senderId: socket.id
    });
  });

  /**
   * ICE_CANDIDATE: Network path discovery
   * ICE (Interactive Connectivity Establishment) finds the best path between peers
   * Candidates represent potential connection endpoints (host, srflx, relay)
   * Server forwards candidates between peers for connectivity testing
   */
  socket.on('ice-candidate', ({ candidate, targetId }) => {
    console.log(`[SIGNALING] ICE candidate from ${socket.id} to ${targetId}`);
    console.log(`[SIGNALING] Candidate type: ${candidate?.type || 'unknown'}, protocol: ${candidate?.protocol || 'unknown'}`);
    
    io.to(targetId).emit('ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  /**
   * DISCONNECT: Cleanup when user leaves
   * Remove from room, notify others, cleanup resources
   */
  socket.on('disconnect', () => {
    console.log(`[SIGNALING] Client disconnected: ${socket.id}`);

    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.participants = room.participants.filter(id => id !== socket.id);

      console.log(`[SIGNALING] Removed ${socket.id} from room ${socket.roomId}. Remaining: ${room.participants.length}`);

      // Notify remaining participants
      socket.to(socket.roomId).emit('user-left', {
        userId: socket.id,
        participantCount: room.participants.length
      });

      // Delete room if empty
      if (room.participants.length === 0) {
        rooms.delete(socket.roomId);
        console.log(`[SIGNALING] Room ${socket.roomId} deleted (empty)`);
      }
    }
  });

  /**
   * GET_ROOM_INFO: Query room status
   * Useful for debugging and UI state
   */
  socket.on('get-room-info', (roomId, callback) => {
    if (!rooms.has(roomId)) {
      callback({ success: false, message: 'Room not found' });
      return;
    }

    const room = rooms.get(roomId);
    callback({
      success: true,
      roomId,
      participantCount: room.participants.length,
      participants: room.participants
    });
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    roomCount: rooms.size,
    timestamp: new Date().toISOString()
  });
});

// Get all rooms (for debugging)
app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([id, data]) => ({
    roomId: id,
    participantCount: data.participants.length
  }));
  res.json({ rooms: roomList });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[SERVER] Signaling server running on port ${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
  console.log(`[SERVER] Rooms endpoint: http://localhost:${PORT}/rooms`);
  console.log(`${'='.repeat(60)}\n`);
});
