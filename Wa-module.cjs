        
        
        const { Client, LocalAuth  } = require('whatsapp-web.js');``
        const qrcode = require('qrcode-terminal');
        const {send_log} = require('./global.js')

        send_log({
            type:'Debug',
            msg: `@WA-Module Entered..`})

        // might need to make this a funciton

        const client = new Client({

            authStrategy: new LocalAuth(),

            puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], },

            pairWithPhoneNumber: {
                phoneNumber: '6580739726', // Include country code, no + or spaces
                //6596350023 g6580739726
            }

        });


        //Loading screen
        client.on('loading_screen', (percent, message) => {

            console.log('LOADING SCREEN', percent, message);

        });

        /**       
         * Authentication Events
         */

        client.on('INITIALIZING', () => {
            
            send_log({
                type:'Info',
                msg: `Initialising..`})
        });

        
        client.on('AUTHENTICATING', () => {
            
            send_log({
                type:'Info',
                msg: `Acthenticating..`})
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


        /**       
         * Authentication methods events
         * 
         */
        // Paring code
        client.on('code', (code) => {

            send_log({
                type:'info',
                msg: `Pairing code: ${code}`
            })

        });

        client.on('qr', async (qr) => {
            // NOTE: This event will not be fired if a session is specified.

            console.log('QR RECEIVED', qr);

            qrcode.generate(qr, {
                small: true
            });
        });


        /**       
         *  Connection State Events
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

        
        client.on('CONNECTED', () => {
            
            send_log({
                type:'Info',
                msg: `Client Connected`})
        });
        
        client.on('disconnected', () => {
            
            send_log({
                type:'warning',
                msg: `Client disconnected`})
        });
        

        client.on('CONFLICT', () => {
            
            send_log({
                type:'warning',
                msg: `Client CONFLICT`})
        });

        client.on('auth_failure', msg => {
            
            send_log({
                type:'error',
                msg: `AUTHENTICATION FAILURE: ${msg}`})

        });


        client.on('PAIRING', () => {
            
            send_log({
                type:'Info',
                msg: `Client Paring..`})
        });

        
        client.on('UNPAIRED', () => {
            
            send_log({
                type:'Info',
                msg: `Client Paring..`})
        });


        
        client.on('TIMEOUT', () => {
            
            send_log({
                type:'Error',
                msg: `Client Timerout..`})
        });
 

        
        /**       
         *  Message activity Events
         */
        
        client.on('message', msg => {

            send_log({
                type:'info',
                msg: `Message received: ${msg.body}`})

        });

        

        try {
            client.initialize();
            
        } catch (error) {
            send_log({type:"error",msg:error})
        }


        // end whatsapp
        module.exports = client;