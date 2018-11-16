var chalk = require('chalk');
var configTool = require('../config-env')
var _fs = require('fs-extra')

module.exports = function (ctx) {
  var fs = ctx.requireCordovaModule('fs'),
    path = ctx.requireCordovaModule('path'),
    deferral = ctx.requireCordovaModule('q').defer();
  let platformPath = path.join(ctx.opts.projectRoot, "platforms");
  var argv = require('minimist')(process.argv.slice(2));
  let envMode = argv.env;
  let envData;

  let envConfigFile = path.resolve('src', 'environments', 'platform.env.json.tmp');
  const envWriter = require('../envconfig-writer');

  if (fs.existsSync(envConfigFile)) { // Exist,compare input and file's envMode.
    envData = JSON.parse(fs.readFileSync(envConfigFile, 'utf-8'));
    if ((typeof envMode === "undefined" && typeof envData.mode === "undefined") || typeof envData.mode === "undefined") {
      console.error(chalk.red(` \n [Error] missing --env or ${envConfigFile} propertie 'mode' was undefined.`));
      process.exit(-1);
    }
    if (typeof envMode === "undefined") {
      envMode = envData.mode; //when missing '--env'
    } else if (envMode !== envData.mode) { // overwrite file && remove platforms dir.
      _fs.removeSync(platformPath); // Remove platforms
      if (!fs.existsSync(platformPath)) { // check
        fs.mkdirSync(platformPath);
      }
      envWriter(envMode); // Save
    }
  } else {
    envWriter(envMode);
  }

  console.log(chalk.yellow(`\n Environment: \t ${envMode} \n `));

}
