require('typescript-require');
var chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = function (envMode) {
  if (typeof envMode === "undefined") {
    console.error(chalk.red(` \n [Error] missing env \n `));
    process.exit(-1);
  }
  let dirEnv = path.resolve('src', 'environments');
  if (!fs.existsSync(dirEnv)) {
    console.error(chalk.red(`${dirEnv} not exist! \n `));
    process.exit(-1);
  }
  let fileEnv = path.join(dirEnv, `environment` + `.${envMode}.ts`);
  if (!fs.existsSync(fileEnv)) {
    console.error(chalk.red(`${fileEnv} not found! \n `));
    process.exit(-1);
  }

  let fileDefaltEnv = path.join(dirEnv, 'environment.ts');
  let envDefaut = require(fileDefaltEnv).Environment;
  let envConfig = require(fileEnv).Environment;

  if (!envDefaut) {
    console.error(chalk.red(`${fileDefaltEnv} invaild.\n`));
    process.exit(-1);
  }
  if (!envConfig) {
    console.error(chalk.red(`${fileEnv} invaild.\n`));
    process.exit(-1);
  }

  return Object.assign(copy(envDefaut), envConfig);
}

/**
 * Copy Object
 * @param {*} params object
 * @returns Copy
 */
function copy(params) {
  return JSON.parse(JSON.stringify(params));
}
