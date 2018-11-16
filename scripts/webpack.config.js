const chalk = require("chalk");
const fs = require('fs');
const path = require('path');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');

var argv = require('minimist')(process.argv.slice(2));
var env = argv.env ? argv.env : '';
var release = argv.release ? true : false;

outputBanner();

// let pathEnv = path.join('.', 'src', 'environments', 'environment' + (env === '' ? '.ts' : `.${env}.ts`));

const envReader = require('./environment-reader');

let envConfigData = envReader(env);
let envConfigDataStr = JSON.stringify(envReader(process.cwd(), env));
let pathEnv = path.resolve(path.join('.', 'src', 'environments', 'environment.tmp'));
fs.writeFileSync(pathEnv, `export const Environment = ${envConfigDataStr}`);

useDefaultConfig.dev.resolve.alias = {
  "@app/env": pathEnv
};
useDefaultConfig.prod.resolve.alias = {
  "@app/env": pathEnv
};

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

function outputBanner() {
  let envCpy = env + '';
  if (envCpy === '') {
    envCpy = 'default';
  }
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
  // 判断当前环境
  let envConfigFile = path.resolve("src", 'environments', "platform.env.json.tmp");
  if (!fs.existsSync(envConfigFile)) {
    console.error(chalk.red(`\n Please readd flatform at first.`));
    process.exit(-1);
  }
  try {
    let envConfig = JSON.parse(fs.readFileSync(envConfigFile, "utf-8"));
    if (envConfig["environment"] === env) {
      console.log(chalk.blue("Environment has no changed!. \n ")); // env 没有改动，继续编译
      return;
    }
    // env 有变动，重新添加 platform
    let currentEnv = envConfig["environment"];
    console.log(chalk.blue(`Environment will change: ${currentEnv} ====> ${env} \n `));
    let execSync = require('child_process').execSync;
    execSync(`ionic cordova platform remove ${platform}`);
    execSync(`ionic cordova platform add ${platform}  -- --env=${env}`);
    // envConfig["environment"] = env;
    // fs.writeFileSync(envConfigFile, JSON.stringify(envConfig));
    // console.log(chalk.blue("Save environment.config. \n "));
  } catch (error) {
    console.error(chalk.red('\n' + error));
    process.exit(-1);
  }

}

module.exports = function () {
  return useDefaultConfig;
};
