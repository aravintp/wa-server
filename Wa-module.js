        const qrcode = require('qrcode-terminal');
        const {io} = require("./server"); // Import the app instance=
        const { Client, NoAuth, LocalAuth  } = require('whatsapp-web.js');
        const {forward_n8n} = require('./app.js')

            send_log({
                type:'info',
                msg: `Entered Wa=module`
            })

        const client = new Client({

            authStrategy: new LocalAuth(),

            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },

            // webVersionCache: {
            //     type: 'remote',
            //     remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1031490220-alpha.html`,    
            // },

            // need to add this in the frontend
            pairWithPhoneNumber: {
                phoneNumber: '6580739726', // Include country code, no + or spaces
                //6596350023 g6580739726
            }

        });


        // Intialise 
        client.initialize();


        //Loading screen
        client.on('loading_screen', (percent, message) => {

            console.log('LOADING SCREEN', percent, message);

        });

        
        // Authentication Events

        client.on('qr', async (qr) => {
            // NOTE: This event will not be fired if a session is specified.

            console.log('QR RECEIVED', qr);

            qrcode.generate(qr, {
                small: true
            });
        });


        // Paring code
        client.on('code', (code) => {

            send_log({
                type:'info',
                msg: `Pairing code: ${code}`
            })

        });


        // Connection status Events

        client.on('authenticated', () => {
            
            send_log({
                type:'success',
                msg: `Authenticated`})
        });

        
        client.on('change_state', () => {
            
            send_log({
                type:'info',
                msg: `State Changed`})
        });

        
        client.on('disconnected', () => {
            
            send_log({
                type:'warning',
                msg: `Client disconnected`})
        });
        

        client.on('auth_failure', msg => {
            
            send_log({
                type:'error',
                msg: `AUTHENTICATION FAILURE: ${msg}`})

        });


        // When auth completed  
        
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

        
        // Message activity notification
        client.on('message', msg => {

            send_log({
                type:'info',
                msg: `Message received: ${msg.body}`})

        });

        
        client.on('message_create', msg => {

            send_log({
                type:'info',
                msg: `Message created: ${msg.body}`})

        });

        
        client.on('message_reaction', msg => {

            send_log({
                type:'info',
                msg: `Message reaction: ${msg.body}`})

        });
        
    
        client.on('message_ack', msg => {

            send_log({
                type:'info',
                msg: `Message acknowledge: ${msg.body}`})

        });


        // Send log to front end and print console
        function send_log(debug){

            console.log(debug.msg)

            io.emit("event message",{
                type: debug.type,
                msg: debug.msg})

        };
        // end whatsapp

        module.exports = client;