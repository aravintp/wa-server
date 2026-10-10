const { N8N_SERVER } = require("../server/util/path.js")
const { Client, LocalAuth } = require('whatsapp-web.js');
const { send_log } = require('./global.js');
const qrcode = require('qrcode-terminal');

const QUIET_MS = 8000;      // forward after this long with no new message from the sender
const MAX_WAIT_MS = 30000;  // never hold a batch longer than this
const N8N_WEBHOOK = `${N8N_SERVER}/b86af3dd-3950-4432-a3dd-39453aa87f7e`;

class WhatsAppManager {

    constructor() {
        this.clients = {};
        this.pending = new Map(); // `${clientId}:${from}` -> { messages, timer, firstAt }
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
            takeoverOnConflict: true,
            takeoverTimeoutMs: 0,
        });

        this.registerEvents(client, id);

        this.clients[id] = {
            client,
            ready: false,
            state: "OFFLINE",
            phoneNumber
        };

        //await this.initClient(id)
    }

    async initClient(id) {

        send_log({ type: 'info', msg: 'Initialising Wa-client..' });

        try {

            await this.clients[id].client.initialize();
            this.clients[id].state = "INITIALIZING";

        } catch (error) {

            send_log({
                type: 'error',
                msg: `Error @ client initialise:\n ${error.message}`
            });

        }

        send_log({ type: 'success', msg: 'completed..' });
    }

    registerEvents(client, id) {

        client.on('qr', (qr) => {

            console.log(`QR for ${id}`);
            qrcode.generate(qr, { small: true });

        });

        client.on('ready', async () => {

            this.clients[id].ready = true;
            this.clients[id].state = "READY";

            send_log({ type: 'success', msg: `${id} ready` });

            const version = await client.getWWebVersion();
            send_log({ type: 'info', msg: `Version ${version}` });

        });

        client.on('authenticated', () => {
            send_log({ type: 'success', msg: `${id} authenticated` });
        });

        client.on('auth_failure', (msg) => {
            send_log({ type: 'error', msg: `${id} auth failure ${msg}` });
        });

        client.on('disconnected', (reason) => {

            this.clients[id].state = "DISCONNECTED";
            send_log({ type: 'error', msg: `${id} disconnected ${reason}` });
            this.clients[id].ready = false;

        });

        client.on('message', async (msg) => {

            try {
                const profile = await msg.getContact();
                const displayName =
                    profile.name ??
                    profile.pushname ??
                    profile.shortName ??
                    'Unknown';

                this.queueMessage(id, msg.from, {
                    number: profile.id.user,
                    name: displayName
                }, msg.body);

            } catch (error) {
                send_log({
                    type: 'error',
                    msg: `Error queueing message: ${error.message}`
                });
            }

        });

        client.on('code', (msg) => {

            this.clients[id].state = "PAIRING";
            send_log({
                type: 'info',
                msg: `Pairing code received: ${msg}`
            });

        });

    }

    // Collect messages per sender; forward once they've been quiet for QUIET_MS
    // (or MAX_WAIT_MS after the first message of the batch, whichever comes first).
    queueMessage(id, from, sender, body) {

        const key = `${id}:${from}`;
        let entry = this.pending.get(key);

        if (!entry) {
            entry = { messages: [], timer: null, firstAt: Date.now() };
            this.pending.set(key, entry);
        }

        entry.messages.push(body);
        clearTimeout(entry.timer);

        const remaining = Math.max(MAX_WAIT_MS - (Date.now() - entry.firstAt), 0);

        entry.timer = setTimeout(
            () => this.flushMessages(id, from, sender),
            Math.min(QUIET_MS, remaining)
        );
    }

    async flushMessages(id, from, sender) {

        const key = `${id}:${from}`;
        const entry = this.pending.get(key);
        if (!entry) return;

        // Remove first so anything arriving during the POST starts a fresh batch
        this.pending.delete(key);

        try {
            const response = await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': ''
                },
                body: JSON.stringify({
                    "wa-agent": id,
                    fromid: from,
                    number: sender.number,
                    name: sender.name,
                    message: entry.messages.join('\n'), // same field n8n already reads
                    messages: entry.messages            // raw list, optional for n8n
                })
            });

            if (!response.ok) {
                throw new Error(`n8n responded ${response.status}`);
            }

        } catch (error) {
            send_log({
                type: 'error',
                msg: `Failed to forward messages from ${from}: ${error.message}`
            });
        }
    }

    async sendMessage(id, number, message) {

        const session = this.clients[id];

        if (!session) {
            send_log({ type: 'warning', msg: `Client ${id} not found` });
            throw new Error(`Client ${id} not found`);
        }

        if (!session.ready) {
            send_log({ type: 'warning', msg: `Client ${id} not ready` });
            throw new Error(`Client ${id} not ready`);
        }

        try {
            const response = await session.client.sendMessage(number, message);

            send_log({
                type: 'info',
                msg: `${id} - Send message request:\n${number} ${message.slice(0, 10)}`
            });

            return response;

        } catch (error) {

            send_log({
                type: 'info',
                msg: `Client ${id} failed to send message: ${error.message}`
            });

            throw new Error(
                `Client ${id} failed to send message: ${error.message}`
            );
        }
    }

    async sendSelf(id, message) {

        const session = this.clients[id];

        if (!session) {
            send_log({ type: 'warning', msg: `Client ${id} not found` });
            throw new Error(`Client ${id} not found`);
        }

        if (!session.ready) {
            send_log({ type: 'warning', msg: `Client ${id} not ready` });
            throw new Error(`Client ${id} not ready`);
        }

        try {
            const response = await session.client.sendMessage(`${session.phoneNumber}@c.us`, message);

            send_log({
                type: 'info',
                msg: `${id} - Send message to self:\n${session.phoneNumber} ${message.slice(0, 10)}`
            });

            return response;

        } catch (error) {

            send_log({
                type: 'info',
                msg: `Client ${id} failed to send to self: ${error.message}`
            });

            throw new Error(
                `Client ${id} failed to send to self: ${error.message}`
            );
        }
    }

    async destroyClient(id) {

        const session = this.clients[id];
        send_log({ type: 'info', msg: 'Closing client..' });

        if (!session) return;

        // Drop any batches still waiting for this client
        for (const [key, entry] of this.pending) {
            if (key.startsWith(`${id}:`)) {
                clearTimeout(entry.timer);
                this.pending.delete(key);
            }
        }

        try {
            await session.client.logout();   // logout first, while the browser is still alive
        } catch (error) {
            send_log({ type: 'warning', msg: `Logout failed for ${id}: ${error.message}` });
        }

        await session.client.destroy();

        delete this.clients[id];

        send_log({ type: 'success', msg: `Client ${id} destroyed` });

    }

    getState(id) {

        const session = this.clients[id];

        if (!session) {
            return 'NOT_FOUND';
        }

        return session.state;

    }

}

module.exports = WhatsAppManager;