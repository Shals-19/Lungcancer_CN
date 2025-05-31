const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const userPublicKeys = new Map();

// Serve the current directory for static files
app.use(express.static(path.join(__dirname, 'public')));


// Serve landing.html as the default page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname,'public', 'landing.html'));
});

// Maintain a list of connected users for video streaming
const videoUsers = new Map();

// --- Text Chat Participants Logic ---
const textChatParticipants = new Map();

// WebSocket connection handling
io.on('connection', socket => {

  socket.on('public-key', ({ username, key }) => {
  userPublicKeys.set(username, key);

  // Send all public keys to all users
  io.emit('public-keys', Object.fromEntries(userPublicKeys));
});
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
  socket.on('chat-message', ({ from, to, message }) => {
  console.log(`Encrypted message from ${from} to ${to}:`, message);
  io.emit('chat-message', { from, to, message }); // 🔁 Must include 'to'!
});



  // Handle video stream joining
  socket.on('join-video-stream', ({ username }) => {
    console.log(`${username} joined the video stream`);

    // Add the new user to the list
    videoUsers.set(socket.id, username);

    // Notify the new user about existing users
    socket.emit('existing-video-users', Array.from(videoUsers.entries()));

    // Notify other users about the new user
    socket.broadcast.emit('user-joined-video', { username, id: socket.id });
  });

  // Handle video stream data
  socket.on('video-stream', ({ id, stream }) => {
    // Broadcast the video stream to all other users
    socket.broadcast.emit('video-stream', { id, stream });
  });

  // Handle request for video streams from new users
  socket.on('request-video-stream', ({ id }) => {
    if (videoUsers.has(id)) {
      const username = videoUsers.get(id);
      socket.emit('user-joined-video', { username, id });
    }
  });

  // --- Text Chat Participants Join/Leave ---
  socket.on('join-text-chat', ({ username, time }) => {
    textChatParticipants.set(socket.id, { name: username, time });
    io.emit('participants-update', Array.from(textChatParticipants.values()));
  });

  // Notify others when a user disconnects from video stream
  socket.on('disconnect', () => {
    if (videoUsers.has(socket.id)) {
      videoUsers.delete(socket.id);
      socket.broadcast.emit('user-disconnected-video', { id: socket.id });
    }
    // Remove from text chat participants
    if (textChatParticipants.has(socket.id)) {
      textChatParticipants.delete(socket.id);
      io.emit('participants-update', Array.from(textChatParticipants.values()));
    }
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));