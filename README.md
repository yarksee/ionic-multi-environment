# ionic 3 开发环境切换

## 解决的问题
1. 项目开发时，浏览器调试存在的 `CORS`(跨域)问题
2. 编译`ios`或`android`时，(半)自动化切换环境的问题
3. 根据不同的环境，使用不同的`key`(如果`Google Maps key`）
4. `Android`打包签名的`key`


## 开始
项目假设有`3`中环境：
1. `dev`，开发者本机开发环境
2. `uat`，用户测试环境
3. `prod`，生产(正式)环境

在`src/environments/`下创建对应文件:
```
.
├── README.md
├── config.xml
├── ionic.config.json
├── package-lock.json
├── package.json
├── src
│   ├── environments
│   │   ├── environment.dev.ts  // dev
│   │   ├── environment.prod.ts //prod
│   │   ├── environment.ts
│   │   └── environment.uat.ts  // uat
│   ├── index.html
│   ├── manifest.json
│   ├── pages
│   ├── service-worker.js
│   └── theme
│       └── variables.scss
├── tsconfig.json
├── tslint.json
└── yarn.lock
```
### 从`environment.ts`说起
`environment.ts`:

```typescript
export const Environment = {
  mode: 'dev',
  debug: true,
  baseUrl: 'http://localhost:8080/dev/',
  endpoint: '/ionic',
  defaultOnly: true,
  cordova: {
    name: 'Developer app.',
    id: 'io.ionic.dev',
    version: '1.0.1'
  },
  metadata: { // this propertie will be removed when build.
    googleMapKeyAndroid: 'dev-google-maps-key-android',
    googleMapKeyIOS: 'dev-google-maps-key-ios'
  }
}
```
`environment.ts`文件是其它`environment.*.ts`的基类，编译时，会把`environment.*.ts`覆盖到`environment.ts`中。这样做的好处是，`environment.*.ts`可以选择性的重写自己需要的属性，而不是所有都必须重写。
#### 比如
假设所有的环境下，`debug`都为`true`，那对应的`environment.ts`：
```typescript
export const Environment = {
  debug: true,
}
```
其它的`environment.*.ts`中，如`environment.uat.ts`接可以省略`debug: true`.


### 其它环境
`environment.dev.ts`:
```typescript
export const Environment = {
}
```
`environment.uat.ts`:
```typescript
export const Environment = {
  mode: 'uat',
  baseUrl: 'http://localhost:8080/uat/',
  cordova: {
    name: 'UAT app.',
    id: 'io.ionic.uat'
  },
  metadata: {
    googleMapKeyAndroid: 'uat-google-maps-key-android',
    googleMapKeyIOS: 'uat-google-maps-key-ios'
  }
}
```

`environment.prod.ts`:
```typescript
export const Environment = {
  mode: 'prod',
  debug: false,
  baseUrl: 'https://ionicframework.com/',
  cordova: {
    name: 'Prod app.',
    id: 'io.ionic.prod'
  },
  metadata: {
    googleMapKeyAndroid: 'prod-google-maps-key-android',
    googleMapKeyIOS: 'prod-google-maps-key-ios'
  }
}
```

## 实现(半)自动化切换环境
要实现环境切换，需要的步骤如下:
1. 编写`js`脚本，在执行编译命令时，读取、整合`environment.*.ts`配置，生成整合后的临时文件`environment.tmp`.
2. 将`ionic`的编译配置指向临时文件`environment.tmp`.
3. 编译

在编写脚本之前，需要将嵌入脚本：
### 修改`tsconfig.json`
插入:
```json
{
  "compilerOptions": {
    "paths": {
      "@app/env": [
        "environments/environment"
      ]
    }
  }
}
```
### 修改`package.json`
插入:
```json
"config": {
    "ionic_webpack": "./scripts/webpack.config.js"
  }
```

### 编写`webpack.config.js`脚本
创建目录及文件`scripts/webpack.config.js`：
```
.
├── README.md
├── config.xml
├── ionic.config.json
├── package-lock.json
├── package.json
├── scripts
│   ├── config-env.js
│   ├── envconfig-writer.js
│   ├── environment-reader.js
│   ├── hooks
│   ├── proxy-set.js
│   └── webpack.config.js
├── src
│   ├── app
│   ├── assets
│   ├── environments
│   ├── index.html
│   ├── manifest.json
│   ├── pages
│   ├── service-worker.js
│   └── theme
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

编写代码：
```javascript
const chalk = require("chalk");
const fs = require('fs');
const _fs = require('fs-extra');
const path = require('path');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');

var argv = require('minimist')(process.argv.slice(2));
var env = process.env.ENV_MODE ? process.env.ENV_MODE : 'dev'; // Set default env='dev'
var release = argv.release ? true : false;

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
module.exports = function () {
  return useDefaultConfig;
};

```
因为需要加载`environment.*.ts`的内容，所以还需要一个工具类`environment-reader.js`:
`environment-reader.js`

```javascript
require('typescript-require');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const objectAssignDeep = require(`object-assign-deep`);

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
  return objectAssignDeep(copy(envDefaut), envConfig);

  // return Object.assign(copy(envDefaut), envConfig);
}

