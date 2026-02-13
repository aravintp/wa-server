
    var logs = [];
    var logs2 = [];
    var logId = 1;
    var debug = false;


    export function initLogs() {
        add_log('info', 'WhatsApp Forwarder initialized');
        add_log('info', 'Listening for incoming messages...');
        add_log('success', 'Connected to n8n webhook endpoint');
    }

    
    export function initLogs2() {
        add_log2('info', 'WhatsApp eerrr initialized');
        add_log2('info', 'Listening for up messages...');
        add_log2('success', 'Connected to n8n webhook endpoint');
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

    // Setter to set temperature using a Celsius value
    export function add_log(n,s) {

        const log =  createLog(n,s)
        logs.push(log)
    }

    export function add_log2(n,s) {

        const log =  createLog(n,s)
        logs2.push(log)
    }
    initLogs()
    initLogs2()

console.log(logs2)
  
function mergeUniqueValues(obj1, obj2) {
  const combined = { ...obj1, ...obj2 };

  //console.log(combined)
  // Check if both objects have the 'values' key (or the specific key you want to merge)
  if (obj1.message && obj2.message && Array.isArray(obj1.message) && Array.isArray(obj2.message)) {
    // Combine the arrays and use a Set to get unique values
    const uniqueValues = new Set([...obj1.message, ...obj2.message]);
    combined.values = Array.from(uniqueValues);
  }

  return combined;
}

const result = mergeUniqueValues(logs,logs2)
