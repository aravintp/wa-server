
  
  
  import pkg from './Wa-module.cjs';
  const {get_state,init_client,close_client,send_message,client} = pkg;

  import {logs,send_log} from './global.js'

  import express  from 'express';
  import { createServer } from 'node:http';
  import { Server } from 'socket.io';
  import path from 'path';

  const app = express()
  const server = createServer(app);
  const io = new Server(server);

  const port = 8080
  var socket_connected = false;
  const intervalId = setInterval(() => {
        logstoFrontend(logs);
    }, 3000);

      
      send_log({
          type:'debug',
          msg: `@Module server.js entered`
      })

      // Serve static files from the "public" directory
      app.use(express.static(path.join(import.meta.dirname, '.')));

      
      send_log({
          type:'debug',
          msg: `express.js is using ${path.join(import.meta.dirname, '.')}`
      })


      // server listening
      server.listen(port, () => {
          
        send_log({
            type:'info',
            msg: `Server listening on port ${port}`
        })

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
        get_state().then(s=>{

            res.send(JSON.stringify(s))

        }).catch(err => {
                next(err); // Explicitly pass the error to Express
            });

      });
      
      app.get('/api/wa-initialise',async (req, res)  => {
               // might need to make this a funciton

        init_client("6596350023").then(r=>{
            
            res.send(JSON.stringify("received"))

        }).catch(err => {
                next(err); // Explicitly pass the error to Express
            });

      });

      
      app.get('/api/wa-close',async (req, res)  => {
        console.log("Close client code api")
        close_client().then(f=>{

            res.send(JSON.stringify({client_closed:true,data:f}))

        }).catch(err => {
                next(err); // Explicitly pass the error to Express
            });
      });

      app.put('/api/send-wa-notification', async(req, res) => {
          const msg = req.query.msg
          const num = req.query.number  + '@c.us'
          send_message(num,msg).then(r=>{

            res.send(JSON.stringify({message_sent:true,data:r}))
            
          }).catch(err => {
                next(err); // Explicitly pass the error to Express
            });
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



