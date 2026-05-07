
// import { AgentStatsProcessor } from "./helper/agentprocessor.js"
// import { ZoomPhoneLogs } from "./helper/zmapi.js";
// import { GoogleSheetsService } from "./helper/googlesheets.js"
// import { loadJsonSafe } from './server/util/utils.js'
// import { zoomapi,ZOOM_FILE,DASH_FILE,CRM_FILE } from './server/util/path.js'

// const zoomlogs = loadJsonSafe(ZOOM_FILE, {});
// const crmsource = loadJsonSafe(CRM_FILE, {});

// const processor = new AgentStatsProcessor()
// processor.zoom_source = zoomlogs
// processor.crm = crmsource;

// //run full
// //await processor.init()

// const start = new Date("05/06/2026 00:00:00")
// const end = new Date("05/06/2026 23:59:00")

// // console.log(start.toString())

// processor.genAgent("Aravinth Pillai","today",start,end)

// // Object.entries(processor.cycle()).forEach((key,value) => {
// //     processor.genAuto(key[0],key[1].start,key[1].end)
// // });






  const APPT_TYPES = {
     "Face to face": "hsl(0,72%,51%)",
     "Not interested": "hsl(0,72%,51%)",
     "Never Pick Up": "hsl(0,72%,51%)",
     "Not in use": "hsl(0,72%,51%)",
     "Face to face": "hsl(0,72%,51%)",
  };

  export const STATUS_MAP = {
        'f2f': 'Face to face',
        'zoom': 'Zoom',
        'not Intrested': 'Not interested',
        'npu': 'Never Pick Up',
        'niu': 'Not in use',
        'wrong number': 'Wrong Number',
        'cb': 'Call back'
    };

    const data =  {
        "pchart": {
            "Francis Leads": [
              6,
              0,
              11,
              26,
              11,
              3,
              11
            ],
            "Daniel Age 50 to 60 ": [
              4,
              0,
              12,
              47,
              6,
              0,
              3
            ],
            "Algo - Blood Pressure": [
              8,
              0,
              0,
              25,
              1,
              0,
              3
            ],
            "all_crm": [
              18,
              0,
              23,
              98,
              18,
              3,
              17
            ]
          
        } 
    }


    const data = {
   "Francis Leads": [2,0,2,3,2,0,1],
   "Algo - Blood Pressure": [6,0,0,25,1,0,3] 
}

    // const sc = Object.keys(data).map(sh => {
    //     return Object.keys(STATUS_MAP)
    //     .map((s,i)=>data[sh][STATUS_MAP[s]] ?? 0)
    // })

    const sheets = Object.keys(data);
    const sc = sheets.map(sheetName => {
        const counts = data[sheetName];
        return {
            [sheetName] : Object.values(STATUS_MAP)
                .map(status => counts[status] ?? 0)
        }
    });

// Calculate all_crm from sheetsArray
    const all_crm = sc[0]
    ? Object.values(STATUS_MAP).map((_, i) => {
        return sc.reduce((sum, sheetObj) => {
            const values = Object.values(sheetObj)[0]; // get the array of counts
            return sum + (values[i] ?? 0);
        }, 0);
        })
    : [];

    sc.push({ all_crm });
        
    console.log(sc)
//   Object.keys(agent).map((value, i) => {
//     console.log(agent[value],value, APPT_TYPES)
// })

//   data.forEach((val, i) => {
//     const slice = (val / total) * Math.PI * 2;
//     ctx.beginPath();
//     ctx.moveTo(cx, cy);
//     ctx.arc(cx, cy, r, startAngle + 0.03, startAngle + slice - 0.03);
//     ctx.arc(cx, cy, innerR, startAngle + slice - 0.03, startAngle + 0.03, true);
//     ctx.closePath();
//     ctx.fillStyle = APPT_TYPES[i].color;
//     ctx.fill();
//     startAngle += slice;
//   });