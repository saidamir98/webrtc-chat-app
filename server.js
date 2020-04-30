var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');

const DEFAULT_PORT = 5000;

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: path.join(__dirname, '/public') });
  // res.send('server is running...');
});

server.listen(DEFAULT_PORT);

io.on('connection', (socket) => {
  socket.userData = {
    id: socket.id,
    username: 'Unnamed',
  };

  var users = [];
  Object.keys(io.sockets.sockets).forEach((socketId) => {
    users.push(io.sockets.sockets[socketId].userData);
  });

  socket.emit('joined', {
    me: socket.userData,
    users: users,
  });

  socket.broadcast.emit('joined-user', socket.userData);

  socket.on('update-username', (data) => {
    socket.userData.username = data.username;
    socket.broadcast.emit('updated-user', socket.userData);
  });

  socket.on('call', (data) => {
    // chech before calling
    socket.to(data.to).emit('calling', {
      offer: data.offer,
      from: socket.id,
      username: socket.userData.username,
    });
  });

  socket.on('answer', (data) => {
    // chech before answered
    socket.to(data.to).emit('answered', {
      answer: data.answer,
      from: socket.id,
    });
  });

  socket.on('notify', (data) => {
    // chech before answered
    socket.to(data.to).emit('notified', {
      message: data.message,
      from: socket.id,
    });
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('removed-user', {
      id: socket.id,
    });
  });
});