/**
 * Copy Object
 * @param {*} params object
 * @returns Copy
 */
function copy(params) {
  return JSON.parse(JSON.stringify(params));
}

```
### 测试
在`home.ts`中:
```typecript
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Environment as ENV } from '@app/env'   // import 编写的环境

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController) {
    let e = ENV;
    console.log(ENV.mode);
    debugger;
  }

}
```
在控制台中执行：
```
ENV_MODE=dev ionic serve
```

## 设置`Proxy`代理
执行完上面的操作后，可以完成自动化切换环境，但还没解决在浏览器中调试时的`CORS 跨域`问题，这里我们可以通过`ionic`自带的代理完成.
创建文件`scripts/proxy-set.js`
```
.
├── README.md
├── config.xml
├── ionic.config.json
├── package-lock.json
├── package.json
├── scripts
│   ├── config-env.js
│   ├── envconfig-writer.js
│   ├── environment-reader.js
│   ├── hooks
│   ├── proxy-set.js
│   └── webpack.config.js
├── tsconfig.json
├── tslint.json
└── yarn.lock
```
`proxy-set.js`
```javascript
const envMode = process.env.ENV_MODE;
if (typeof envMode === 'undefined') {
  return;
}
const envReader = require('./environment-reader');
const chalk = require("chalk");
const fs = require('fs');
const path = require('path');

let envConfigData = envReader(envMode);

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
```
在`package.json`中，加入`ionic CLI`的`Hooks`
`package.json`
```json
"scripts": {
    "ionic:serve:before": "node ./scripts/proxy-set.js"
}
```
### 测试
执行
```
ENV_MODE=dev ionic serve
```
注意输出:
```
> ionic-app-scripts serve --address 0.0.0.0 --port 8100 --livereload-port 35729 --dev-logger-port 53703 --nobrowser
[app-scripts] [11:07:50]  ionic-app-scripts 3.2.0
[app-scripts] [11:07:50]  watch started ...
[app-scripts] [11:07:50]  build dev started ...
[app-scripts] [11:07:50]  Proxy added:/ionic => http://localhost:8080/dev/  // <= 注意这行，如果有输出，代表成功
[app-scripts] [11:07:50]  clean started ...
```

## 自动修改`Cordova platform`编译参数
在编译`Cordova`时，我们需要修改`config.xml`中的`id`,`name`,`version`等属性，这些属性就是我们在前文的`environment.*.ts`的`cordova`中已经定义的属性，我们在编译前读取属性，再替换就能实现我们要的效果
### 思路
这里可能有几个case需要考虑(鉴于我们现在基本只要照顾`ios`&`android`，所以我们默认只有这两个`platform`)。
1. 我们需要通过一个临时文件来保存当前的`env`的状态，否则可能在已添加`android`平台的情况下，再添加`ios`会导致环境参数不一致的问题(如先添加`dev`的`android`，再添加`ios`时，由于错误添加了`uat`的版本)
2. 有些`Cordova plugin`，如`Google Maps`，替换对应的`key`时，不是只修改`package.json`|`config.xml`下的参数就能正确实现切换的，只有`remove plugin`后重新添加`plugin`时才能正确切换
3. etc...

### 实现自动修改`config.xml`
我们需要修改`config.xml`中的`id`、`version`、`name`三个参数，所以，创建文件`scripts/config-env.js`
```
.
├── README.md
├── config.xml
├── ionic.config.json
├── package-lock.json
├── package.json
├── scripts
│   ├── config-env.js
│   ├── envconfig-writer.js
│   ├── environment-reader.js
│   ├── hooks
│   ├── proxy-set.js
│   └── webpack.config.js
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

`config-eng.js`
```javascript
const xml2js = require('xml2js');
const fs = require('fs-extra');
const chalk = require("chalk");
const path = require('path');
module.exports = function (ENV_MODE) {
  if (typeof ENV_MODE === "undefined") {
    console.error(chalk.red(" \n ENV_MODE was require!"));
    process.exit(-1);
  }

  const envReader = require('./environment-reader');
  let configData = envReader(ENV_MODE);

  let configFile = path.resolve('config.xml');

  //backup config.xml
  let bakFile = path.resolve('config.xml.bak');
  if (!fs.existsSync(bakFile)) {
    console.log("Copy config.xml to config.xml.bak");
    fs.copySync(configFile, bakFile);
  }
  let xmlData = fs.readFileSync(configFile, "utf-8");
  let config = parseStringSync(xmlData);
  config.widget.$.id = configData.cordova.id;
  config.widget.$.version = configData.cordova.version;
  config.widget.name = [configData.cordova.name];

  //Save to file.json --> xml
  let builder = new xml2js.Builder();
  let jsonxml = builder.buildObject(config);
  try {
    fs.writeFileSync(configFile, jsonxml);
  } catch (error) {
    console.error(`Throw exception when write: ${configFile}`);
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
```

