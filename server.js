  const express = require('express')
  const { createServer } = require('node:http');
  const { Server } = require('socket.io');

  const app = express()
  const server = createServer(app);
  const io = new Server(server);
  const path = require('path');
  const port = 8080


  // Serve static files from the "public" directory
  app.use(express.static(path.join(__dirname, '.')));


  // server listening
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  });


  // socket connection for event messages
  io.on('connection', (socket) => {
    console.log('a user connected');
    io.emit('event message',{
    type: 'success',
    msg: 'websocket io connected'}); 
      socket.on('event message', function (data) {
        console.log(data);
      });
  });


  io.engine.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
  });


  app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname, 'index.html'));

  });

  app.post('/', (req, res) => {
    res.send('Got a POST request')
  });

  app.put('/user', (req, res) => {
    res.send('Got a PUT request at /user')
  });

  app.delete('/user', (req, res) => {
    res.send('Got a DELETE request at /user')
  });


  module.exports= {app,io};



