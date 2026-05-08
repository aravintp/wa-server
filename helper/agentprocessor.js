
import { GOOGLESHEETS_FIELDS, STATUS_MAP } from "../server/util/path.js";
import { GoogleSheetsService } from "./googlesheets.js"
import { createWriteStream } from 'node:fs';
import { send_log } from "./global.js";



export class AgentStatsProcessor {

// class main objective is to 
// 1. take in zoom logs, crm logs, 
// 2. filter by date or date range provided.
// 3. return a fully populated stats

// Only needs 2 files:
// Original zoom logs and crm logs
// crmlog = googlesheet + call_date (zoom log)

    #crm = "";
    #zoom = ""
    #stats = ""
    #google = ""
    #zoomusers = ""
    #processedCount = 0
    #totalCount = 0

    constructor() {
        this.#stats = {
            "All Agents": {
                dashboard: {

                }
            }
        }
    }

    get zoomusers() {
        return this.#zoomusers;
    }

    get zoom_source() {
        return this.#zoom;
    }

    get crm() {
        return this.#crm; 
    }

    get dash() {
        return this.#stats;
    }

    set google(fields) {
        this.#google = fields
    }
    
    set crm(fields) {
        this.#crm = fields
    }
    
    set zoom_source(fields) {
        this.#zoom = fields
        this.#zoomusers = this.#get_zoomusers(this.#zoom);
    }

    set google(fields) {
        this.#google = fields
    }
    
    set dash(fields) {
        this.#stats = fields
    }
    
    // Init does 2 things. 
    // 1. Create empty agent stats
    // 2. Connect sheets data and call data to create crmlogs
    async init() {

        send_log({type: 'debug',msg: '@AgentStatsProcessor Entered..'});
        this.#zoomusers = this.#get_zoomusers(this.#zoom);
        const employees = await this.#fetchEmployees();
        const emp_prod = employees.filter(e =>
            this.#zoomusers.find(z =>
            z.email === e.Employee_Email && 
            e.Type === "Production")
        );


        // Bascially add name and email to google sheets data that is avaiable to us
        const emp_crm = (await Promise.all(emp_prod.map(async(s) => {

            //changed this
           // const gdata = await this.#fetchGoogleData(this.#googleapi,s.GoogleSheets)
            const gdata = await this.#fetchGoogleData(s.GoogleSheets)
            return gdata.map(g => ({
                    ...g,
                    caller_name:  s.Employee,
                    caller_email: s.Employee_Email
                }))
            })
        )).flat();

        // Use caller_email to connect zoomlogs to crm and and call_date
        this.#processedCount = 0;
        this.#totalCount = emp_crm.length;
        this.#crm = emp_crm.map(item => this.#processRecord(item, this.#zoom));


        // create stats for each zoom users
        this.#zoomusers.forEach(n => {
            //this.#stats[n.zoomname] = structuredClone(this.#stats["All Agents"]);
            this.createAgent(n.zoomname)
        });

        send_log({type: 'debug',msg: '@AgentStatsProcessor completed..'});

        return this.#crm
    }

    // ---------------- STAT GENERATOR ----------------

    #genStat({zoomname,email},cyclename,startdate,enddate){
        
        const zm = {zoomname,email}

        // ---------------- DATA PREPARATION  ----------------

        // start by filtering logs by date
        const crmlogs = this.#filter_bydate(this.#crm,"call_date",startdate,enddate)
        const zoomlogs = this.#filter_bydate(this.#zoom,"start_time",startdate,enddate)

        
        // if no email. no filter look at all records
        const agentlog = zm.email? zoomlogs.filter(s => 
            s.caller_email === zm.email|| 
            s.callee_email === zm.email
        ): zoomlogs
 

        // ---------------- ZOOM CALL STATS ----------------

        const call_results = this.#key_counts(agentlog,"call_result");
        const clock_in = this.#get_earliest(agentlog,"start_time");
        const wkhr = this.#workhr(agentlog);
        const graph = this.#graphperiod(agentlog.map(s => s.start_time));

        
        // ---------------- CRM STATS ---------------------
        // ---------------- donut chart ---------------------

        // if no email. no filter look at all records
        const agentcrm = zm.email? crmlogs.filter(s => 
            s.caller_email === zm.email 
        ): crmlogs

        
        // get grouped by sheetname 
        const grouped = agentcrm.reduce((acc, item) => {
            const sheet = item.SheetName;
            acc[sheet] ??= []
            acc[sheet].push(item)
            return acc;
        }, {})


        // Return object with all the status counts
        const grouped_count = Object.fromEntries(
        Object.entries(grouped).map(([key, rows]) => [
            key,
            this.#key_counts(rows, "Status",false)
            ])
        );


        // Re-arrange object to match STATUS_MAP and calculate counts
        const status_object = Object.fromEntries(
        Object.entries(grouped_count).map(([sheetName, counts]) => [
            sheetName,
            Object.values(STATUS_MAP).map(status => counts[status] ?? 0)
        ])
        );
        

        // Calculate all_crm by summing each index across all sheets
        const all_crm = Object.values(status_object).reduce((acc, counts) => {
        counts.forEach((val, i) => {
            acc[i] = (acc[i] || 0) + val;
        });
        return acc;
        }, []);

        
        // Add all_crm key to the object
        status_object.all_crm = all_crm;

        
        // ---------------- appointments ---------------------
        const appointments = agentcrm
            .filter(i => {
                const call_date = new Date(i.call_date)
                const [day, month, year] = i['Apt Date'].split('/');
                const apt_date = new Date(year, month - 1, day);

                return ((
                    i.Status === "Face to face" || i.Status === "Zoom") 
                    && call_date <= apt_date );
            })
            .map(i => ([
                i.call_datestr,
                i.SheetName,
                i.Name,
                i['Apt Date'],
                i.Time,
                i.Location,
                i.Status,
                i.caller_name
            ]));
            // const appointments = agentcrm
            // .filter(i =>  i.Status === "Face to face" || i.Status === "Zoom" )
            // .map(i => ([
            //     i.call_datestr,
            //     i.SheetName,
            //     i.Name,
            //     i['Apt Date'],
            //     i.Time,
            //     i.Location,
            //     i.Status,
            //     i.caller_name
            // ]));


        // console.log(status_count)
        // console.log(crm_counts)
        // console.log(appointments)


        // ---------------- calculate Stats ----------------
        const calls_total = call_results?.total ?? 0
        const clock_in_time = clock_in.toLocaleTimeString()
        const total_hrs_worked = wkhr.work.str
        const outreach = call_results["No Record"]? call_results["No Record"]: 0
        const calls_pickedup = call_results.connected + (call_results?.answered ?? 0)
        const conversion =  `${((appointments.length / calls_total) * 100).toFixed(2)} %`;
        const answerrate =  `${((calls_pickedup / calls_total) * 100).toFixed(2)}% answer rate`;


        // ---------------- ASSIGN Stats ----------------
        return this.#stats[zm.zoomname].dashboard[cyclename] = {
            card: [
            calls_total,
            clock_in_time,
            total_hrs_worked,
            calls_pickedup,
            appointments.length,
            conversion,
            outreach,
            answerrate
            
            ],
            graph,
            pchart: status_object,
            apt: appointments
        };

    }
    

    genAuto(cyclename,start,end){
        this.#zoomusers.forEach(zm => { 
            this.#genStat(zm,cyclename,start,end)
        });

        this.#genStat({zoomname:"All Agents",email:""},cyclename,start,end)
    }


    genAgent(name,cyclename,start,end){
        
        const agent = this.#zoomusers?.find(s => s.zoomname === name)
        this.#stats[agent.zoomname] ??= structuredClone(this.#stats["All Agents"]);
        
        if (agent)
            return this.#genStat(agent,cyclename,start,end)
    }


    createAgent(name){
                // create stats for each zoom users
        this.#stats[name] = structuredClone(this.#stats["All Agents"]);

    }
    // ---------------- N8N FETCH ----------------

    async #fetchEmployees() {
        const baseUrl = "https://n8n.srv1343663.hstgr.cloud/webhook";
        const url = `${baseUrl}/api/gettable`;

        try {
            const response = await fetch(url);
            const res = await response.json();
            return res.data;
        } catch (error) {
            throw error;
        }
    }

    // ---------------- GOOGLE FETCH ----------------

    async #fetchGoogleData(sheetid) {
            // load google sheets class
        const gsheetapi = new GoogleSheetsService();
        gsheetapi.requiredFields = GOOGLESHEETS_FIELDS;
        gsheetapi.status_map = STATUS_MAP;
        gsheetapi.principalColumn = "Status";
        gsheetapi.worksheet = "Main";
        gsheetapi.sheet_id = sheetid;
        return await gsheetapi.loadSheets();
    }

    // ---------------- init modulue ----------------
    
    // module, gets unique users in zoom data
    #get_zoomusers(zoomlogs) {
        const seen = new Set();
        return zoomlogs
            .filter(item => {

            const outcall = item.direction === "outbound"
            const unique = !seen.has(item.caller_name)

            if (outcall && unique) {
                seen.add(item.caller_name);
                return true;
            }
        })
        .map(item => {
            const name = item.caller_name
                .split(" ")
                .filter(Boolean)
                .map(s =>`${s.charAt(0).toUpperCase()}${s.slice(1).toLowerCase()}`)
                .join(" ")
                
                return ({
                    zoomname: name,
                    email: item.caller_email
                })
    });
    }

    // module, add call results to gdata and create full crm
    #processRecord(gData, zData ) {

    if (gData.length === 0 ) 
      return 

    const item = gData

    const agentemail = item.caller_email;
    const callee_number = `+65${String(item.Numbers).replace(/\s/g, "")}`;
    const isValidStatus = 
    ["f2f", "zoom","cb","not intrested"]
    .includes(item.Status?.toLowerCase());

  
    // Get the callee zoom logs according crm records
    const match = zData.filter(z =>
        {
            const isOutbound = z.direction === "outbound";
            const numberKey = isOutbound ? "callee_did_number" : "caller_did_number";
            const emailKey = isOutbound ? "caller_email" : "callee_email";
            return z[numberKey] === callee_number && z[emailKey] === agentemail;
        }
    );

    // if more than 1 zoom logs found
    var latest = match;
    if (match.length > 1) {
        let date = null;
      //console.log(`\n${item.Name} ${item.Numbers} ${item.Status}`)      // <----- log 1 
        match.forEach((s) => {
            const dn = new Date(s.start_time);
            const connected = 
            s.call_result === "answered" || 
            s.call_result === "connected";

      //console.log(`${dn.toLocaleDateString()} ${s.call_result}`)     // <----- log 2 
            if (isValidStatus && !connected) return; // skip non-connected
            if (!date || dn > date) {
                date = dn;
                latest = s;
            }
        });
    }            

    // add call records results
    const found = latest.length?  latest[0]:latest
    const isOutbound = found.direction === "outbound";
    const calldate = new Date(found.start_time);
    item.call_date = !isNaN(calldate)? calldate : "No Record";
    item.call_datestr = !isNaN(calldate)? calldate.toLocaleDateString(): "No Record";
    item.call_result = found.length|| found.length == 0 ? "No Record":found.call_result

    
    // --- Update progress ---
    this.#processedCount++;
    if (this.#processedCount % 10 === 0 || this.#processedCount === this.#totalCount) {
      process.stdout.write(`\r ${item.caller_name} => Progress: ${this.#processedCount}/${this.#totalCount} (${((this.#processedCount / this.#totalCount) * 100).toFixed(1)}%)`);
    }
    return item;
    }

    // ---------------- Generate Stats functions ----------------

    #key_counts(data,keyname,showTotal=true) {

        return data.reduce((acc,d)=>{
            const key = d[keyname]
            acc[key] ??= 0;
            acc[key]++;

            if(showTotal){
                acc["total"] ??= 0;
                acc["total"]++;
            }
            
            return acc; 
        }, {});
    }

    // drop data and datetime key, it will give you the earliest
    #get_earliest(data,key){

        return data.reduce((acc,z) => {
                const ztime = new Date(z[key])
                acc ??= new Date();
                acc = acc > ztime? ztime: acc
                return acc
        }, new Date());
    }

    // retun filtered data based on start and end time
    #filter_bydate(data, key, start, end) {

        return data.filter(d => {
            const dt = new Date(d[key]);
            return dt >= start && dt < end;
        });
    }

    // module
    #workhr(data, break_minutes = 30) {
        const isotime = data.map(r => r.start_time);

        if (!isotime.length) {
            return { work: { str: "0hr 0min" } };
        }

        let breakMs = 0;

        isotime.forEach((r, i) => {
            if (i > 0) {
                const diff =  new Date(isotime[i - 1]) - new Date(r);
                if (diff > break_minutes * 60000) breakMs += diff;
                // console.log(` 
                //     ${(new Date(isotime[i - 1]).toLocaleTimeString())} - 
                //     ${(new Date(r)).toLocaleTimeString()} = ${diff}
                // ---> ${(diff > break_minutes * 60000)}`)
            }}
        );

        const start = new Date(isotime[0]);
        const end = new Date(isotime.at(-1));
        const ms = (start - end) - breakMs;
        const hr = Math.floor(ms / 3600000);
        const min = Math.floor((ms % 3600000) / 60000);

        return { work: { str: `${hr}hr ${min}min` } };
    }

    #graphperiod(times) {
        const byhour = Array(13).fill(0);
        const byday = Array(6).fill(0);
        const byweek = Array(5).fill(0);

        times.forEach(t => {
            const d = new Date(t);
            const hour = d.getHours();
            const day = d.getDay();
            const week = Math.floor((d.getDate() - 1) / 7);

            if (hour >= 8 && hour <= 20) byhour[hour - 8]++;
            if (day >= 1 && day <= 6) byday[day - 1]++;
            if (week <= 4) byweek[week]++;
        });

        return { byhour, byday, byweek };
    }


   printf(data, output, append = false) {
            const flag = append? { flags: 'a' } : { flags: 'w' }
            const stream = createWriteStream(output,flag);
            
            stream.write(JSON.stringify(data, null, 2));
            stream.end();
            stream.on('finish', () => console.log(`Finished writing to ${output}`));
    }

    cycle = () => {
        const now = new Date();

        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        const week = new Date(today);
        week.setDate(week.getDate() - ((week.getDay() || 7) - 1));

        const month = new Date(today);
        month.setDate(1);

        const lastmonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        return {
            today: { start: today, end: now },
            week: { start: week, end: now },
            month: { start: month, end: now },
            lastmonth: { start: lastmonth, end: month },
        };
    };
           
}