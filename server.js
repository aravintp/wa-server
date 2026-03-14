
  
    
    import WhatsAppClient from './Wa-class.cjs';
    import express from 'express';
    import path from 'path';

    import {logs,send_log} from './global.js'
    import { createServer } from 'node:http';
    import { Server } from 'socket.io';

    const app = express()
    const server = createServer(app);
    const io = new Server(server);
    const wa = new WhatsAppClient();
    const intervalId = setInterval(() => {logstoFrontend(logs);}, 3000);
    const port = 8080
    var socket_connected = false;


        // Log to console on entering module  
        send_log({type:'debug',msg: `@Module server.js entered`})


        // Serve static files from the "public" directory
        app.use(express.static(path.join(import.meta.dirname, '.')));
                send_log({
            type:'debug',
            msg: `express.js is using ${path.join(import.meta.dirname, '.')}`
        })



        // Custom error handling middleware
        app.use((err, req, res, next) => {

            // Log the error stack to the file
            send_log({type:'error',msg: `${err.stack}\n`})
                
            // Also log to the console for development visibility
            console.error(err.stack);

            // Send a generic error response to the client
            res.status(err.status || 500).send('Internal Server Error');
        });

            
        // server listening
        server.listen(port, () => {
            
            send_log({type:'info',msg: `Server listening on port ${port}`})

        });


        app.get('/', (req, res) => {

            res.sendFile(path.join(__dirname, 'index.html'));

        });


        /**
         * Api requet
         */
        app.get('/api/getstate',async (req, res)  => {

            // get state of wa from wa-class
            wa.getState().then(s=>{

                // send the state back to the browser
                res.send(JSON.stringify(s))

            }).catch(err => {

                    // Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}` })
                });

        });
        

        app.get('/api/wa-initialise',async (req, res)  => {

            // log to console on receiving command from browser
            send_log({type:'info',msg: `Received command to init client!`})

            // initiate the client 
            wa.initClient().then(r=>{

                // send response to be true back to browser
                res.json({client_init:true})
                
            }).catch(err => {
                
                    //  Fortunatly fuck you, Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that init has failed
                    res.json({client_init:false})
                });
            
        });

        
        app.get('/api/wa-close',async (req, res)  => {

            wa.closeClient().then(f=>{

                res.json({client_closed:true})

            }).catch(err => {

                    //  Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that close has failed
                    res.json({client_closed:false})
                });
        });


        app.put('/api/send-wa-notification', async(req, res) => {

            // Prepare the number for wa-class
            const msg = req.query.msg
            const num = req.query.number  + '@c.us'

            // Send message out
            wa.sendMessage(num,msg).then(r=>{

                // if promise succeeds response to browser as true
                res.json({message_sent:true})
                
            }).catch(err => {
                    //  Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that message sent, has failed
                    res.json({message_sent:false})
                });
        })

            
        /**
         * Web socket io
         `*/
        function sendtoFrontend(m){
            // send one single message, maybe like 'fuck you, this is too early!'
            io.emit('event message',{
            type: m.type,
            msg: m.msg}); 
        }

        function logstoFrontend(m){
            // send the whole log instead, cos you are a lazy fuck
            if(socket_connected)
                io.emit('event logs',m); 
        }


          // socket connection for event messages
        io.on('connection', (socket) => {

            socket_connected=  true
            send_log({type: 'success',msg: 'New browser connected'}); 

        });


        io.engine.on("connection_error", (err) => {
            console.log(err.req);      // the request object
            console.log(err.code);     // the error code, for example 1
            console.log(err.message);  // the error message, for example "Session ID unknown"
            console.log(err.context);  // some additional error context
        });


  // export? really who the FUCK NEEDS this?
  export {app,sendtoFrontend,socket_connected};



