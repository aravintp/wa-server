
  
  
  import pkg from './Wa-module.cjs';
  const {get_state,init_client,close_client} = pkg;

  import {logs,send_log} from './global.js'
  import express  from 'express';
  import { createServer } from 'node:http';
  import { Server } from 'socket.io';
  import path from 'path';
import { cdpSpecificCookiePropertiesFromPuppeteerToBidi } from 'puppeteer-core/internal/bidi/Page.js';

  const app = express()
  const server = createServer(app);
  const io = new Server(server);

  const port = 8080
  var socket_connected = false;
  const intervalId = setInterval(() => {
        logstoFrontend(logs);
    }, 3000);


      // Serve static files from the "public" directory
      app.use(express.static(path.join(import.meta.dirname, '.')));


      // server listening
      server.listen(port, () => {
        console.log(`Server listening on port ${port}`)
      });


      app.get('/', (req, res) => {

        res.sendFile(path.join(__dirname, 'index.html'));

      });

      // app.post('/', (req, res) => {
      //   res.send('Got a POST request')
      // });

      // app.put('/user', (req, res) => {
      //   res.send('Got a PUT request at /user')
      // });

      // app.delete('/user', (req, res) => {
      //   res.send('Got a DELETE request at /user')
      // });
        
      /**
       * Api requet
       */
      app.get('/api/getstate',async (req, res)  => {
        const state = await get_state()
        res.send(JSON.stringify(state))

      });
      
      app.get('/api/wa-initialise',async (req, res)  => {
        init_client('6596350023')
        res.send(JSON.stringify("received"))

      });

      
      app.get('/api/wa-close',async (req, res)  => {
        console.log("Close client code api")
        close_client()
      });

      app.put('/api/send-wa-notification', (req, res) => {
          msg = req.query.msg
          num = req.query.number  + '@c.us'
          // whatsapp.sendMessage(num,msg)
          
          res.send('Done')
      })

        
      /**
       * Web socket io
       */
      function sendtoFrontend(m){
          io.emit('event message',{
          type: m.type,
          msg: m.msg}); 
      }

    function logstoFrontend(m){
        if(socket_connected)
            io.emit('event logs',m); 
      }


          // socket connection for event messages
      io.on('connection', (socket) => {

          socket_connected=  true
          send_log({
          type: 'success',
          msg: 'websocket io connected'}); 

      });


      io.engine.on("connection_error", (err) => {
          console.log(err.req);      // the request object
          console.log(err.code);     // the error code, for example 1
          console.log(err.message);  // the error message, for example "Session ID unknown"
          console.log(err.context);  // some additional error context
      });



  export {app,sendtoFrontend,socket_connected};



