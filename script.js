
           // var {logs,createLog} = require('./global')
            
            import { logs,createLog } from "./global";
            let isPaused = false;
            let autoScroll = true;
            let intervalId = null;
        
            const terminal = document.getElementById('terminal');
            const logCount = document.getElementById('logCount');
            const pauseBtn = document.getElementById('pauseBtn');
            const autoScrollBtn = document.getElementById('autoScrollBtn');

            // Add initial logs
            function initLogs() {
                addLog('info', 'WhatsApp Forwarder initialized');
                addLog('success', 'Connected to n8n webhook endpoint');
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
                    default: return '[INFO]';
                }
            }

            // This funtion adds to log array and pushes to display it
            function addLog(type, message) {
                const log = createLog(type,message)
                
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

            // function simulateLog() {
            //     const randomMsg = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
            //     addLog(randomMsg.type, randomMsg.message);
            // }

            // function startSimulation() {
            //     if (!isPaused && !intervalId) {
            //         intervalId = setInterval(simulateLog, 3000);
            //     }
            // }

            function stopSimulation() {
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }

            function togglePause() {
                isPaused = !isPaused;
                pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
                
                if (isPaused) {
                    stopSimulation();
                } else {
                    startSimulation();
                }
            }

            function toggleAutoScroll() {
                autoScroll = !autoScroll;
                if (autoScroll) {
                    autoScrollBtn.classList.add('active');
                    terminal.scrollTop = terminal.scrollHeight;
                } else {
                    autoScrollBtn.classList.remove('active');
                }
            }

            function clearLogs() {
                logs = [];
                terminal.innerHTML = `
                    <div class="empty-state">No logs yet. Waiting for activity...</div>
                    <div class="cursor-line">
                        <span>$</span>
                        <div class="cursor"></div>
                    </div>
                `;
                logCount.textContent = '0';
            }

            // Public function to add custom logs (call from your Node.js app)
            globalThis.addCustomLog = function(type, message) {
                addLog(type, message);
            };
            
            // Initialize
            initLogs();

            socket.on('event message', (n) => {
                //addLog(n.type.toString(),n.msg.toString())

                console.log("at scipt.js\n", logs)
            }); 

        
