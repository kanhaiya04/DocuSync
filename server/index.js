const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const logger = require("./logger");
const requestLogger = require("./middleware/requestLogger");
const app = express();
dotenv.config({ path: "../.env" });
app.use(express.json());
app.use(cors());
app.use(requestLogger);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {},
});

(async function () {
  try {
    await mongoose.connect(process.env.mongoDb);
    logger.info("Successfully connected to MongoDB");
  } catch (error) {
    logger.error("Error connecting to database:", error);
    process.exit(1);
  }
})();

app.use("/user/", require("./routes/userRoutes"));
app.use("/doc/", require("./routes/docRoutes"));

// Test endpoint for socket.io
app.get("/test-socket", (req, res) => {
  res.json({ 
    message: "Socket.io server is running", 
    timestamp: Date.now(),
    rooms: Array.from(io.sockets.adapter.rooms.keys()),
    connectedClients: io.sockets.sockets.size,
    serverStatus: "running"
  });
});

// Debug endpoint for room presence
app.get("/debug/presence", (req, res) => {
  const presenceData = {};
  for (const [roomId, users] of roomPresence.entries()) {
    presenceData[roomId] = Array.from(users);
  }
  
  res.json({
    roomPresence: presenceData,
    totalRooms: roomPresence.size,
    totalUsers: Array.from(roomPresence.values()).reduce((sum, users) => sum + users.size, 0)
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: Date.now(),
    services: {
      socketio: "running",
      yjs: "running",
      mongodb: "connected"
    }
  });
});

// Create Yjs WebSocket server
const { WebSocketServer } = require('ws');

// Store WebSocket clients for each room
const rooms = new Map();

// Attach WebSocket server to the same HTTP server (for Render deployment)
const wss = new WebSocketServer({ 
  noServer: true,
  perMessageDeflate: false,
  clientTracking: true  // Enable client tracking for broadcasting
});

// Handle HTTP server upgrade for WebSocket connections
httpServer.on('upgrade', (request, socket, head) => {
  const pathname = request.url;
  
  logger.info('WebSocket upgrade request:', pathname);
  
  // Only handle Yjs WebSocket connections (path starts with /yjs/)
  if (pathname && pathname.startsWith('/yjs/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      logger.info('Yjs WebSocket upgraded successfully for:', pathname);
      wss.emit('connection', ws, request);
    });
  } else {
    // Let Socket.io or other services handle it
    logger.info('Non-Yjs WebSocket upgrade, ignoring');
  }
});

wss.on('error', (error) => {
  logger.error('Yjs WebSocket server error:', error);
});

// Handle Yjs WebSocket connections - pure message relay
wss.on('connection', (ws, req) => {
  logger.info('Yjs WebSocket connection attempt:', req.url);
  
  // Extract room ID from URL path (format: /yjs/roomId)
  let roomId = null;
  if (req.url && req.url.startsWith('/yjs/')) {
    const urlParts = req.url.split('/').filter(p => p);
    if (urlParts.length >= 2) {
      roomId = urlParts[1].split('?')[0];
      logger.info('Extracted room ID:', roomId);
    }
  }
  
  if (!roomId) {
    logger.info('No room ID provided in URL:', req.url);
    ws.close(1000, 'Room ID required. Use format: /yjs/roomId');
    return;
  }
  
  logger.info('Client connected to room:', roomId);
  
  // Add client to room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
    logger.info(`Created room: ${roomId}`);
  }
  rooms.get(roomId).add(ws);
  logger.info(`Room ${roomId} now has ${rooms.get(roomId).size} client(s)`);
  
  // Simple message relay - forward all messages to other clients in the same room
  ws.on('message', (message) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    let broadcastCount = 0;
    room.forEach((client) => {
      if (client !== ws && client.readyState === 1) {
        client.send(message, { binary: true });
        broadcastCount++;
      }
    });
    
    logger.info(`Relayed message in room ${roomId} to ${broadcastCount} client(s), message size: ${message.length} bytes`);
  });
  
  ws.on('close', () => {
    logger.info(`Client disconnected from room: ${roomId}`);
    const room = rooms.get(roomId);
    if (room) {
      room.delete(ws);
      logger.info(`Room ${roomId} now has ${room.size} client(s)`);
      if (room.size === 0) {
        rooms.delete(roomId);
        logger.info(`Room ${roomId} deleted (empty)`);
      }
    }
  });
  
  ws.on('error', (error) => {
    logger.error('Yjs WebSocket error:', error);
  });
  
  logger.info('Yjs connection established for room:', roomId);
});

