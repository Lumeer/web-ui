const LUMEER_ENV = process.env.LUMEER_ENV || 'production';
const LUMEER_ENGINE = process.env.LUMEER_ENGINE || 'lumeer-engine';
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'dist/';
const I18N_FORMAT = process.env.I18N_FORMAT || 'xlf';
const I18N_LOCALE = process.env.I18N_LOCALE;
const AOT = process.env.AOT || false;
const I18N_PATH = process.env.I18N_PATH || `src/i18n/messages.${I18N_LOCALE}.${I18N_FORMAT}`;
const BUILD_NUMBER = process.env.BUILD_NUMBER;
const LOCAL_LUMEER = 'http://127.0.0.1:8080/';
const PUBLIC_PATH = '/ui/';
const path = require('path');

const entryPoints = ["inline","polyfills","sw-register","styles","vendor","main"];
if (AOT) {
  console.log('Using AOT with: ');
  console.log('* locale:', I18N_LOCALE);
  console.log('* path:', I18N_PATH);
} else {
  console.log('using JIT');
}

const output = {
  "path": path.join(process.cwd(), OUTPUT_PATH), // Custom path
  "filename": "[name].bundle.js",
  "chunkFilename": "[id].chunk.js",
  "crossOriginLoading": false,
  "publicPath": PUBLIC_PATH // Custom public path
};

const externals = {
  'jquery': 'jQuery',
  'rxjs': 'Rx',
  'window.QuillEditor': 'quill',
  'QuillEditor': 'quill',
  'Quill': 'quill'
};

module.exports = {
  LUMEER_ENV,
  LUMEER_ENGINE,
  OUTPUT_PATH,
  I18N_FORMAT,
  I18N_LOCALE,
  AOT,
  I18N_PATH,
  BUILD_NUMBER,
  LOCAL_LUMEER,
  PUBLIC_PATH,
  entryPoints,
  output,
  externals
};
