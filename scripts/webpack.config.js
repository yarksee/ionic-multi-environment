const chalk = require("chalk");
const fs = require('fs');
const _fs = require('fs-extra');
const path = require('path');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');

var argv = require('minimist')(process.argv.slice(2));
var env = process.env.ENV_MODE ? process.env.ENV_MODE : 'dev'; // Set default env='dev'
var release = argv.release ? true : false;

outputBanner();

// let pathEnv = path.join('.', 'src', 'environments', 'environment' + (env === '' ? '.ts' : `.${env}.ts`));

const envReader = require('./environment-reader');

let envConfigData = envReader(env);
let envConfigDataCpy = JSON.parse(JSON.stringify(envConfigData));
if (envConfigDataCpy.metadata) {
  delete envConfigDataCpy.metadata;
}
let envConfigDataStr = JSON.stringify(envConfigDataCpy);
let pathEnv = path.resolve(path.join('.', 'src', 'environments', 'environment.tmp'));
fs.writeFileSync(pathEnv, `export const Environment = ${envConfigDataStr}`);

useDefaultConfig.dev.resolve.alias = {
  "@app/env": pathEnv
};
useDefaultConfig.prod.resolve.alias = {
  "@app/env": pathEnv
};

if (process.env.IONIC_PLATFORM) { // Try to build cordova native app
  require('./config-env')(envConfigData.mode); // Save config to config.xml
  let glob = require('glob'),
    path = require('path');

  glob.sync(path.resolve('scripts', 'plugins') + '/*.js').forEach((file) => {
    try {
      console.log(`Find plugin: ${file}.`);
      require(path.resolve(file))(path, fs, JSON.parse(JSON.stringify(envConfigData)));
    } catch (error) {
      console.error(chalk.red(` \n [Error] require(${file}) \n  \t ${error}`));
    }
  });

  processPlatform();
}

function outputBanner() {
  let envCpy = env + '';
  let tmplEnv = envCpy + '';
  if (env.length < 15) {
    for (let i = 0; i < 15 - envCpy.length; i++) {
      tmplEnv += ' ';
    }
  } else {
    tmplEnv = tmplEnv.slice(0, 15 - 3) + '...';
  }
  console.log(chalk.green(
    '\n' +
    `**********************************\n` +
    `*                                *\n` +
    `*     Env:        ${tmplEnv}*\n` +
    `*     Release:    ${release?release+' ':release}          *\n` +
    `*                                *\n` +
    `**********************************\n`
  ));
}

function processPlatform() {
  let platform = process.env.IONIC_PLATFORM;
  let envConfigFile = path.resolve("src", 'environments', "platform.env.json.tmp");
  if (!fs.existsSync(envConfigFile)) {
    console.error(chalk.red(`\n Please readd platforms.`));
    process.exit(-1);
  }
  try {
    let envConfig = JSON.parse(fs.readFileSync(envConfigFile, "utf-8"));
    if (typeof envConfig.mode === "undefined") {
      console.error(chalk.red(` \n [Error] missing --env or ${envConfigFile} propertie 'ENV_MODE' was undefined.`));
      process.exit(-1);
    }
    if (envConfig.mode === env) {
      // console.log(chalk.blue("Environment have no change. \n ")); // env have no change.
      return; // no change,go on.
    }
    // env has changed. remove all platforms and readd.
    console.log(chalk.blue(`Environment will change: ${envConfig.mode} ====> ${env} \n `));
    let platformPath = path.resolve('platforms');
    _fs.removeSync(platformPath); // Remove platforms
    if (!fs.existsSync(platformPath)) { // check
      fs.mkdirSync(platformPath);
    }
    let execSync = require('child_process').execSync;
    execSync(`ionic cordova platform remove ${platform}`, {
      stdio: [0, 1, 2]
    });
    execSync(`ionic cordova platform add ${platform}  -- --env=${env}`, {
      stdio: [0, 1, 2]
    });
  } catch (error) {
    console.error(chalk.red('\n' + error));
    process.exit(-1);
  }

}

module.exports = function () {
  return useDefaultConfig;
};
