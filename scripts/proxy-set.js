const envMode = process.env.env;
if (typeof envMode === 'undefined') {
  return;
}

const envReader = require('./environment-reader');
const chalk = require("chalk");
const fs = require('fs');
const path = require('path');

let envConfigData = envReader(envMode);

setProxy(envConfigData);

/**
 * Set serve's proxy
 * @param {ionic.config.JSON} configData
 */
function setProxy(configData) {
  let fileConfig = path.resolve('ionic.config.json');
  if (!fs.existsSync(fileConfig)) {
    return;
  }
  let config = JSON.parse(fs.readFileSync(fileConfig, 'utf-8'));
  config.proxies = [];
  config.proxies.push({
    'proxyUrl': configData.baseUrl,
    'path': configData.endpoint
  });
  console.log(chalk.blue(`Save config to ${fileConfig} \n `));
  fs.writeFileSync(fileConfig, JSON.stringify(config));
}