// Store room presence data
const roomPresence = new Map(); // roomId -> Set of userIds

io.on("connection", (socket) => {
  logger.info("User connected:", socket.id);
  
  socket.on("join-room", (data) => {
    logger.info('Received join-room data:', data);
    // Handle both old format (just roomid) and new format (object with roomid and user info)
    const roomid = typeof data === 'string' ? data : data.roomId;
    const userName = typeof data === 'object' ? data.userName : `User ${socket.id.slice(0, 4)}`;
    
    logger.info('Extracted roomid:', roomid);
    logger.info('Extracted userName:', userName);
    
    if (!roomid || typeof roomid !== 'string') {
      logger.error("Invalid room ID received:", roomid);
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }
    
    socket.join(roomid);
    logger.info(`User ${socket.id} (${userName}) joined room: ${roomid}`);
    logger.info(`Current users in room ${roomid}:`, Array.from(roomPresence.get(roomid)?.keys() || []));
    
    // Initialize room presence if it doesn't exist
    if (!roomPresence.has(roomid)) {
      roomPresence.set(roomid, new Map()); // Change to Map to store user info
    }
    
    // Add user to room presence with their info (only if not already present)
    if (!roomPresence.get(roomid).has(socket.id)) {
      roomPresence.get(roomid).set(socket.id, {
        userId: socket.id,
        userName: userName,
        timestamp: Date.now()
      });
      logger.info(`Added new user ${socket.id} to room ${roomid}`);
    } else {
      logger.info(`User ${socket.id} already exists in room ${roomid}, skipping duplicate join`);
      return; // Exit early to prevent duplicate processing
    }
    
    // Send current users in room to the new user
    const currentUsers = Array.from(roomPresence.get(roomid).values())
      .filter(user => user.userId !== socket.id) // Exclude self
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        timestamp: user.timestamp
      }));
    
    // Send existing users to the new user
    if (currentUsers.length > 0) {
      socket.emit('existing-users', currentUsers);
    }
    
    // Broadcast new user presence to existing users in the room
    socket.to(roomid).emit('user-joined', {
      userId: socket.id,
      userName: userName,
      timestamp: Date.now()
    });
  });

  socket.on("msg", (payload, roomid) => {
    logger.info("Received message:", { payload, roomid, from: socket.id });
    
    if (!roomid || typeof roomid !== 'string') {
      logger.error("Invalid room ID for message:", roomid);
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }
    if (!payload) {
      logger.error("Invalid message payload:", payload);
      socket.emit("error", { message: "Invalid message payload" });
      return;
    }
    
    // Log the room and connected clients
    const room = io.sockets.adapter.rooms.get(roomid);
    logger.info(`Broadcasting message to room ${roomid}, clients in room:`, room ? room.size : 0);
    
    // Broadcast to all clients in the room (including sender)
    io.to(roomid).emit("msg", payload);
    logger.info("Message broadcasted successfully");
  });

  socket.on("cursor-position", (data) => {
    if (!data.roomId || typeof data.roomId !== 'string') {
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }
    socket.to(data.roomId).emit('cursor-position', {
      userId: socket.id,
      position: data.position,
      selection: data.selection
    });
  });

  socket.on("leave-room", (roomid) => {
    if (!roomid || typeof roomid !== 'string') {
      socket.emit("error", { message: "Invalid room ID" });
      return;
    }
    
    // Remove user from room presence
    if (roomPresence.has(roomid)) {
      roomPresence.get(roomid).delete(socket.id);
      // Clean up empty rooms
      if (roomPresence.get(roomid).size === 0) {
        roomPresence.delete(roomid);
      }
    }
    
    socket.leave(roomid);
    socket.to(roomid).emit('user-left', {
      userId: socket.id,
      timestamp: Date.now()
    });
    logger.info(`User ${socket.id} left room: ${roomid}`);
  });
  
  socket.on("disconnect", (reason) => {
    logger.info("User disconnected:", socket.id, "Reason:", reason);
    
    // Clean up user from all rooms
    for (const [roomid, users] of roomPresence.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        // Notify other users in the room
        socket.to(roomid).emit('user-left', {
          userId: socket.id,
          timestamp: Date.now()
        });
        // Clean up empty rooms
        if (users.size === 0) {
          roomPresence.delete(roomid);
        }
      }
    }
  });

  socket.on("error", (error) => {
    logger.error("Socket error for", socket.id, ":", error);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
