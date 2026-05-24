

            export let logs = []
            let isStopped = false;
            let autoScroll = true;
            let logId = 1;
            
            export const wastatus = document.getElementById('status')
            const baseUrl = window.location.origin; 
            const terminal = document.getElementById('terminal-window');
            const logCount = document.getElementById('logCount');
            const startBtn = document.getElementById('startBtn');
            const wa_agentSelect = document.getElementById('wa_agents');
                        
            // listners
            document.getElementById('startBtn').addEventListener('click', toggleScript);
           // wa_agentSelect.addEventListener('change', refresh_btn);

            // Fetch wa_agent list
            export const wa_agents = await fetchBackendData(`${baseUrl}/api/wa/agents`)

            // Add wa agent dynamically in dropdown
             wa_agents.map(key => {
                 add_waagents(`${key.name} - ${key.number}`,key.name);
             })


            /* ══════════════════════════════════════════════════════════════
            wa_agents — Options
            ══════════════════════════════════════════════════════════════ */

            function add_waagents(name,value){
                wa_agentSelect.options[wa_agentSelect.options.length] = new Option(name, value);
            }

            



            /* ══════════════════════════════════════════════════════════════
            DISPLAY 
            ══════════════════════════════════════════════════════════════ */
            // Add initial logs
            export function initLogs() {
                addLog('info', 'WhatsApp Forwarder initialized');
                addLog('info', 'Listening for incoming messages...');
            }

            function formatTime(date) {
                return date.toTimeString().split(' ')[0];
            }

            function getLogPrefix(type) {
                switch (type) {
                    case 'success': return '[SUCCESS]';
                    case 'warning': return '[WARNING]';
                    case 'error': return '[ERROR]';
                    case 'debug': return '[DEBUG]';
                    default: return '[INFO]';
                }
            }

            // This funtion adds to log array and pushes to display it
            export function addLog(type, message) {
                const log =  {
                    id: logId++,
                    type: type,
                    message: message,
                    timestamp: new Date()
                };

                logs.push(log);
                if (logs.length > 100) {
                    logs.shift();
                }
                
                renderLogs();
            }

            // This is the log display
            export function renderLogs() {
                const cursorLine = terminal.querySelector('.cursor-line');
                const emptyState = terminal.querySelector('.empty-state');
                
                if (emptyState) {
                    emptyState.remove();
                }

                // Clear existing logs (except cursor)
                const existingLogs = terminal.querySelectorAll('.log-entry');
                existingLogs.forEach(log => log.remove());

                // Render all logs
                logs.forEach(log => {
                    const logEntry = document.createElement('div');
                    logEntry.className = 'log-entry';
                    logEntry.innerHTML = `
                        <span class="log-time">${formatTime(log.timestamp)}</span>
                        <span class="log-type ${log.type}">${getLogPrefix(log.type)}</span>
                        <span class="log-message">${log.message}</span>
                    `;
                    terminal.insertBefore(logEntry, cursorLine);
                });

                logCount.textContent = logs.length;

                if (autoScroll) {
                    terminal.scrollTop = terminal.scrollHeight;
                }
            }

            /* ══════════════════════════════════════════════════════════════
            BUTTON functions
            ══════════════════════════════════════════════════════════════ */
            async function toggleScript(){

                const wa_agent  = wa_agentSelect.value;
                const number = wa_agents.filter(key => key.name === wa_agent).at(0).number
                const state = await fetchBackendData(`${baseUrl}/api/wa/getstate?id=${wa_agent}`)
                const api_url =
                    state === 'READY'
                        ? 'close'
                        : 'initialise';
                                
               const res = await fetchBackendData(`${baseUrl}/api/wa/${api_url}?id=${wa_agent}&number=${number}`)
               addLog("info",`${baseUrl}/api/wa/${api_url}?id=${wa_agent}&number=${number}`)

            }


            function clearLogs() {
                logs = [];
                set_logs(logs)
                terminal.innerHTML = `
                    <div class="empty-state">No logs yet. Waiting for activity...</div>
                    <div class="cursor-line">
                        <span>$</span>
                        <div class="cursor"></div>
                    </div>
                `;
                logCount.textContent = '0';
            }

            /* ══════════════════════════════════════════════════════════════
            API CALLS
            ══════════════════════════════════════════════════════════════ */
            async function fetchBackendData(url) {
                
                let _ret = ""
                try {

                    // The URL should match your backend server and endpoint
                    const response = await fetch(url);

                    if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    _ret = await response.json(); // Parse the response body as JSON

                } catch (error) {

                    throw error;
                }

                return _ret
            }
