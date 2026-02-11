
    var logs = [];
    var logId = 1;

   function createLog(type, message){
         log = {
            id: logId++,
            type: type,
            message: message,
            timestamp: new Date()
        };

        return log
    }

    function getlogs(){return logs}
