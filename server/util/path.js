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

export const N8N_SERVER = "https://n8n-pwa.com/webhook";

export const zoomapi = {
    clientId: "GQMuoJjISuCPfZtQBu7yLw",
    clientSecret: "VSte7plb3A8y7aHfkBEI73H3ltlRAroL",
    webhooksSecretToken: "BQmvSs67SwKSCUdkI6i3EQ",
    accountId: "S4tiTjL4T0qiFRLffIkzew"
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