### 一个`Bug`
做完上面那一步，已经可以实现了。但是，前文中提到的case，还没有解决，所以我们还需要解决它
创建`scripts/before_platform_add.js`
`before_platform_add.js`
```javascript
var chalk = require('chalk');
var _fs = require('fs-extra')

module.exports = function (ctx) {
  var fs = ctx.requireCordovaModule('fs'),
    path = ctx.requireCordovaModule('path'),
    deferral = ctx.requireCordovaModule('q').defer();
  let platformPath = path.join(ctx.opts.projectRoot, "platforms");
  let envMode = process.env.ENV_MODE;
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
    if (typeof envMode === 'undefined') { // default env.
      envMode = 'dev';
    }
    envWriter(envMode);
  }

  console.log(chalk.yellow(`\n Environment: \t ${envMode} \n `));

}
```
在`config.xml`中插入
```xml
<widget id="io.ionic.dev version=”1.0.1">

    <hook src="scripts/hooks/before_platform_add.js" type="before_platform_add" />

</widget>
```

### 测试
执行
```
 ENV_MODE=dev ionic cordova build android
```
查看`config.xml`,成功
```xml
<widget id="io.ionic.dev version=”1.0.1">
    <name> Developer app.</name>
    <!--... -->
</widget>
```
## 依据环境切换第三方服务的`Key`[`Google Maps`为例]
在前面创建的`webpack.config.js`中，有这么一段代码:
```javascript
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
```
这是扫描`scripts/plugins`文件夹下的`js`脚本，并运行。这会在`ionic cordova build {platform}`时调用
我们创建`scripts/pluigns/replace_googlemaps_key.js`
```
.
├── README.md
├── config.xml
├── ionic.config.json
├── package-lock.json
├── package.json
├── scripts
│   ├── config-env.js
│   ├── envconfig-writer.js
│   ├── environment-reader.js
│   ├── hooks
│   ├── proxy-set.js
│   └── webpack.config.js
├── tsconfig.json
├── tslint.json
└── yarn.lock
```

`replace_googlemaps_key.js`
```javascript
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
```

### 完成

## Android 签名
签名利用的是`Cordova Hooks`实现

1. 创建`debug-keys.jks`及`release-keys.jks`两个证书文件，并写好对应的`*.properties`文件，放至`etc/sign/`目录下
    ```
    .
├── README.md
├── config.xml
├── etc
│   └── sign
│       ├── debug-keys.jks
│       ├── debug-signing.properties
│       ├── release-keys.jks
│       └── release-signing.properties
├── ionic.config.json
├── package-lock.json
├── package.json
├── tsconfig.json
├── tslint.json
└── yarn.lock
    ```

2. 编写对应的`*.properties`文件
    如`debug-signing.propertie`:
    ```
    storeFile=debug-keys.jks
    storePassword=debugdebug
    keyAlias=debug
    keyPassword=debugdebug
    ```

1. 创建`scripts/hooks/move_android_keys.js`
    `move_android_keys.js`
    ```javascript
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
    ```

### 测试
执行(测试`release`签名)
```
ENV_MODE=dev ionic cordova build android --release
```
成功
```
:app:packageRelease UP-TO-DATE
:app:assembleRelease
:app:cdvBuildRelease

BUILD SUCCESSFUL in 4s
48 actionable tasks: 2 executed, 46 up-to-date
```
## 修改的文件
```
.
├── config.xml
├── etc
│   └── sign
│       ├── debug-keys.jks
│       ├── debug-signing.properties
│       ├── release-keys.jks
│       └── release-signing.properties
├── ionic.config.json
├── package.json
├── scripts
│   ├── config-env.js
│   ├── envconfig-writer.js
│   ├── environment-reader.js
│   ├── hooks
│   │   ├── before_platform_add.js
│   │   └── move_android_keys.js
│   ├── plugins
│   │   └── replace_googlemaps_key.js
│   ├── proxy-set.js
│   └── webpack.config.js
├── src
│   └── environments
│       ├── environment.dev.ts
│       ├── environment.prod.ts
│       ├── environment.ts
│       └── environment.uat.ts
└── tsconfig.json
```