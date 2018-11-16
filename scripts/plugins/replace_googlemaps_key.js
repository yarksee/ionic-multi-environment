const xml2js = require('xml2js');

module.exports = function (path, fs, envData) {
  console.log('\n Replace Google Maps Key...');
  let fileFetch = path.resolve('plugins', 'fetch.json');
  if (fs.existsSync(fileFetch)) {
    let fetchJson = JSON.parse(fs.readFileSync(fileFetch, 'utf-8'));
    let mapsPlugin = fetchJson['cordova-plugin-googlemaps'];
    if (mapsPlugin) {
      mapsPlugin.variables.API_KEY_FOR_ANDROID = envData.metadata.googleMapKeyAndroid;
      mapsPlugin.variables.API_KEY_FOR_IOS = envData.metadata.googleMapKeyIOS;
      fs.writeFileSync(fileFetch, JSON.stringify(fetchJson));
      console.log(`[Google Maps Key] save config: ${fileFetch}`);
    }
  }
  let filePackage = path.resolve('package.json');
  let packageData = JSON.parse(fs.readFileSync(filePackage, 'utf-8'));
  try {
    let mapsPlugin = packageData.cordova.plugins['cordova-plugin-googlemaps'];
    mapsPlugin.API_KEY_FOR_ANDROID = envData.metadata.googleMapKeyAndroid;
    mapsPlugin.API_KEY_FOR_IOS = envData.metadata.googleMapKeyIOS;
    fs.writeFileSync(filePackage, JSON.stringify(packageData));
    console.log(`[Google Maps Key] save package.json: ${filePackage} \n`);
  } catch (error) {
    console.log(error);
  }

  let fileConfig = path.resolve('config.xml');
  let configXml = fs.readFileSync(fileConfig, 'utf-8');
  let configData = parseStringSync(configXml);
  configData.widget.plugin.forEach(plugin => {
    if (plugin.$.name === 'cordova-plugin-googlemaps') {
      plugin.variable.forEach(_var => {
        if (_var.$.name === 'API_KEY_FOR_ANDROID') {
          _var.$.value = envData.metadata.googleMapKeyAndroid;
        } else if (_var.$.name === 'API_KEY_FOR_IOS') {
          _var.$.value = envData.metadata.googleMapKeyIOS;
        }
      });
    }
  });
  //Save to file.json --> xml
  let builder = new xml2js.Builder();
  let jsonxml = builder.buildObject(configData);
  try {
    fs.writeFileSync(fileConfig, jsonxml);
  } catch (error) {
    console.error(`Throw exception when write: ${fileConfig}`);
    console.error(error);
    process.exit(-1);
  }
}

function parseStringSync(xmlData) {
  let result;
  new xml2js.Parser().parseString(xmlData, (e, r) => {
    result = r;
  });
  return result;
}
