
const {join} = require('path');
const {platform} = require('os');
        const {send_log} = require('./global.js');
const cacheDir =join(__dirname , '.cache' ,'puppeteer')

// Check if OS is Windows
if (platform() === 'Linux') {
  /**
   * @type {import("puppeteer").Configuration}
   */
  module.exports = {
    // Changes the cache location for Puppeteer.
    cacheDirectory: join(cacheDir),
  };
}


// console.log('Puppeteer cache dir at ' + cacheDir);
// console.log('Continuing script on ' + process.platform);

send_log({
    type:'debug',
    msg: 'Puppeteer cache dir at ' + cacheDir})

    
send_log({
    type:'debug',
    msg: 'Continuing script on ' + process.platform})
