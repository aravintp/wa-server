const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { send_log } = require('./global.js');
const fs = require('fs');

class WhatsAppClient {

    constructor(phoneNumber = '6580739726') {

        this.wa_ready = false;

        send_log({type: 'debug',msg: '@WA-Class Entered..'});

        const cp = {
            authStrategy: new LocalAuth(),
            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },
            pairWithPhoneNumber: { phoneNumber }
        };

        this.client = new Client(cp);
        this.registerEvents();
    }

    async initClient() {

        send_log({type: 'info', msg: 'Initialising Wa-client..'});

        try {

            await this.client.initialize();
            this.wa_ready = true;

            send_log({type: 'success',msg: 'completed..'});

        } catch (error) {

            send_log({
                type: 'error',
                msg: `Error @ client initialise:\n ${error.message}`
            });

        }
    }

    async getState() {

        if (!this.wa_ready) {
            return "Offline";
        }

        try {
            return await this.client.getState();
        } catch (error) {

            send_log({type: 'error',msg: `get_state Wa-client.${error}`});

            return "Error";
        }
    }

    async closeClient() {

        this.wa_ready = false;
        send_log({type: 'info', msg: 'Closing client..'});

        try {

            await this.client.destroy();
            this.wa_ready = false;

            send_log({type: 'success',msg: 'Client closed..'});

        } catch (err) {

            this.wa_ready = true;
            send_log({type: 'error',
                msg: `client.destroy Wa-client.${err}`});

        }
    }

    async sendMessage(num, msg) {

        send_log({
            type: 'info',
            msg: `Send message request:\n${num} ${msg}`
        });

        if (!this.wa_ready) {

            send_log({
                type: 'warning',
                msg: 'Wa-Client not ready!'
            });

            return;
        }

        try {

            await this.client.sendMessage(num, msg);

            send_log({
                type: 'success',
                msg: 'Message Sent'
            });

        } catch (err) {

            send_log({
                type: 'error',
                msg: `Send message error: ${err}`
            });

        }
    }

    registerEvents() {

        const client = this.client;

        client.on('loading_screen', (percent, message) => {
            console.log('LOADING SCREEN', percent, message);
        });

        client.on('ready', async () => {

            this.wa_ready = true;

            const version = await client.getWWebVersion();
            send_log({type: 'info',msg: 'Ready!'});
            send_log({type: 'info',msg: `WebVersion = ${version}`});

        });

        client.on('qr', (qr) => {

            console.log('QR RECEIVED');
            qrcode.generate(qr, { small: true });

        });

        client.on('authenticated', () => {

            send_log({type: 'success',msg: 'Authenticated'});

        });

        client.on('auth_failure', (msg) => {

            send_log({
                type: 'error',
                msg: `AUTHENTICATION FAILURE: ${msg}`
            });

        });

        client.on('change_state', (state) => {

            send_log({
                type: 'warning',
                msg: `State Changed: ${state}`
            });

        });

        client.on('disconnected', () => {

            send_log({
                type: 'warning',
                msg: 'Client disconnected'
            });

        });

        client.on('message', (msg) => {

            send_log({
                type: 'info',
                msg: `Message received: ${msg.body}`
            });

        });

    }

    clearProfileLock(id) {

        try {

            const lockFilePath =
                ClientHelper.base_path +
                `/${ClientHelper.session_prefix}-${id}/SingletonLock`;

            const stats = fs.lstatSync(lockFilePath);

            if (stats.isSymbolicLink()) {
                fs.unlinkSync(lockFilePath);
            }

        } catch (err) {

            console.log(`Clear profile lock error: ${err}`);

        }

    }

}

module.exports = WhatsAppClient;