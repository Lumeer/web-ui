const { LUMEER_ENGINE, OUTPUT_PATH, LOCAL_LUMEER } = require('./settings');
const path = require('path');

module.exports = {
  lumeerDevServer: {
    contentBase: path.join(__dirname, '/../' + OUTPUT_PATH),
    historyApiFallback: true,
    port: 7000,
    proxy: {
      ['/' + LUMEER_ENGINE]: {
        target: LOCAL_LUMEER + LUMEER_ENGINE,
        pathRewrite: {['^/' + LUMEER_ENGINE]: ''}
      }
    }
  }
};
