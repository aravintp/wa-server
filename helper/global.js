import TelegramBot from 'node-telegram-bot-api'
const token = '8795149074:AAFV7CbP2nxz2p7jVNG8Va6tEcvaVuNogWE';
const chat_id = "-5187352091"
const bot = new TelegramBot(token, {polling: false});

const TG_MAX_CHARS = 4000;      // Telegram's hard limit is 4096; leave room for the header
const TG_MAX_LINE = 1000;       // cap any single log line (stack traces, JSON dumps)
const TG_MAX_PER_TICK = 3;      // max Telegram messages per 5s tick (group limit is ~20/min)
const MAX_LOGS = 1000;          // in-memory log history kept for the front end

const intervalId = setInterval(() => {
    bot_sendlogs();
}, 5000);


var logId = 1;
var debug = false;
var bot_log = [];
//added newlogs
export var newlogs = false;
export var logs = [];

send_log({
    type: 'debug',
    msg: `@Module: global.js entered`
})

export function initLogs() {
    add_log('info', 'WhatsApp Forwarder initialized');
    add_log('info', 'Listening for incoming messages...');
    // add_log('success', 'Connected to n8n webhook endpoint');
}


export function createLog(type, message) {
    let log = {
        id: logId++,
        type: type,
        message: message,
        timestamp: new Date()
    };

    return log
}

export function get_logs() {
    return logs
}

export function set_logs(n) {
    logs = n
}

export function set_debug(n) {
    debug = n;
}

export function get_debug() {
    return debug;
}

// Keep the in-memory history bounded so it can't grow for the life of the process
function pushLog(log) {
    logs.push(log);
    if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
}

export function add_log(n, s) {

    // added this line for log bug fix still testing
    newlogs = true
    const log = createLog(n, s)
    pushLog(log)
}



// Send log to front end and print console
export function send_log(n) {

    // ugly date variable. To use with pm2.
    let date = new Date()
    let d = "[" + date.toLocaleDateString().replaceAll("/", "-") +
        " " + date.toTimeString().split(' ')[0] + "]"

    let log = createLog(n.type, n.msg)

    pushLog(log);
    console.log(d, n.msg)

    // Debug noise stays in the console/front end unless debug mode is on
    if (n.type === 'debug' && !debug) return;

    let msg = String(n.msg ?? '');
    if (msg.length > TG_MAX_LINE) msg = msg.slice(0, TG_MAX_LINE) + ' …[truncated]';
    bot_log.push({ time: d, msg })

}

// Split queued lines into chunks that each fit in one Telegram message
function buildChunks(lines) {
    const header = "wa-server internal\n\n";
    const chunks = [];
    let current = header;
    for (const line of lines) {
        if (current.length + line.length > TG_MAX_CHARS && current !== header) {
            chunks.push(current);
            current = header;
        }
        current += line;
    }
    if (current !== header) chunks.push(current);
    return chunks;
}

let sending = false;

async function bot_sendlogs() {
    if (sending || bot_log.length === 0) return;
    sending = true;

    const lines = bot_log.map(m => `${m.time} ${m.msg}\n`);
    bot_log = [];

    let chunks = buildChunks(lines);
    if (chunks.length > TG_MAX_PER_TICK) {
        const skipped = chunks.length - TG_MAX_PER_TICK;
        chunks = chunks.slice(-TG_MAX_PER_TICK);   // keep the most recent
        chunks[0] = `⚠️ ${skipped} earlier log message(s) skipped (flood) — see pm2 logs\n\n` + chunks[0];
    }

    try {
        for (const chunk of chunks) {
            await bot.sendMessage(chat_id, chunk);
        }
    } catch (err) {
        // Never let a Telegram failure crash the server or block future logs
        console.error('Telegram log send failed:', err?.message || err);
    } finally {
        sending = false;
    }
}