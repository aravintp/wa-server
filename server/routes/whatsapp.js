import express from "express"

const router = express.Router()

export default (wa,send_log,wa_agents) => {


        router.get('/agents',async (req, res)  => {

            send_log({type:'info',msg: req.originalUrl})
            res.send(JSON.stringify(wa_agents))

        })


        router.get('/getstate',async (req, res)  => {

            // get state of wa from wa-class
            const id = req.query.id
            res.send(JSON.stringify(wa.getState(id)))

            // wa.getState(id).then(s=>{

            //     // send the state back to the browser
            //     res.send(JSON.stringify(s))

            // }).catch(err => {

            //         // Explicitly pass the error to Log
            //         send_log({type:'error',msg: `${err}` })
            //          res.status(500).json({ error: "Failed to get state" });
            //     });

        });
        

        router.get('/initialise',async (req, res)  => {

            
            send_log({type:'info',msg: req.originalUrl})

            // get id 
            const id = req.query.id
            const number = req.query.number

            // log to console on receiving command from browser
            send_log({type:'info',msg: `Received command to init client!`})

            await wa.createClient(id,number);

            // initiate the client 
            wa.initClient(id).then(r=>{

                // send response to be true back to browser
                res.json({client_init:true})
                
            }).catch(err => {
                
                    //  Fortunatly fuck you, Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that init has failed
                    res.json({client_init:false})
                });
            
        });

        
        router.get('/close',async (req, res)  => {

            // get id 
            const id = req.query.id

            wa.destroyClient(id).then(f=>{

                res.json({client_closed:true})

            }).catch(err => {

                    //  Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that close has failed
                    res.json({client_closed:false})
                });
        });


        router.put('/send-notification', async(req, res) => {

            send_log({type:'info',msg: req.originalUrl})
            
            // Prepare the number for wa-class
            const id = req.query.id
            const msg = req.query.msg
            const num = req.query.number  + '@c.us'

            send_log({type:'info',msg: `${id} recieved send-notification command `})
            // Send message out
            wa.sendMessage(id,num,msg).then(r=>{

                // if promise succeeds response to browser as true
                send_log({type:'success',msg: `${id} ${num} ${msg}  `})
                res.json({message_sent:true})
                
            }).catch(err => {
                    //  Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that message sent, has failed
                    res.json({message_sent:false})
                });
        })

            
    return router;  


}