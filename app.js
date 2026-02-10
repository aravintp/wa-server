
const { AsyncIterableUtil } = require("puppeteer-core");
const {app} = require("./server"); // Import the app instance=
const whatsapp = require("./Wa-module"); // Import the app 
const axios = require('axios');

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


module.exports = {forward_msg,forward_n8n}