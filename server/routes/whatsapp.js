import express from "express"

const router = express.Router()

export default (wa,send_log) => {


        router.get('/getstate',async (req, res)  => {

            // get state of wa from wa-class
            wa.getState().then(s=>{

                // send the state back to the browser
                res.send(JSON.stringify(s))

            }).catch(err => {

                    // Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}` })
                     res.status(500).json({ error: "Failed to get state" });
                });

        });
        

        router.get('/initialise',async (req, res)  => {

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

        
        router.get('/close',async (req, res)  => {

            wa.closeClient().then(f=>{

                res.json({client_closed:true})

            }).catch(err => {

                    //  Explicitly pass the error to Log
                    send_log({type:'error',msg: `${err}`}) 
                    
                    // Send reposnce back to browser that close has failed
                    res.json({client_closed:false})
                });
        });


        router.put('/send-notification', async(req, res) => {

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

            
    return router;  


}