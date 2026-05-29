import express from "express"

const router = express.Router()

export default (wa,send_log,wa_agents) => {


        router.get('/agents',async (req, res)  => {

            send_log({type:'info',msg: req.originalUrl})
            res.send(JSON.stringify(wa_agents))

        })


        router.get('/getstate',async (req, res)  => {

           // send_log({type:'info',msg: req.originalUrl})

            // get state of wa from wa-class
            const id = req.query.id
            res.send(JSON.stringify(wa.getState(id)))

        });
        

        router.get('/initialise',async (req, res)  => {

            // get id 
            const id = req.query.id
            const number = req.query.number

            // log request
            send_log({type:'info',msg: req.originalUrl})

            // log to console on receiving command from browser
            send_log({type:'info',msg: `Received command to init client!`})

            try{
                    // intiate wa client
                    await wa.createClient(id,number);
                    await wa.initClient(id);

                    // send response to be true back to browser
                    res.json({client_init:true})
                    
                    // Explicitly pass the sucess to Log
                    send_log({ type: 'success', msg: "api call /intialise ended"});
            }
            catch(err) {
                
                    // Explicitly pass the error to Log
                    send_log({ type: 'error', msg: String(err)});
                    
                    // Send reposnce back to browser that init has failed
                    return res.status(500).json({client_init:false,error: String(err) });
            }
            
        });

        
        router.get('/close',async (req, res)  => {

            // get id 
            const id = req.query.id

            try {

                    // close client
                    await wa.destroyClient(id)
                    res.json({client_closed:true})
                    
                   // Explicitly pass the sucess to Log
                    send_log({ type: 'success', msg: "api call /intialise ended"});

            }
            catch(err){

                    //  Explicitly pass the error to Log
                    send_log({ type: 'error', msg: String(err)});

                    // Send reposnce back to browser that close has failed
                    return res.status(500).json({client_closed:false,error: String(err) });
            };
        });


        router.put('/send-notification', async (req, res) => {
            try {

                send_log({ type: 'info', msg: req.baseUrl});

                // Prefer body instead of query for PUT requests
                const { name, msg, number } = req.body;

                // Validation
                if (!name || !msg || !number) {
                return res.status(400).json({
                    message_sent: false,
                    error: 'Missing name, msg or number'
                });
                }

                // Format WhatsApp number
                const num = `${number}@c.us`;

                send_log({ type: 'info', msg: `${name} received send-notification command` });

                // Send message
                await wa.sendMessage(name, num, msg);
                send_log({ type: 'success',msg: `${name} ${num} ${msg}`});
                return res.json({message_sent: true });

            } catch (err) {
                send_log({ type: 'error', msg: String(err)});
                return res.status(500).json({message_sent: false,error: String(err) });
            }
        });

            
    return router;  


}