import express from 'express'
import path from 'path';

// import t from "./data/zoom.json" with {type: 'json'}
import { DASH_FILE,CRM_FILE,ZOOM_FILE } from '../util/path.js';
import { getunique } from '../util/utils.js';
import { exec } from 'child_process';

const router = express.Router();

export default (processor, zoomcapi, zoomsource, crmsource, dashsource)=>{
        
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

        router.get('/dash/refresh-dash', async (req, res) => {

            const todaylogs = await zoomcapi.getLogsToday();
            const uniquelogs = getunique(
                todaylogs,
                zoomsource,
                "call_id"
            );
            
            // console.log(zoomsource.length)
            // console.log(todaylogs.length)
            // console.log(uniquelogs.length)

            processor.zoom_source = uniquelogs;
            const todaycrm = await processor.init();
            const uniquecrm = getunique(
                todaycrm,
                crmsource,
                "Numbers",
                "Index"
            );

            zoomsource.unshift(...uniquelogs);
            crmsource.push(...uniquecrm);

            Object.keys(dashsource).map((key,s)=>{
                processor.createAgent(key)
            })
            processor.zoom_source = zoomsource;
            processor.crm = crmsource;

            for (const [key, value] of Object.entries(processor.cycle())) {
                await processor.genAuto(
                key,
                value.start,
                value.end
                );
            }

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

        router.get('/restart', (req, res) => {
        // Replace "my-app" with the PM2 process name or id
            exec('pm2 restart wa-server', (err, stdout, stderr) => {
                if (err) return res.status(500).send(`Error: ${stderr || err.message}`);
                res.send(`Restarted: ${stdout}`);
            });
        });
    return router;
}