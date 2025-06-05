const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 4000;

// Start server
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Initialize Socket.io
const io = require('socket.io')(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Track connected sockets
let socketsConnected = new Set();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);
  socketsConnected.add(socket.id);
  io.emit('clients-total', socketsConnected.size);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
    socketsConnected.delete(socket.id);
    io.emit('clients-total', socketsConnected.size);
  });

  // Handle messages with file size check
  socket.on('message', (data) => {
    if (data.file) {
      const estimatedSize = (data.file.data.length * 3) / 4; // Base64 size estimate
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (estimatedSize > maxSize) {
        console.log(`⚠️ File too large (${(estimatedSize / (1024 * 1024)).toFixed(2)} MB). Rejected.`);
        socket.emit('error-message', 'File size exceeds 10MB limit.');
        return;
      }
    }

    console.log('📨 Message received:', data);
    socket.broadcast.emit('chat-message', data);
  });

  // Typing feedback
  socket.on('feedback', (data) => {
    socket.broadcast.emit('feedback', data);
  });
});
