const qrcode = require('qrcode-terminal');
const { Client, LocalAuth  } = require('whatsapp-web.js');


const whatsapp = new Client({
    authStrategy: new LocalAuth(),
    // temp
    webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/refs/heads/main/html/2.3000.1031490220-alpha.html`,    
    },
});

// whatsapp
whatsapp.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});


whatsapp.on('ready', () => {
    console.log('Client is ready!');
});

whatsapp.on('message', async message => {
    console.log(message)
    // if(message.body === '!ping') {
    // 	message.reply('pong');
    // }
});
// end whatsapp


module.exports = whatsapp;