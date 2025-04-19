const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

io.on('connection', socket => {
  console.log('A user connected');

  socket.on('offer', data => socket.broadcast.emit('offer', data));
  socket.on('answer', data => socket.broadcast.emit('answer', data));
  socket.on('ice-candidate', data => socket.broadcast.emit('ice-candidate', data));
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
