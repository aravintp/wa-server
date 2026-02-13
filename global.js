
    import { sendtoFrontend } from "./server.js";

    logs = [];
    var logId = 1;
    var debug = false;

    send_log({
        type:'debug',
        msg: `@Module: global.js entered`
    })

    export function initLogs() {
        add_log('info', 'WhatsApp Forwarder initialized');
        add_log('info', 'Listening for incoming messages...');
        add_log('success', 'Connected to n8n webhook endpoint');
    }


    export function createLog(type, message){
            let log = {
                id: logId++,
                type: type,
                message: message,
                timestamp: new Date()
            };

            return log
        }
        
    // Getter to retrieve temperature in Celsius
    export function get_logs() {
        return logs
    }

    // Setter to set temperature using a Celsius value
    export function set_logs(n) {
        logs = n
    }

    export function set_debug(n){
        debug = n;
    }

    export function get_debug(){
        return debug;
    }
    
    // Setter to set temperature using a Celsius value
    export function add_log(n,s) {

        const log =  createLog(n,s)
        logs.push(log)
    }


    
    // Send log to front end and print console
    export function send_log(n){

        let log = createLog(n.type,n.msg)

        logs.push(log);
        sendtoFrontend(n)
        
        console.log(n.msg)
    };