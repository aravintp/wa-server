import express from 'express'
import path from 'path';

// import t from "./data/zoom.json" with {type: 'json'}
import { AgentStatsProcessor } from "../../helper/agentprocessor.js"
import { DASH_FILE,CRM_FILE,ZOOM_FILE } from '../util/path.js';

const router = express.Router();

export default (processor, zoomsource, crmsource, dashsource)=>{
        
        router.get('/dash/datafile', (req, res) => {
            res.sendFile(DASH_FILE);

        });

        router.get('/dash/custom', (req, res) => {
            const agent = req.query.agent;
            const sdate = new Date(req.query.sdate);
            const edate = new Date(req.query.edate);

            processor.zoom_source = zoomsource;
            processor.crm = crmsource;
            processor.dash = dashsource;
            processor.genAgent(agent,"custom",sdate,edate)
            
            res.send(processor.dash);

        });
        
        router.get('/dash/download', (req, res) => {

            const filename = req.query.name || "data.json";
            const folder = req.query.folder || "";

            const fullpath = path.join(DATA_DIR, folder, filename);

            if (fs.existsSync(fullpath)) {
                res.download(fullpath);
            } else {
                res.status(404).json({ error: "File not found" });
            }
        });

    return router;
}