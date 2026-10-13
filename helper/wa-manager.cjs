const { N8N_SERVER } = require("../server/util/path.js")
const { Client, LocalAuth } = require('whatsapp-web.js');
const { send_log } = require('./global.js');
const qrcode = require('qrcode-terminal');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const QUIET_MS = 8000;      // forward after this long with no new message from the sender
const MAX_WAIT_MS = 30000;
const REQUEST_TIMEOUT_MS = 10000;
const RETRY_DELAYS_MS = [2000, 5000, 15000, 60000];
const OUTBOX_DIR = process.env.WA_OUTBOX_DIR || path.join(__dirname, '.wa-webhook-outbox'); // Must be on persistent storage
const N8N_WEBHOOK = `${N8N_SERVER}/b86af3dd-3950-4432-a3dd-39453aa87f7e`;

class WhatsAppManager {

    constructor() {
        this.clients = {};
        this.pending = new Map();
        this.retryTimers = new Map();
        fs.mkdirSync(OUTBOX_DIR, { recursive: true });
        this.recoverOutbox();
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
        // await this.initClient(id)
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
        client.on('code', (msg) => {
            this.clients[id].state = "PAIRING";
            send_log({
                type: 'info',
                msg: `Pairing code received: ${msg}`
            });
        });

        
    client.on('message', async (msg) => {
        try {
            const body = typeof msg.body === 'string'
            ? msg.body.trim()
            : '';

            // Log unsupported or empty incoming events
            if (!body) {
                send_log({
                    type: 'info',
                    msg: `Skipped empty WhatsApp message.
                    Type: ${msg.type}
                    From: ${msg.from}
                    Has Media: ${msg.hasMedia}
                    ID: ${msg.id?._serialized ?? 'Unknown'}`
                });
                return;
            }

            const profile = await msg.getContact();

            const displayName =
            profile.name ||
            profile.pushname ||
            profile.shortName ||
            'Unknown';

            const messageId =
            msg.id?._serialized ??
            msg.id?.id ??
            null;

            if (!messageId) {
            throw new Error('WhatsApp message ID unavailable');
            }

            this.queueMessage(
            id,
            msg.from,
            {
                number: profile.id.user,
                name: displayName
            },
            body,
            messageId
            );

        } catch (error) {
            send_log({
            type: 'error',
            msg: `Error queueing message: ${error.message}`
            });
        }
    });

    }
    // Persist each inbound message before scheduling a batch. The outbox folder
    // MUST live on a persistent volume, not temporary/container-only storage.

    persistEntry(entry) {
        const destination = path.join(OUTBOX_DIR, `${entry.outboxId}.json`);
        const temporary = `${destination}.tmp`;
        fs.writeFileSync(temporary, JSON.stringify({
            outboxId: entry.outboxId,
            id: entry.id,
            from: entry.from,
            sender: entry.sender,
            messages: entry.messages,
            firstAt: entry.firstAt,
            lastAt: entry.lastAt,
            attempts: entry.attempts || 0,
            status: entry.status || 'pending'
        }));
        fs.renameSync(temporary, destination);
    }

    recoverOutbox() {
        for (const filename of fs.readdirSync(OUTBOX_DIR)) {
            if (!filename.endsWith('.json')) continue;
            try {
                const entry = JSON.parse(fs.readFileSync(path.join(OUTBOX_DIR, filename), 'utf8'));
                if (!entry.outboxId || !Array.isArray(entry.messages)) continue;
                if (entry.status === 'pending') {
                    const key = `${entry.id}:${entry.from}`;
                    // A recovered batch may be finalised independently of new messages.
                    const delay = Math.max(0, Math.min(
                        QUIET_MS - (Date.now() - entry.lastAt),
                        MAX_WAIT_MS - (Date.now() - entry.firstAt)
                    ));
                    entry.timer = setTimeout(() => this.flushMessages(entry.id, entry.from, entry.sender, entry.outboxId), delay);
                    this.pending.set(key, entry);
                } else {
                    this.scheduleDelivery(entry, 1000);
                }
            } catch (error) {
                send_log({ type: 'error', msg: `Unable to recover ${filename}: ${error.message}` });
            }
        }
    }

    queueMessage(id, from, sender, body, messageId) {
        const key = `${id}:${from}`;

        if (typeof body !== 'string' || !body.trim()) {
            return;
        }

        let entry = this.pending.get(key);
        if (!entry) {
            entry = {
                outboxId: crypto.randomUUID(), id, from, sender,
                messages: [], firstAt: Date.now(), lastAt: Date.now(),
                attempts: 0, status: 'pending', timer: null
            };
        }
        if (entry.messages.some(m => m.id === messageId)) return;
        entry.messages.push({ id: messageId, body });
        entry.lastAt = Date.now();
        // A failed disk write throws rather than silently accepting a message.
        this.persistEntry(entry);
        this.pending.set(key, entry);
        clearTimeout(entry.timer);
        const remaining = Math.max(0, MAX_WAIT_MS - (Date.now() - entry.firstAt));
        entry.timer = setTimeout(
            () => this.flushMessages(id, from, sender, entry.outboxId),
            Math.min(QUIET_MS, remaining)
        );
    }

    flushMessages(id, from, sender, outboxId) {
        const key = `${id}:${from}`;
        const entry = this.pending.get(key);
        if (!entry || entry.outboxId !== outboxId) return;
        // New messages will start a separate batch while this one is sent.
        entry.status = 'ready';
        this.persistEntry(entry);
        this.pending.delete(key);
        clearTimeout(entry.timer);
        this.scheduleDelivery(entry, 0);
    }

    scheduleDelivery(entry, delayMs) {
        if (this.retryTimers.has(entry.outboxId)) return;
        const timer = setTimeout(async () => {
            this.retryTimers.delete(entry.outboxId);
            await this.deliverBatch(entry);
        }, delayMs);
        this.retryTimers.set(entry.outboxId, timer);
    }

    async deliverBatch(entry) {
        const messageIds = entry.messages.map(m => m.id);
        // Sorting makes the idempotency key independent of message ordering.
        const batchId = crypto.createHash('sha256')
            .update(JSON.stringify([entry.id, entry.from, [...messageIds].sort()]))
            .digest('hex');
        const payload = {
            'wa-agent': entry.id,
            fromid: entry.from,
            number: entry.sender.number,
            name: entry.sender.name,
            message_id: batchId,
            message_ids: messageIds,
            message: entry.messages.map(m => m.body).join('\n'),
            messages: entry.messages.map(m => m.body)
        };
        try {
            const response = await fetch(N8N_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`n8n responded ${response.status}`);
            // Only delete after successful HTTP acknowledgement from n8n.
            fs.unlinkSync(path.join(OUTBOX_DIR, `${entry.outboxId}.json`));
            send_log({ type: 'success', msg: `Forwarded WA batch ${batchId.slice(0, 12)} from ${entry.from}` });
        } catch (error) {
            entry.attempts = (entry.attempts || 0) + 1;
            entry.status = 'retry';
            try { this.persistEntry(entry); }
            catch (storageError) {
                send_log({ type: 'error', msg: `Outbox persistence failed: ${storageError.message}` });
            }
            const delay = RETRY_DELAYS_MS[Math.min(entry.attempts - 1, RETRY_DELAYS_MS.length - 1)];
            send_log({ type: 'error', msg: `WA forward failed (${entry.attempts}) for ${entry.from}: ${error.message}. Retrying in ${delay / 1000}s` });
            this.scheduleDelivery(entry, delay);
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
