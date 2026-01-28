
const app = require("./server"); // Import the app instance

console.log("server done")
const whatsapp = require("./Wa-module"); // Import the app instance

whatsapp.initialize();


app.put('/send-wa-notification', (req, res) => {
    msg = req.query.msg
    num = req.query.number  + '@c.us'
    whatsapp.sendMessage(num,msg)
    
    res.send('Done')
})
