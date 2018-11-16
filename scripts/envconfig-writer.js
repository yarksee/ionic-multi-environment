var chalk = require('chalk');
const fs = require('fs');
const path = require('path');
module.exports = function (envMode) {
  let envConfigFile = path.resolve('src', 'environments', 'platform.env.json.tmp');
  fs.writeFileSync(envConfigFile, JSON.stringify({
    mode: envMode
  }));
}
