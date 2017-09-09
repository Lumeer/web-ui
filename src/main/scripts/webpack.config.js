'use strict';
const webpack = require('webpack'),
  path = require('path'),
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  LUMEER_ENV = process.env.LUMEER_ENV || 'production',
  LUMEER_ENGINE = process.env.LUMEER_ENGINE || 'lumeer-engine';

module.exports = {
  entry: {
    'vendor': './src/vendor',
    'app': './src/boot'
  },
  output: {
    path: __dirname + '/dist',
    filename: 'js/[name].bundle.js',
    publicPath: '/ui/'
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts?$/,
        loader: 'tslint-loader',
        exclude: /(node_modules|libs)/
      },
      {
        test: /\.js$/,
        include: /(angular2-drag-scroll)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.ts/,
        use: ['awesome-typescript-loader', 'angular2-template-loader'],
        exclude: /node_modules/
      },
      {
        test:/\.html$/,
        use: [ {
          loader: 'html-loader',
          options: {
            minimize: true,
            removeAttributeQuotes: false,
            caseSensitive: true,
            customAttrSurround: [ [/#/, /(?:)/], [/\*/, /(?:)/], [/\[?\(?/, /(?:)/] ],
            customAttrAssign: [ /\)?\]?=/ ]
          }
        }]
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.scss$/,
        loaders: ['raw-loader', 'resolve-url-loader', 'sass-loader']
      },
      {
        //IMAGE LOADER
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader:'file-loader'
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
      { test: /\.(ttf|eot|otf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
      {test: /\.json$/,  loader: 'json-loader'}
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      path.resolve(__dirname, '../src')
    ),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    }),
    new HtmlWebpackPlugin({
      favicon: 'img/favicon.ico',
      title: 'Lumeer tool',
      publicPath: '/ui/',
      template: 'src/template-index.ejs',
      inject: 'body'
    }),
    new CopyWebpackPlugin([
      {from: __dirname + '/img', to: 'img'},
      {from: __dirname + '/src/img', to: 'img'},
      {from: __dirname + '/data', to: 'data'}
    ]),
    new webpack.LoaderOptionsPlugin({
      options: {
        tslint: {
          emitErrors: true,
          failOnHint: false
        }
      }
    }),
    new webpack.optimize.CommonsChunkPlugin({name: 'vendor', filename: 'js/vendor.bundle.js'}),
    new webpack.DefinePlugin({
      LUMEER_ENV: JSON.stringify(LUMEER_ENV),
      API_URL: JSON.stringify(LUMEER_ENGINE)
    })
  ],
  externals: {
    'jquery': 'jQuery',
    'lodash': '_',
    'rxjs': 'Rx'
  },
  performance: { hints: false },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    port: 7000,
    proxy: {
      ['/' + LUMEER_ENGINE]: {
        target: 'http://127.0.0.1:8080/' + LUMEER_ENGINE,
        pathRewrite: {['^/' + LUMEER_ENGINE] : ''}
      }
    }
  }
};
