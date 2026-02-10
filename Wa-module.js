 const qrcode = require('qrcode-terminal');
 const {io} = require("./server"); // Import the app instance=
const { Client, NoAuth  } = require('whatsapp-web.js');

    send_log({
        type:'info',
        msg: `Entered Wa=module`
    })

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

    // need to add this in the frontend
    pairWithPhoneNumber: {
        phoneNumber: '6580739726', // Include country code, no + or spaces
        //6596350023 6580739726
    }

});


client.initialize();

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

    send_log({
        type:'info',
        msg: `Pairing code: ${code}`
    })

});

client.on('authenticated', () => {
    
    send_log({
        type:'success',
        msg: `Authenticated`})
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessful
    
    send_log({
        type:'error',
        msg: `AUTHENTICATION FAILURE: ${msg}`})

});

client.on('ready', async () => {

    const debugWWebVersion = await client.getWWebVersion();
    
    send_log({
        type:'info',
        msg: `ready..\nWebVersion = ${debugWWebVersion}`})

    client.pupPage.on('pageerror', function(err) {
            
        send_log({
            type:'error',
            msg: `Page error: ${err.toString()}`})
    });
    client.pupPage.on('error', function(err) {

        send_log({
            type:'error',
            msg: `Page error: ${err.toString()}`})
    });
    
});

function send_log(debug){

    console.log(debug.msg)

    io.emit("event message",{
        type: debug.type,
        msg: debug.msg})

};
// end whatsapp

module.exports = client;