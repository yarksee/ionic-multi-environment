const xml2js = require('xml2js');
const fs = require('fs-extra');
const chalk = require("chalk");
const path = require('path');
module.exports = function (env) {
  if (typeof env === "undefined") {
    console.error(chalk.red(" \n Env was require!"));
    process.exit(-1);
  }

  const envReader = require('./environment-reader');
  let configData = envReader(env);

  let configFile = path.resolve('config.xml');

  //backup config.xml
  let bakFile = path.resolve('config.xml.bak');
  if (!fs.existsSync(bakFile)) {
    console.log("Copy config.xml to config.xml.bak");
    fs.copySync(configFile, bakFile);
  }
  try {
    let xmlData = fs.readFileSync(configFile, "utf-8");
    return new Promise((resolve, reject) => {
        xml2js.parseString(xmlData, function (err, config) {
          if (err) {
            reject(err);
          }
          resolve(config);
        })
      })
      .then(config => {
        config["widget"]["$"]["id"] = configData.cordova.id;
        config["widget"]["$"]["version"] = configData.cordova.version;
        config["widget"]["name"][0] = configData.cordova.name;

        //Save to file.json --> xml˝
        let builder = new xml2js.Builder();
        let jsonxml = builder.buildObject(config);
        try {
          fs.writeFileSync(configFile, jsonxml);
        } catch (error) {
          console.error(`Throw exception when write: ${configFile}`);
          console.error(error);
          process.exit(-1);
        }
      })
  } catch (error) {
    console.error(`Throw exception when read: ${configFile}`);
    process.exit(-1);
  }
}
