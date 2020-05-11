const {writeFileSync} = require('fs');

const env = process.env;
const config = {};

config.AUTH_CLIENT_ID = env.AUTH_CLIENT_ID;
config.AUTH_DOMAIN = env.AUTH_DOMAIN;
config.BLOCKLY_CDN = env.BLOCKLY_CDN;
config.BUILD_NUMBER = env.BUILD_NUMBER;
config.I18N_FORMAT = env.I18N_FORMAT || 'xlf';
config.I18N_LOCALE = env.I18N_LOCALE || 'en';
config.I18N_PATH = env.I18N_PATH || `src/i18n/messages.${config.I18N_LOCALE}.${config.I18N_FORMAT}`;
config.LOGZIO_KEY = env.LOGZIO_KEY;
config.LUMEER_ENGINE = env.LUMEER_ENGINE;
config.LUMEER_ENV = env.LUMEER_ENV;
config.MAPBOX_KEY = env.MAPBOX_KEY;
config.MAPQUEST_KEY = env.MAPQUEST_KEY;
config.MAPTILER_KEY = env.MAPTILER_KEY;
config.MAX_FILE_UPLOAD_SIZE = env.MAX_FILE_UPLOAD_SIZE;
config.MIXPANEL_KEY = env.MIXPANEL_KEY;
config.PRESIGNED_URL_TIMEOUT = env.PRESIGNED_URL_TIMEOUT;
config.PUBLIC_PATH = (env.PUBLIC_PATH && env.PUBLIC_PATH.replace(/\/+/, '/')) || '/ui/';
config.PUSHER_CLUSTER = env.PUSHER_CLUSTER;
config.PUSHER_KEY = env.PUSHER_KEY;
config.SENTRY_DSN = env.SENTRY_DSN;
config.SESSION_TIMEOUT = env.SESSION_TIMEOUT;
config.SMARTLOOK_KEY = env.SMARTLOOK_KEY;

writeFileSync('./src/environments/.env.json', JSON.stringify(config));

const buildSwitches = `--base-href=${config.PUBLIC_PATH}
    ${config.LUMEER_ENV ? '--configuration=' + config.LUMEER_ENV : ''}
    ${config.LUMEER_ENV === 'production' || config.LUMEER_ENV === 'staging' ? '--localize' : ''}`;

// keep only this single output here because it is consumed by 'ng build' command
console.log(buildSwitches);
