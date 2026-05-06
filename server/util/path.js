import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = path.join(__dirname, "..", "..", "data");
export const DASH_FILE = path.join(DATA_DIR, "dash.json");
export const CRM_FILE = path.join(DATA_DIR, "crm.json");
export const ZOOM_FILE = path.join(DATA_DIR, "zoom.json");
export const GOOGLE_FILE = path.join(DATA_DIR, "google.json");
export const index = path.join(__dirname, "..", "..", "index.html");


export const zoomapi = {
    clientId: "GQMuoJjISuCPfZtQBu7yLw",
    clientSecret: "VSte7plb3A8y7aHfkBEI73H3ltlRAroL",
    webhooksSecretToken: "BQmvSs67SwKSCUdkI6i3EQ",
    accountId: "S4tiTjL4T0qiFRLffIkzew"
}

export const GOOGLESHEETS_FIELDS = ['Name', 'Numbers', 'Status', 'Apt Date', 'Time', 'Location']
