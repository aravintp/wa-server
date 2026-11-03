import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, "..", "..", "data");
export const DASH_FILE = path.join(DATA_DIR, "dash.json");
export const CRM_FILE = path.join(DATA_DIR, "crm.json");
export const ZOOM_FILE = path.join(DATA_DIR, "zoom.json");
export const GOOGLE_FILE = path.join(DATA_DIR, "google.json");
export const WAAGENT_FILE = path.join(__dirname, "..", "..", "wa_agents.csv");
export const index = path.join(__dirname, "..", "..", "index.html");

// Credentials live in .secrets.json (gitignored, copy secrets.example.json to start).
// Dot-prefixed so express.static("./") refuses to serve it. WA_SECRETS_FILE overrides the path.
export const SECRETS_FILE = process.env.WA_SECRETS_FILE || path.join(__dirname, "..", "..", ".secrets.json");

function loadSecrets(file) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        throw new Error(`Cannot read secrets file ${file}: ${err.message}`);
    }
}

const secrets = loadSecrets(SECRETS_FILE);

export const N8N_SERVER = "https://n8n-pwa.com/webhook";
export const N8N_WA_WEBHOOK_ID = secrets.n8n?.waWebhookId;

export const telegram = secrets.telegram || {};

export const zoomapi = {
    clientId: secrets.zoom?.clientId,
    clientSecret: secrets.zoom?.clientSecret,
    webhooksSecretToken: secrets.zoom?.webhooksSecretToken,
    accountId: secrets.zoom?.accountId
}

export const STATUS_MAP = {
        'f2f': 'Face to face',
        'zoom': 'Zoom',
        'not Intrested': 'Not interested',
        'npu': 'Never Pick Up',
        'niu': 'Not in use',
        'wrong number': 'Wrong Number',
        'cb': 'Call back'
    };
// export const STATUS_MAP = {
//         'booked on calendar' : 'Face to face',
//         'f2f': 'Face to face',
//         'zoom': 'Zoom',
//         'not Intrested': 'Not interested',
//         'npu': 'Never Pick Up',
//         'npu 1': 'Never Pick Up',
//         'npu 2': 'Never Pick Up',
//         'npu 3': 'Never Pick Up',
//         'niu': 'Not in use',
//         'wrong number': 'Wrong Number',
//         'cb': 'Call back',
//         'contacted': 'Call back'
//     };

export var whatsapp = {
    agents:[]
    }
    
export const GOOGLESHEETS_FIELDS = ['Name', 'Number', 'Status', 'Date', 'Time', 'Location']
