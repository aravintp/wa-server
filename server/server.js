
// es6 main imports
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// outside folders
import { send_log, logs } from "../helper/global.js";
import * as z from "../helper/zmapi.js";
import WhatsAppClient from '../helper/Wa-class.cjs';

// server imports
import apiRoutes from "./routes/api.js";
import waRoutes from "./routes/whatsapp.js";
import { zoomapi,index } from "./util/path.js";
import { setupSocket } from "./services/socket.js";

// const processor = new u.AgentStatsProcessor();
// const zoomcapi = new z.ZoomPhoneLogs(zoomapi)

import { AgentStatsProcessor } from "../helper/agentprocessor.js"
import { DASH_FILE,CRM_FILE,ZOOM_FILE } from './util/path.js';
import { loadJsonSafe } from './util/utils.js';

const zoomsource = loadJsonSafe(ZOOM_FILE, {});
const crmsource = loadJsonSafe(CRM_FILE, {});
const dashsource = loadJsonSafe(DASH_FILE, {});
const processor = new AgentStatsProcessor()
const wa = new WhatsAppClient();

const app = express();
const server = createServer(app);
const io = new Server(server);

// middleware
app.use(express.json());
app.use(express.static("./"));

// routes
app.use("/api", apiRoutes(processor, zoomsource, crmsource, dashsource));
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

// `app.get('/', (req, res) => {

//     res.sendFile(index);

// });`