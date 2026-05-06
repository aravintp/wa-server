

import "./server/server.js"; // Import the app instance= //
import { initLogs,set_debug } from './helper/global.js'
import { AgentStatsProcessor } from "./helper/agentprocessor.js"
import { ZoomPhoneLogs } from "./helper/zmapi.js";
import { GoogleSheetsService } from "./helper/googlesheets.js"
import { loadJsonSafe} from './server/util/utils.js'
import { zoomapi,ZOOM_FILE,DASH_FILE,CRM_FILE } from './server/util/path.js'


//const zoomlogs = loadJsonSafe(ZOOM_FILE, {});

const gsheet = new GoogleSheetsService()
const zoomcapi = new ZoomPhoneLogs(zoomapi)
const zoomlogs = await zoomcapi.getLogs(2);
const processor = new AgentStatsProcessor()
processor.zoom_source = zoomlogs
processor.googleApi = gsheet
await processor.init()

Object.entries(processor.cycle()).forEach((key,value) => {
    processor.genAuto(key[0],key[1].start,key[1].end)
});

processor.printf(
    processor.dash,
    DASH_FILE
)

processor.printf(
    processor.crm,
    CRM_FILE
)

processor.printf(
    processor.zoom_source,
    ZOOM_FILE
)

initLogs();
set_debug(false)
