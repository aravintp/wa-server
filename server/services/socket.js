import express from 'express'

// socket.js
export function setupSocket(io, send_log, getLogs) {

    let clients = new Set();

               /**
         * Web socket io
         `*/
        function sendtoFrontend(m){
            // send one single message, maybe like 'fuck you, this is too early!'
            io.emit('event message',{
            type: m.type,
            msg: m.msg}); 
        }

        function logstoFrontend(m){
            // send the whole log instead, cos you are a lazy fuck
            // added newlogs to check log bug
            if(socket_connected && newlogs)
                io.emit('event logs',m); 

                // this wont work
               //newlogs = false;
        }


    io.on('connection', (socket) => {
        clients.add(socket.id);

        send_log({ type: 'success', msg: `Client connected: ${socket.id}` });

        // send logs immediately on connect
        socket.emit('event logs', getLogs());

        socket.on('disconnect', () => {
            clients.delete(socket.id);
            send_log({ type: 'info', msg: `Client disconnected: ${socket.id}` });
        });
    });

    // controlled interval
    setInterval(() => {
        if (clients.size > 0) {
            io.emit('event logs', getLogs());
        }
    }, 3000);
}