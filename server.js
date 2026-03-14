
  
  
  import pkg from './Wa-module.cjs';
  import express from 'express';
  import path from 'path';

  const {get_state,init_client,close_client,send_message,client} = pkg;

  import {logs,send_log} from './global.js'
  import { createServer } from 'node:http';
  import { Server } from 'socket.io';
  const app = express()
  const server = createServer(app);
  const io = new Server(server);

  const port = 8080
  var socket_connected = false;
  const intervalId = setInterval(() => {
        logstoFrontend(logs);}, 3000);

      
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



        // Custom error handling middleware
        app.use((err, req, res, next) => {
            // Log the error stack to the file
            
            send_log({
                type:'error',
                msg: `${err.stack}\n`
            })
                
            // Also log to the console for development visibility
            console.error(err.stack);

            // Send a generic error response to the client
            res.status(err.status || 500).send('Internal Server Error');
        });

            


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


        /**
         * Api requet
         */
        app.get('/api/getstate',async (req, res)  => {
            get_state().then(s=>{

                res.send(JSON.stringify(s))

            }).catch(err => {
                    send_log({
                        type:'error',
                        msg: `${err}`
                    }) // Explicitly pass the error to Log
                });

        });
        

        app.get('/api/wa-initialise',async (req, res)  => {
                // might need to make this a funciton

            send_log({
                type:'info',
                msg: `Received command to init client!`
            })

            init_client("").then(r=>{
                
                res.json({client_init:true})
                
            }).catch(err => {
                
                    send_log({
                        type:'error',
                        msg: `${err}`
                    }) // Explicitly pass the error to Log
                    
                    res.json({client_init:false})
                });
            
        });

        
        app.get('/api/wa-close',async (req, res)  => {

            close_client().then(f=>{

                res.json({client_closed:true})

            }).catch(err => {
                    send_log({
                        type:'error',
                        msg: `${err}`
                    }) // Explicitly pass the error to Log
                    
                    res.json({client_closed:false})
                });
        });


        app.put('/api/send-wa-notification', async(req, res) => {
            const msg = req.query.msg
            const num = req.query.number  + '@c.us'
            send_message(num,msg).then(r=>{

                res.json({message_sent:true})
                
            }).catch(err => {
                    send_log({
                        type:'error',
                        msg: `${err}`
                    }) // Explicitly pass the error to Log
                    
                    res.json({message_sent:false})
                });
        })

            
        /**
         * Web socket io
         `*/
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



