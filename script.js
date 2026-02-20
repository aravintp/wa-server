
let d = 0;
let d1 = 0;
            let isStopped = false;
            let autoScroll = true;
            let logId = 1;
            let logs = [];
        
            const terminal = document.getElementById('terminal');
            const logCount = document.getElementById('logCount');
            const startBtn = document.getElementById('startBtn');
            const wastatus = document.getElementById('status')
            const autoScrollBtn = document.getElementById('autoScrollBtn');
            const timeoutId = setTimeout(() => {
                let intervalId= setInterval(() => {
                    update_WaStatus();
                        }, 2000);
            }, 5000);
                        
            document.getElementById('startBtn').addEventListener('click', toggleScript);
                        
            document.getElementById('autoScrollBtn').addEventListener('click', toggleAutoScroll);

            // Add initial logs
            function initLogs() {
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
            function addLog(type, message) {
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
            function renderLogs() {
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



            async function toggleAutoScroll() {

                
                // autoScroll = !autoScroll;
                // if (autoScroll) {
                //     autoScrollBtn.classList.add('active');
                //     terminal.scrollTop = terminal.scrollHeight;
                // } else {
                //     autoScrollBtn.classList.remove('active');
                // }
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

            async function toggleScript(){
                
                isStopped = !isStopped;
                const api_url = isStopped ? 'wa-initialise' : 'wa-close' ;
                startBtn.textContent = isStopped ? '■ Stop' : '▶ Start' ;


                await fetchBackendData(`http://localhost:8080/api/${api_url}`)

            }

            async function update_WaStatus() {

                const url = 'http://localhost:8080/api/getstate'
                try {
                    
                    var state = await fetchBackendData(url)
                } catch (error) {
                    state = "Offine"
                }
                wastatus.textContent = `Status: ${state.toLowerCase()}`
            }

            // Initialize
            initLogs();

            // receive message
            socket.on('event message', (n) => {
            }); 

            // receive logs
            socket.on('event logs', (n) => {

               // console.log('evt \n', n)
                let n_logs = get_new_logs(logs,n)
                //console.log(n_logs)
            
                n_logs.forEach(e => {
                   addLog(e.type,e.message)
                })

            }); 

                        
            // FUkcing old way to do, but it works -_-!
            function get_new_logs(mainArray,newArray){
                
               // console.log('gnl')
                const sha_copy = []

                const main_is_larger =  mainArray.length > newArray.length;
                const m = main_is_larger? mainArray:newArray
                const n = main_is_larger? newArray:mainArray

                for (let index = 0; index < m.length; index++) {
                    const e = m[index];
                        
                    for (let index2 = 0; index2 < n.length; index2++) {
                        const e2 = n[index2];
                        const same = e.message === e2.message
                        const eol = index2 === n.length-1
                        
                        if (same){ 
                            break; }

                        if (eol){ 
                            sha_copy.push(e) }
                    }
                }
                
                return !main_is_larger? sha_copy: []
            }


            async function fetchBackendData(url) {
                
                let _ret = ""
                try {
                    
                    const baseUrl = window.location.origin; 

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
