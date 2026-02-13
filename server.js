
  
  // import { send_log } from "./global.js";;
  import express  from 'express';
  import { createServer } from 'node:http';
  import { Server } from 'socket.io';
  import path from 'path';

  const app = express()
  const server = createServer(app);
  const io = new Server(server);

  const port = 8080
  var socket_connected = false;

      // Serve static files from the "public" directory
      app.use(express.static(path.join(import.meta.dirname, '.')));


      // server listening
      server.listen(port, () => {
        console.log(`Server listening on port ${port}`)
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

      app.put('/api/send-wa-notification', (req, res) => {
          msg = req.query.msg
          num = req.query.number  + '@c.us'
          // whatsapp.sendMessage(num,msg)
          
          res.send('Done')
      })

        
          // socket connection for event messages
      io.on('connection', (socket) => {
          console.log('a user connected');

          socket_connected= io.emit('event message',{
          type: 'success',
          msg: 'websocket io connected'}); 

      });


      io.engine.on("connection_error", (err) => {
          console.log(err.req);      // the request object
          console.log(err.code);     // the error code, for example 1
          console.log(err.message);  // the error message, for example "Session ID unknown"
          console.log(err.context);  // some additional error context
      });

      function sendtoFrontend(m){
        
          io.emit('event message',{
          type: m.type,
          msg: m.msg}); 
      }

  export {app,sendtoFrontend,socket_connected};



