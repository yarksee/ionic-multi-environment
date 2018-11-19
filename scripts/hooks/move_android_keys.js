var chalk = require('chalk');
var _fs = require('fs-extra')

module.exports = function (ctx) {
  var fs = ctx.requireCordovaModule('fs'),
    path = ctx.requireCordovaModule('path'),
    deferral = ctx.requireCordovaModule('q').defer();

  let pathSign = path.resolve('etc', 'sign');
  let pathAndroid = path.resolve('platforms', 'android');

  let files = _fs.readdirSync(pathSign);
  console.log(chalk.blue(`Copy ${pathSign} ====> ${pathAndroid}`));
  files.forEach(file => {
    _fs.copyFileSync(path.join(pathSign, file), path.join(pathAndroid, file));
  });
}
