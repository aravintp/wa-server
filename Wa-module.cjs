        
        
        const { Client, LocalAuth } = require('whatsapp-web.js');``
        const qrcode = require('qrcode-terminal');
        const {send_log} = require('./global.js');

        var wa_ready = false;

        send_log({
            type:'debug',
            msg: `@WA-Module Entered..`})

        // might need to make this a funciton
            var cp = {
                authStrategy: new LocalAuth(),
                puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], },
                pairWithPhoneNumber: { phoneNumber: '6580739726' }
            }

         var client = new Client(cp)

        async function init_client(number){
            
            send_log({
                type:'info',
                msg: `Initialising Wa-client..`})
            
            client.initialize().then(r =>{

                send_log({
                    type:'success',
                    msg: `completed..`})

            })

            // Works but on event dont fire any more
            // var cp = {
            //     authStrategy: new LocalAuth(),
            //     puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'], },
            //     pairWithPhoneNumber: { phoneNumber: number }
            // }

            // client = new Client(cp)
            // client.initialize().then(r =>{

            //     send_log({
            //         type:'success',
            //         msg: `completed..`})
            //     client.pairWithPhoneNumber = number
                
            //     send_log({
            //         type:'info',
            //         msg: `start paring..`})
            //     client.requestPairingCode(number).then(r=>{
                    
                
            //         send_log({
            //             type:'success',
            //             msg: `Paring code ${r}.`})

            //     })

            // })

            


        }

    
        /**       
         * Fxport functions
         */

        async function get_state(){
            var state = ""
            if (wa_ready) 
                try {

                    state = await client.getState();

                } catch (error) {

                            
                    send_log({
                        type:'error',
                        msg: `get_state Wa-client.${error}`});

                }
                return state
        }

        async function close_client(){
            send_log({
                type:'info',
                msg: `Closing client..`})
            ret = client.destroy().then(r=>{
                    
                send_log({
                    type:'success',
                    msg: `Client closed..`})
            })

            return ret
        }

        async function send_message(num,msg){
            
            //need to obfuscate for PDPA
            send_log({
                type:'info',
                msg: `Send message request:\n${num} ${msg}`})
            
            if (wa_ready) 
                client.sendMessage(num,msg).then(r=>{
                    
                    send_log({
                        type:'success',
                        msg: `Message Sent`})
                
                })
            else    
                send_log({
                    type:'warning',
                    msg: `Wa-Client not ready!`})
            return

        }


        /**       
         * Events
         */

        client.on('loading_screen', (percent, message) => {

            console.log('LOADING SCREEN', percent, message);

        });

        /**       
         * Authentication Events
         */
        client.on('INITIALIZING',async () => {
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
                msg: `Ready!`})
                
            send_log({
                type:'info',
                msg: `WebVersion = ${debugWWebVersion}`})

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

        
        client.on('change_state',async (state) => {
            
            send_log({
                type:'warning',
                msg: `State Changed: ${state}`})
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
                msg: `Client Unpaired..`})
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


        const clearProfileLock = async (id) => {
            try {
                const lockFilePath = ClientHelper.base_path + `/${ClientHelper.session_prefix}-${id}/SingletonLock`;

                const stats = fs.lstatSync(lockFilePath);

                if (stats.isSymbolicLink()) {
                    fs.unlinkSync(lockFilePath);
                }
            } catch (err) {
                console.log(`Clear profile lock error: ${err}`);
            }
        };

        // end whatsapp
        module.exports.client = client
        module.exports.get_state = get_state;
        module.exports.close_client = close_client;
        module.exports.init_client = init_client;
        module.exports.send_message = send_message;
        module.exports.clearProfileLock = clearProfileLock;
