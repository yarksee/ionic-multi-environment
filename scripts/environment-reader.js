require('typescript-require');
var chalk = require('chalk');
const fs = require('fs');
const path = require('path');

module.exports = function (rootPath, env) {
  let dirEnv = path.join(rootPath, 'src', 'environments');
  if (!fs.existsSync(dirEnv)) {
    console.error(chalk.red(`${dirEnv} not exist! \n `));
    process.exit(-1);
  }
  let fileEnv = path.join(dirEnv, `environment` + (env === '' ? '.ts' : `.${env}.ts`));
  if (!fs.existsSync(fileEnv)) {
    console.error(chalk.red(`${fileEnv} not found! \n `));
    process.exit(-1);
  }

  let fileDefaltEnv = path.join(dirEnv, '/environment.ts');
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
 * Copy 一个对象
 * @param {*} params 对象
 * @returns Copy 对象
 */
function copy(params) {
  return JSON.parse(JSON.stringify(params));
}
