const { ProvidePlugin, DefinePlugin } = require('webpack');
const { LUMEER_ENV, I18N_FORMAT, I18N_LOCALE, AOT, I18N_PATH, BUILD_NUMBER, LUMEER_ENGINE, PUBLIC_PATH, entryPoints} = require('./settings');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {AngularCompilerPlugin} = require('@ngtools/webpack');

const providePlugin = new ProvidePlugin(
  {
    $: 'jquery',
    jQuery: 'jquery'
  }
);

const definePlugin = new DefinePlugin(
  {
    LUMEER_ENV: JSON.stringify(LUMEER_ENV),
    API_URL: JSON.stringify(LUMEER_ENGINE),
    BUILD_NUMBER: JSON.stringify(BUILD_NUMBER),
    PUBLIC_PATH: JSON.stringify(PUBLIC_PATH),
    I18N_PATH: JSON.stringify(I18N_PATH),
    I18N_FORMAT: JSON.stringify(I18N_FORMAT)
  }
);

const copyWebpackPlugin = new CopyWebpackPlugin(
  [
    {from: __dirname + '/../img', to: 'img'},
    {from: __dirname + '/../src/assets/font-awesome', to: 'font-awesome'},
    {from: __dirname + '/../src/assets/webfonts', to: 'webfonts'}
  ]
);

const htmlWebpackPlugin = new HtmlWebpackPlugin(
  {
    "favicon": "img/favicon.ico",
    "title": "Lumeer - Easy Business Booster",
    "publicPath": PUBLIC_PATH,
    "inject": "body",
    "template": "./src/index.ejs",
    "hash": false,
    "compile": true,
    "minify": false,
    "cache": true,
    "showErrors": true,
    "chunks": "all",
    "excludeChunks": [],
    "xhtml": true,
    "chunksSortMode": function sort(left, right) {
      let leftIndex = entryPoints.indexOf(left.names[0]);
      let rightindex = entryPoints.indexOf(right.names[0]);
      if (leftIndex > rightindex) {
        return 1;
      }
      else if (leftIndex < rightindex) {
        return -1;
      }
      else {
        return 0;
      }
    }
  }
);

const angularCompilerPlugin = new AngularCompilerPlugin(
  {
    "sourceMap": true,
    "mainPath": "main.ts",
    "i18nInFile": I18N_PATH,
    "i18nInFormat": I18N_FORMAT,
    "locale": I18N_LOCALE,
    "platform": 0,
    "missingTranslation": "warning",
    "hostReplacementPaths": {
      "environments/environment.ts": "environments/environment.ts"
    },
    "exclude": [],
    "tsConfigPath": "src/tsconfig.app.json",
    "compilerOptions": {},
    "skipCodeGeneration": !AOT
  }
);

module.exports = {
  providePlugin,
  definePlugin,
  copyWebpackPlugin,
  htmlWebpackPlugin,
  angularCompilerPlugin
};
