"use strict";
const webpack = require("webpack"),
  path = require("path"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin");
const { AotPlugin } = require('@ngtools/webpack');
module.exports = {
  entry: {
    "vendor": "./src/vendor",
    "app": "./src/boot"
  },
  output: {
    path: __dirname + '/dist',
    filename: "js/[name].bundle.js",
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
        loaders: ['ts-loader'],
        exclude: /node_modules/
      },
      {test:/\.html$/, loader:'html-loader' },
      {
        test: /\.scss$/,
        loaders: ["style-loader", "css-loader", "sass-loader"]
      },
      {
        //IMAGE LOADER
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader:'file-loader'
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&minetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
      {test: /\.json$/,  loader: 'json-loader'}
    ]
  },
  plugins: [
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
    new HtmlWebpackPlugin({
      filename: 'demo.html',
      template: 'src/template-demo.ejs',
      inject: 'head'
    }),
    new CopyWebpackPlugin([
      {from: __dirname + '/img', to: 'img'},
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
    new webpack.optimize.CommonsChunkPlugin({name: "vendor", filename: "js/vendor.bundle.js"}),
    new AotPlugin({
      "mainPath": "boot.ts",
      "tsConfigPath": "src/tsconfig.app.json",
      "skipCodeGeneration": true
    })
  ],
  externals: {
    'jquery': 'jQuery',
    'lodash': '_',
    'rxjs': 'Rx'
  },
  performance: { hints: false },
  devServer: {
    contentBase: path.join(__dirname, "dist"),
    historyApiFallback: true,
    port: 7000
  }
};
