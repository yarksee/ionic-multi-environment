var chalk = require('chalk');
var configTool = require('../config-env')
var _fs = require('fs-extra')

module.exports = function (ctx) {
  var fs = ctx.requireCordovaModule('fs'),
    path = ctx.requireCordovaModule('path'),
    deferral = ctx.requireCordovaModule('q').defer();
  let platformPath = path.join(ctx.opts.projectRoot, "platforms");
  if (!fs.existsSync(platformPath)) {
    try {
      fs.mkdirSync(platformPath);
    } catch (error) {
      throw error;
    }
  }
  var argv = require('minimist')(process.argv.slice(2));
  let env = argv.env ? argv.env : '';
  if (env === '') {
    console.log(chalk.yellow(`\n Environment: \t default`));
  } else {
    console.log(chalk.yellow(`\n Environment: \t ${env}`));
  }

  let envConfigFile = path.resolve('src', 'environments', 'platform.env.json.tmp');
  const envWriter = require('../envconfig-writer');
  if (!fs.existsSync(envConfigFile) ) {
    _fs.removeSync(platformPath); // Remove dir platforms
    if (!fs.existsSync(platformPath)) { // check
      console.log(chalk.yellow(`\n Recreate dir: ${platformPath}...`));
      fs.mkdirSync(platformPath);
    }
  } else {
    let envData = JSON.parse(fs.readFileSync(envConfigFile, 'utf-8'));
    const envReader = require('../environment-reader');
    let configData = envReader(env);
    if (!envData.mode | envData.mode !== configData.mode) {
      _fs.removeSync(platformPath); // Remove dir platforms
      if (!fs.existsSync(platformPath)) { // check
        console.log(chalk.yellow(`\n Recreate dir: ${platformPath}...`));
        fs.mkdirSync(platformPath);
      }
    }
  }
  envWriter(env);
  return configTool(env);
}
