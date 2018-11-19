const xml2js = require('xml2js');
const fs = require('fs-extra');
const chalk = require("chalk");
const path = require('path');
module.exports = function (ENV_MODE) {
  if (typeof ENV_MODE === "undefined") {
    console.error(chalk.red(" \n ENV_MODE was require!"));
    process.exit(-1);
  }

  const envReader = require('./environment-reader');
  let configData = envReader(ENV_MODE);

  let configFile = path.resolve('config.xml');

  //backup config.xml
  let bakFile = path.resolve('config.xml.bak');
  if (!fs.existsSync(bakFile)) {
    console.log("Copy config.xml to config.xml.bak");
    fs.copySync(configFile, bakFile);
  }
  let xmlData = fs.readFileSync(configFile, "utf-8");
  let config = parseStringSync(xmlData);
  config.widget.$.id = configData.cordova.id;
  config.widget.$.version = configData.cordova.version;
  config.widget.name = [configData.cordova.name];

  //Save to file.json --> xml
  let builder = new xml2js.Builder();
  let jsonxml = builder.buildObject(config);
  try {
    fs.writeFileSync(configFile, jsonxml);
  } catch (error) {
    console.error(`Throw exception when write: ${configFile}`);
    console.error(error);
    process.exit(-1);
  }
}

function parseStringSync(xmlData) {
  let result;
  new xml2js.Parser().parseString(xmlData, (e, r) => {
    result = r;
  });
  return result;
}
