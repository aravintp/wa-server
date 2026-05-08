
// es6 main imports
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// server imports
import apiRoutes from "./routes/api.js";
import waRoutes from "./routes/whatsapp.js";
import { setupSocket } from "./services/socket.js";

// main class import
import WhatsAppClient from '../helper/Wa-class.cjs';
import { ZoomPhoneLogs } from "../helper/zmapi.js";
import { AgentStatsProcessor } from "../helper/agentprocessor.js"

// Helper import
import { DASH_FILE,CRM_FILE,ZOOM_FILE,zoomapi} from './util/path.js';
import { send_log, logs } from "../helper/global.js";
import { loadJsonSafe } from './util/utils.js';

const zoomsource = loadJsonSafe(ZOOM_FILE, {});
const crmsource = loadJsonSafe(CRM_FILE, {});
const dashsource = loadJsonSafe(DASH_FILE, {});

const processor = new AgentStatsProcessor()
const zoomcapi = new ZoomPhoneLogs(zoomapi)
const wa = new WhatsAppClient();

const app = express();
const server = createServer(app);
const io = new Server(server);

// middleware
app.use(express.json());
app.use(express.static("./"));

// routes
app.use("/api", apiRoutes(processor, zoomcapi, zoomsource, crmsource, dashsource));
app.use("/api/wa", waRoutes(wa, send_log));
setupSocket(io, send_log, () => logs);

// error handler
app.use((err, req, res, next) => {
    send_log({ type: 'error', msg: err.stack });
    res.status(500).send("Internal Server Error");
});

server.listen(8080, () => {
    send_log({ type: 'info', msg: "Server running" });
});
