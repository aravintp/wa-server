        
        
        const { Client, LocalAuth, ClientOptions  } = require('whatsapp-web.js');``
        const qrcode = require('qrcode-terminal');
        const {send_log} = require('./global.js');

        var wa_ready = false;

        send_log({
            type:'Debug',
            msg: `@WA-Module Entered..`})

        // might need to make this a funciton
            var cp = {
                authStrategy: new LocalAuth(),
                puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], },
                pairWithPhoneNumber: { phoneNumber: '6580739726' }
            }

        var client = new Client(cp)

        function init_client(number){
            
            send_log({
                type:'Info',
                msg: `Initialising Wa-client..`})

            var cp = {
                authStrategy: new LocalAuth(),
                puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], },
                pairWithPhoneNumber: { phoneNumber: number }
            }

            client.initialize().catch()
        }

        async function get_state(){
            
            if (wa_ready) 
                return await client.getState()
        }

        function close_client(){

            send_log({
                type:'Info',
                msg: `Closing..`})
            console.log("Destroying client...");
            client.destroy();

        }
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

            wa_ready = true;
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
        client.on('code', async (code) => {

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
        
        client.on('authenticated', async () => {
            
            send_log({
                type:'success',
                msg: `Authenticated`})
        });

        
        client.on('change_state',async () => {
            
            send_log({
                type:'info',
                msg: `State Changed`})
        });

        
        client.on('CONNECTED', async () => {
            
            send_log({
                type:'Info',
                msg: `Client Connected`})
        });
        
        client.on('disconnected',async () => {
            
            send_log({
                type:'warning',
                msg: `Client disconnected`})
        });
        

        client.on('CONFLICT',async () => {
            
            send_log({
                type:'warning',
                msg: `Client CONFLICT`})
        });


        client.on('auth_failure',async (msg) => {
            
            send_log({
                type:'error',
                msg: `AUTHENTICATION FAILURE: ${msg}`})

        });


        client.on('PAIRING', async () => {
            
            send_log({
                type:'Info',
                msg: `Client Paring..`})
        });

        
        client.on('UNPAIRED', async () => {
            
            send_log({
                type:'Info',
                msg: `Client Paring..`})
        });

        
        client.on('TIMEOUT', async () => {
            
            send_log({
                type:'Error',
                msg: `Client Timerout..`})
        });
 

        
        /**       
         *  Message activity Events
         */
        
        client.on('message', async (msg) => {

            send_log({
                type:'info',
                msg: `Message received: ${msg.body}`})

        });

        // end whatsapp
        module.exports.client = client
        module.exports.get_state = get_state;
        module.exports.close_client = close_client;
        module.exports.init_client = init_client;
