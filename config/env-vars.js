const { writeFileSync } = require('fs');

const envVariables = process.env;
const configFile = './src/environments/.env.json';

const config ={};

config.AOT = envVariables.AOT || false;
config.LUMEER_ENGINE = envVariables.LUMEER_ENGINE || 'lumeer-engine';
config.LUMEER_TITLE = 'Lumeer tool';
config.OUTPUT_PATH = envVariables.OUTPUT_PATH || 'dist';
config.I18N_FORMAT = envVariables.I18N_FORMAT || 'xlf';
config.I18N_LOCALE = envVariables.I18N_LOCALE || 'en';
config.I18N_PATH = envVariables.I18N_PATH || `src/i18n/messages.${config.I18N_LOCALE}.${config.I18N_FORMAT}`;
config.BUILD_NUMBER = envVariables.BUILD_NUMBER || '1';
config.PUBLIC_PATH = envVariables.PUBLIC_PATH || '/ui/';
config.API_URL = envVariables.API_URL || 'engine';
config.LOCAL_LUMEER = envVariables.LOCAL_LUMEER || 'http://127.0.0.1:8080/';

const defaultSwitches = `--output-path=${config.OUTPUT_PATH} --base-href=${config.PUBLIC_PATH}`;
const advancedSwitches = `--i18nFormat=${config.I18N_FORMAT} --locale=${config.I18N_LOCALE} --i18nFile=${config.I18N_PATH} --aot=${config.AOT}`;

const LUMEER_SWITCHES = `LUMEER_SWITCHES='${defaultSwitches + (config.AOT ? " " + advancedSwitches : "")}'`;

writeFileSync(configFile, JSON.stringify(config));

console.log(`${defaultSwitches + (config.AOT ? " " + advancedSwitches : "")}`);
