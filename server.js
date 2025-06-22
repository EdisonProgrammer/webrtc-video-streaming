const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let broadcasters = {}; // { broadcasterSocketId: Set(viewerSocketId) }
let viewers = {};      // { viewerSocketId: broadcasterSocketId }

io.on('connection', socket => {
  socket.on('broadcaster', () => {
    broadcasters[socket.id] = new Set();
    socket.broadcast.emit('broadcaster');
    console.log('Broadcaster connected:', socket.id);
  });

  socket.on('viewer', broadcasterId => {
    viewers[socket.id] = broadcasterId;
    if (broadcasters[broadcasterId]) {
      broadcasters[broadcasterId].add(socket.id);
      io.to(broadcasterId).emit('viewer', socket.id);
    }
    console.log('Viewer connected:', socket.id, 'to broadcaster:', broadcasterId);
  });

  socket.on('offer', ({ viewerId, offer }) => {
    io.to(viewerId).emit('offer', { broadcasterId: socket.id, offer });
  });

  socket.on('answer', ({ broadcasterId, answer }) => {
    io.to(broadcasterId).emit('answer', { viewerId: socket.id, answer });
  });

  socket.on('candidate', ({ to, candidate }) => {
    io.to(to).emit('candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    if (broadcasters[socket.id]) {
      // Broadcaster disconnected
      broadcasters[socket.id].forEach(viewerId => {
        io.to(viewerId).emit('broadcaster-disconnected');
        delete viewers[viewerId];
      });
      delete broadcasters[socket.id];
    }
    if (viewers[socket.id]) {
      // Viewer disconnected
      const broadcasterId = viewers[socket.id];
      if (broadcasters[broadcasterId]) {
        broadcasters[broadcasterId].delete(socket.id);
      }
      delete viewers[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on http://localhost:${PORT}`));