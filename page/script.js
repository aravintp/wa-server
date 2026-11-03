
import {} from "./dashboard.js"
import {} from "./sidebar.js"
import { wastatus,logs,addLog,initLogs,wa_agents} from "./terminal.js";


            const baseUrl = window.location.origin; 
            const timeoutId = setTimeout(() => {
                let intervalId= setInterval(() => {
                    update_WaStatus();
                        }, 2000);
            }, 5000);


            const startBtn = document.getElementById('startBtn');
            const wa_agentSelect = document.getElementById('wa_agents')
            let lastServerId = 0;   // id of the newest server log already shown

            // Initialize
            initLogs();

            

/* ══════════════════════════════════════════════════════════════
   UI functions
══════════════════════════════════════════════════════════════ */

            
            // async function update_WaStatus() {
            //     let status_msg = "";

            //     for (const s of wa_agents) {
            //         const state = await get_server_state(s.name);
            //         status_msg += `${s.name}:${state} \n`;
            //     }

            //     wastatus.textContent = status_msg;
            // }

            async function update_WaStatus() {
                const results = await Promise.all(
                    wa_agents.map(async (s) => {
                    const state = await get_server_state(s.name);
                            set_btnstate(state,s.name)
                            return set_agentPanel(state,s.name)
                    })
                );
                wastatus.innerHTML = results.join('');

            }

            function set_agentPanel(state,name){
                
                let statusClass = "wa-offline";
                if (state === "READY") {
                    statusClass = "wa-ready";
                } else if (state === "INITIALIZING") {
                    statusClass = "wa-warning";
                }

                return `
                        <div class="wa-status-line">
                            <span class="wa-agent-name">${name}</span>

                            <span class="wa-status ${statusClass}">
                                ${state}
                            </span>
                        </div>
                `;

            }

            function set_btnstate(state,name){
                const wa_agent  = wa_agentSelect.value;
                startBtn.textContent = state === 'READY' && name === wa_agent? '■ Stop' : '▶ Start' ;

            }

            async function get_server_state(name){

                const url = `${baseUrl}/api/wa/getstate?id=${name}`
                try {
                    var state = await fetchBackendData(url)
                } catch (error) {
                    state = "Offine"   
                }

                return state
            }


/* ══════════════════════════════════════════════════════════════
   Messaging systems
══════════════════════════════════════════════════════════════ */


            // receive message
            socket.on('event message', (n) => {
            }); 

            // receive logs
            socket.on('event logs', (n) => {

                if (!Array.isArray(n) || n.length === 0) return;

                // Server ids restart at 1 when the server restarts
                if (n[n.length - 1].id < lastServerId) lastServerId = 0;

                // Only the newest 100 fit in the terminal anyway
                const n_logs = n.filter(e => e.id > lastServerId).slice(-100)

                n_logs.forEach(e => {
                   addLog(e.type, e.message, e.timestamp)
                })

                lastServerId = n[n.length - 1].id

            });




/* ══════════════════════════════════════════════════════════════
   Api function
══════════════════════════════════════════════════════════════ */

            async function fetchBackendData(url) {
                
                let _ret = ""
                try {

                    // The URL should match your backend server and endpoint
                    const response = await fetch(url);
                        
                    if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    _ret = await response.json()
                } catch (error) {

                    throw error;
                }

                return _ret
            }
