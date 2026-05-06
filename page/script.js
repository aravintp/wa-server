import {} from "./dashboard.js"
import {} from "./sidebar.js"
import { wastatus,logs,addLog,initLogs } from "./terminal.js";


            const baseUrl = window.location.origin; 
            const timeoutId = setTimeout(() => {
                let intervalId= setInterval(() => {
                    update_WaStatus();
                        }, 2000);
            }, 5000);


            // Initialize
            initLogs();
            
            async function update_WaStatus() {
                const state = await get_server_state()
                wastatus.textContent = `Status: ${state}`
            }

            async function get_server_state(){
                
                const url = `${baseUrl}/api/getstate`

                try {
                    var state = await fetchBackendData(url)

                } catch (error) {
                    state = "Offine"   
                }
                
                return state
            }


            // receive message
            socket.on('event message', (n) => {
            }); 

            // receive logs
            socket.on('event logs', (n) => {

                let n_logs = get_new_logs(logs,n)

                // added this to check log bugs
                console.log(`log: ${logs[logs.length-1].message}`)
                console.log(`log2: ${n[0].message}`)

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
