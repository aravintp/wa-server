
const app = require("./server"); // Import the app instance
const whatsapp = require("./Wa-module"); // Import the app instance



app.put('/send-wa-notification', (req, res) => {
    res.send('Done')
    msg = req.query.msg
    num = req.query.number  + '@c.us'
    console.log(msg,num)
    whatsapp.sendMessage(num,msg)
})
