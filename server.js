const express = require('express');
const http = require('http');
const socket = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static('public'));

io.on('connection', socket => {
  socket.on('join', room => {
    socket.join(room);
    socket.to(room).emit('new-peer');
  });

  socket.on('offer', (room, offer) => {
    socket.to(room).emit('offer', offer);
  });

  socket.on('answer', (room, answer) => {
    socket.to(room).emit('answer', answer);
  });

  socket.on('candidate', (room, candidate) => {
    socket.to(room).emit('candidate', candidate);
  });
});

server.listen(process.env.PORT || 3000);