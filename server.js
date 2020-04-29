var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var path = require('path');

const DEFAULT_PORT = 5000;

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', function (req, res) {
  //   res.sendFile('index.html', { root: path.join(__dirname, '/public') });
  res.send('server is running...');
});

server.listen(DEFAULT_PORT);

io.on('connection', function (socket) {
  console.log('Client connected...');

  socket.on('join', function (data) {
    console.log(data);
  });
});
