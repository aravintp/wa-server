
const {join} = require('path');
const {platform} = require('os');


// Check if OS is Windows
if (platform() === 'Linux') {
  /**
   * @type {import("puppeteer").Configuration}
   */
  module.exports = {
    // Changes the cache location for Puppeteer.
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
  };
}


console.log('Continuing script on ' + process.platform);