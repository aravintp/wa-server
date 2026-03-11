
    
    
    import TelegramBot from 'node-telegram-bot-api'
    const token = '8795149074:AAHDYsBmChN-sdCkcsf7Q79bLvFPbiqDjmI';
    const chat_id = "-5187352091"
    const bot = new TelegramBot(token, {polling: false});

    const intervalId= setInterval(() => {
        bot_sendlogs();
            }, 2000);


    var logId = 1;
    var debug = false;
    var bot_log = [];
    export var logs = [];

    send_log({
        type:'debug',
        msg: `@Module: global.js entered`
    })

    export function initLogs() {
        add_log('info', 'WhatsApp Forwarder initialized');
        add_log('info', 'Listening for incoming messages...');
       // add_log('success', 'Connected to n8n webhook endpoint');
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

        // ugly date variable. To use with pm2. 
        let date = new Date()
        let d = "[" + date.toLocaleDateString().replaceAll("/","-") + 
        " " + date.toTimeString().split(' ')[0] + "]"

        let log = createLog(n.type,n.msg)

        logs.push(log);
        bot_log.push({time:d,msg:n.msg})
        console.log(d,n.msg)

    }

    function bot_sendlogs(){

        // var message = bot_log.length + "wa-server internal123\n\n";
        // bot_log.forEach(m =>{
        //     message += `${m.time} ${m.msg}\n`;
        // })

        // if (Array.isArray(bot_log) && bot_log.length > 0) {
        //     bot.sendMessage(chat_id, "message");
        //    console.log(message)
        //     bot_log = []
        // }
    }