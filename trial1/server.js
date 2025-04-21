const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the current directory for static files
app.use(express.static(__dirname));

// Serve landing.html as the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

// WebSocket connection handling
io.on('connection', socket => {
  console.log('A user connected');

  // Notify other users when a new user joins
  socket.on('join-video-call', ({ username }) => {
    socket.broadcast.emit('user-joined', { username, id: socket.id });
  });


  // Handle WebRTC signaling
  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('ice-candidate', data => socket.broadcast.emit('ice-candidate', data));

  // Handle chat messages
  socket.on('chat-message', ({ username, message }) => {
    console.log(`Message from ${username}: ${message}`);
    socket.broadcast.emit('chat-message', { username, message });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
server.listen(3000, () => console.log('Server running on http://localhost:3000'));