const {writeFileSync} = require('fs');

const env = process.env;
const config = {};

config.PUBLIC_PATH = env.PUBLIC_PATH || '/ui/';
config.LUMEER_ENV = env.LUMEER_ENV;
config.I18N_FORMAT = env.I18N_FORMAT || 'xlf';
config.I18N_LOCALE = env.I18N_LOCALE || 'en';
config.I18N_PATH = env.I18N_PATH || `src/i18n/messages.${config.I18N_LOCALE}.${config.I18N_FORMAT}`;
config.BUILD_NUMBER = env.BUILD_NUMBER;
config.LUMEER_ENGINE = env.LUMEER_ENGINE;
config.SENTRY_DSN = env.SENTRY_DSN;
config.AUTH_CLIENT_ID = env.AUTH_CLIENT_ID;
config.AUTH_DOMAIN = env.AUTH_DOMAIN;
config.SESSION_TIMEOUT = env.SESSION_TIMEOUT;

writeFileSync('./src/environments/.env.json', JSON.stringify(config));

const buildSwitches = `--aot --base-href=${config.PUBLIC_PATH} ${
  config.LUMEER_ENV ? '--configuration=' + config.LUMEER_ENV : ''
} --i18n-file=${config.I18N_PATH} --i18n-format=${config.I18N_FORMAT} --i18n-locale=${config.I18N_LOCALE}`;

// keep only this single output here because it is consumed by 'ng build' command
console.log(buildSwitches);
