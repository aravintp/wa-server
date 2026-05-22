const { Client, LocalAuth } = require('whatsapp-web.js');
const { send_log } = require('./global.js');
const qrcode = require('qrcode-terminal');

class WhatsAppManager {

    constructor() {
        this.clients = {};
    }

    async createClient(id, phoneNumber = null) {

        if (this.clients[id]) {
            console.log(`Client ${id} already exists`);
            return;
        }

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: id
            }),

            puppeteer: {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            },

            pairWithPhoneNumber: phoneNumber
                ? { phoneNumber }
                : undefined
        });

        this.registerEvents(client, id);

        this.clients[id] = {
            client,
            ready: false
        };


        //await this.initClient(id)
    }

    async initClient(id) {

        send_log({type: 'info', msg: 'Initialising Wa-client..'});

        try {

           await this.clients[id].client.initialize();

        } catch (error) {

            send_log({
                type: 'error',
                msg: `Error @ client initialise:\n ${error.message}`
            });

        }

        send_log({type: 'success',msg: 'completed..'});
    }


    registerEvents(client, id) {

        client.on('qr', (qr) => {

            console.log(`QR for ${id}`);
            qrcode.generate(qr, { small: true });

        });

        client.on('ready', async () => {

            this.clients[id].ready = true;

            send_log({type: 'success',msg: `${id} ready`});

            const version = await client.getWWebVersion();
            send_log({type: 'info',msg: `Version ${version}`});
            

        });

        client.on('authenticated', () => {
            send_log({type: 'success',msg: `${id} authenticated`});
        });

        client.on('auth_failure', (msg) => {
            send_log({type: 'error',msg:`${id} auth failure ${msg}`});
        });

        client.on('disconnected', (reason) => {

            send_log({type: 'error',msg:`${id} disconnected ${reason}`});
            this.clients[id].ready = false;

        });

        client.on('message', (msg) => {

            send_log({type: 'info',msg:`[${id}] ${msg.from}: ${msg.body}`});

        });

        client.on('code', (msg) => {

            send_log({
                type: 'info',
                msg: `Paring code received: ${msg}`
            });

        });

    }

    async sendMessage(id, number, message) {

        const session = this.clients[id];

        if (!session) {
             send_log({type: 'warning',msg:`Client ${id} not found`});
            throw new Error(`Client ${id} not found`);
        }

        if (!session.ready) {
             send_log({type: 'warning',msg:`Client ${id} not ready`});
            throw new Error(`Client ${id} not ready`);
        }

        await session.client.sendMessage(number, message);

        send_log({
            type: 'info',
            msg: `${id} - Send message request:\n${number} ${message}`
        });

    }

    async destroyClient(id) {

        const session = this.clients[id];
        send_log({type: 'info', msg: 'Closing client..'});
        

        if (!session) return;

        await session.client.destroy();

        delete this.clients[id];

        send_log({type: 'success',msg: `Client ${id} destroyed`});

    }

    getState(id) {

        const session = this.clients[id];

        if (!session) {
            return 'NOT_FOUND';
        }

        return session.ready
            ? 'READY'
            : 'OFFLINE';

    }

}

module.exports = WhatsAppManager;