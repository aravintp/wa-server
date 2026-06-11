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
            // puppeteer: {
            //     args: ['--no-sandbox', '--disable-setuid-sandbox']
            // },
            puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process', // Helps limit resources on low-RAM servers
                        '--disable-gpu'
                    ],
                },

            pairWithPhoneNumber: phoneNumber
                ? { phoneNumber }
                : undefined,
            

            restartOnAuthFail: true,
            takeoverOnConflict: true, // <--- Set to boolean true
            takeoverTimeoutMs: 0,   

        });

        this.registerEvents(client, id);

        this.clients[id] = {
            client,
            ready: false,
            state: "OFFILNE"
        };


        //await this.initClient(id)
    }

    async initClient(id) {

        send_log({type: 'info', msg: 'Initialising Wa-client..'});

        try {

            await this.clients[id].client.initialize();
            this.clients[id].state = "INITIALIZING";

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
            this.clients[id].state = "READY";

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

            this.clients[id].state = "DISCONNECTED";
            send_log({type: 'error',msg:`${id} disconnected ${reason}`});
            this.clients[id].ready = false;

        });

        client.on('message',async (msg) => {

            const test_server = "https://n8n.srv1343663.hstgr.cloud/webhook-test/b86af3dd-3950-4432-a3dd-39453aa87f7e";
            const server = "https://n8n.srv1343663.hstgr.cloud/webhook/b86af3dd-3950-4432-a3dd-39453aa87f7e";
            const profile = await msg.getContact();
            try {
                // 1. Send the request to the external server
                const response = await fetch(server, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': '' // Forward headers if needed
                    },
                    body: JSON.stringify({
                        "wa-agent": id,
                        fromid: msg.from,
                        number: profile.number,
                        name: profile.name,
                        message: msg.body
                    })

                });

                // 2. Parse the JSON response from the external server
                const data = await response.json();

                // 3. Send the data back to your client
                //res.json(data);
            } catch (error) {
                console.error('Error connecting to external server:', error);
                //res.status(500).json({ error: 'Failed to fetch data from remote server' });
            }

            // send_log({type: 'info',msg:`[${id}] ${msg.from}: ${msg.body}`});

        });

        client.on('code', (msg) => {

            this.clients[id].state = "PARING";
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
        await session.client.logout();

        delete this.clients[id];

        this.clients[id].state = "OFFLINE";
        send_log({type: 'success',msg: `Client ${id} destroyed`});

    }

    getState(id) {

        const session = this.clients[id];

        if (!session) {
            return 'NOT_FOUND';
        }

        return session.state
        // return session.ready
        //     ? 'READY'
        //     : 'OFFLINE';

    }

}

module.exports = WhatsAppManager;