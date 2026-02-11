        const qrcode = require('qrcode-terminal');
        const {io} = require("./server"); // Import the app instance=
        const { Client, NoAuth, LocalAuth  } = require('whatsapp-web.js');
        const {forward_n8n} = require('./app.js')
        const {getlogs,createLog} = require('./global.js')
        
        import { logs,createLog } from "./global";
        
        
            send_log({
                type:'info',
                msg: `Entered Wa=module`
            })

        // might need to make this a funciton
        const client = new Client({

            authStrategy: new LocalAuth(),

            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            },

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

        /**       
         * Authentication Events
         */

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


        /**       
         *  Connection status Events
         */
        
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


        /**       
         *  Auth completed Events
         */
        
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

        
        /**       
         *  Message activity Events
         */
        
        client.on('message', msg => {

            send_log({
                type:'info',
                msg: `Message received: ${msg.body}`})

        });

        
        client.on('message_create', msg => {


            console.log("at wa-module.js\n", logs)
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
        function send_log(n){


            log = createLog(n.type,n.msg)
            logs.push(log)
            console.log(n.msg)

            // io.emit("event message",{
            //     type: debug.type,
            //     msg: debug.msg})

        };
        // end whatsapp

        module.exports = client;