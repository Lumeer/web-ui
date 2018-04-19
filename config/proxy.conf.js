const { LUMEER_ENGINE, LOCAL_LUMEER } = require('../src/environments/.env.json');

const PROXY_CONFIG = {
  ['/' + LUMEER_ENGINE]: {
    target: LOCAL_LUMEER + LUMEER_ENGINE,
    pathRewrite: {['^/' + LUMEER_ENGINE]: ''}
  }
};

module.exports = PROXY_CONFIG;
