//const WhatsAppClient = require('./whatsapp');

import WhatsAppClient from './Wa-class.cjs';

const wa = new WhatsAppClient();

wa.initClient();

await wa.sendMessage('6581234567@c.us', 'Hello');