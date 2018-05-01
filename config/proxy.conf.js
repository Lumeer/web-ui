const {API_URL, LUMEER_ENGINE, LOCAL_LUMEER} = require('../src/environments/.env.json');

const PROXY_CONFIG = {
  ['/' + API_URL]: {
    target: LOCAL_LUMEER + LUMEER_ENGINE,
    pathRewrite: {['^/' + API_URL]: ''}
  }
};

module.exports = PROXY_CONFIG;
