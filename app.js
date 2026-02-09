

console.log(__dirname)

const {app} = require("./server"); // Import the app instance=
const whatsapp = require("./Wa-module"); // Import the app 

// my cod
    app.put('/send-wa-notification', (req, res) => {
        msg = req.query.msg
        num = req.query.number  + '@c.us'
        whatsapp.sendMessage(num,msg)
        
        res.send('Done')
})
