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

let envStr = JSON.stringify(envReader(process.cwd(), env));
let pathEnv = path.resolve(path.join('.', 'src', 'environments', 'environment.tmp'));
fs.writeFileSync(pathEnv, `export const Environment = ${envStr}`);

useDefaultConfig.dev.resolve.alias = {
  "@app/env": pathEnv
};
useDefaultConfig.prod.resolve.alias = {
  "@app/env": pathEnv
};

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

module.exports = function () {
  return useDefaultConfig;
};
