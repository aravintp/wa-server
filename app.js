
import { AsyncIterableUtil } from "puppeteer-core";
import axios from 'axios';

/**
 * 1) the phone number is static
 * 2) if the paring is overused the promise fais
 * 3) need to set axios n8n webhook
 */

import "./server.js"; // Import the app instance=
import './Wa-module.cjs';
import {initLogs,set_debug} from './global.js'

initLogs();
set_debug(false)

// receive message from n8n and reply to user
async function forward_msg(num,msg){

        whatsapp.sendMessage(num,msg);

        return;
};

// send message from wa to n8n
async function forward_n8n(msg) {

       // res = axios.post("url",msg)

        console.log("send to n8n")
        console.log(msg)
}



export {forward_msg,forward_n8n}