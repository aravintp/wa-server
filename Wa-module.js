const qrcode = require('qrcode-terminal');

const {io} = require("./server"); // Import the app instance=
const { Client, LocalAuth, NoAuth  } = require('whatsapp-web.js');


const client = new Client({

    authStrategy: new NoAuth(),

    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    // temp

    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1031490220-alpha.html`,    
    },

    pairWithPhoneNumber: {
        phoneNumber: '6580739726 ', // Include country code, no + or spaces
        //6596350023
    }

});


client.on('loading_screen', (percent, message) => {

    console.log('LOADING SCREEN', percent, message);

});

// Generate Qr code
client.on('qr', async (qr) => {
    // NOTE: This event will not be fired if a session is specified.

    console.log('QR RECEIVED', qr);

    qrcode.generate(qr, {
        small: true
    });
});

client.on('code', (code) => {
    
    io.emit("event message",{
        type:'info',
        msg: `Pairing code: ${code}`})

});

client.on('authenticated', () => {
    
    io.emit("event message",{
        type:'success',
        msg: `Authenticated`})
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    
    io.emit("event message",{
        type:'error',
        msg: `AUTHENTICATION FAILURE: ${msg}`})

});

client.on('ready', async () => {

    const debugWWebVersion = await client.getWWebVersion();
    
    io.emit("event message",{
        type:'info',
        msg: `ready..\nWebVersion = ${debugWWebVersion}`})

    client.pupPage.on('pageerror', function(err) {
            
        io.emit("event message",{
            type:'error',
            msg: `Page error: ${err.toString()}`})
    });
    client.pupPage.on('error', function(err) {
        io.emit("event message",{
            type:'error',
            msg: `Page error: ${err.toString()}`})
    });
    
});

client.initialize();
// end whatsapp


module.exports = client;