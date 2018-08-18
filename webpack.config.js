'use strict';

const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const packageJSON = require('./package.json');

const getBanner = () =>
  packageJSON.name + '\n' +
  packageJSON.homepage + '\n' +
  'Version: ' + packageJSON.version + ' -- ' + (new Date()).toISOString() + '\n' +
  'License: ' + packageJSON.license;

const scriptName = process.env.npm_lifecycle_event;
const ENV = scriptName.indexOf('dev') === 0 ? 'development' : 'production';
const isTest = scriptName.indexOf('test') >= 0 ? true : false;
console.log('***** webpack runs in ' + ENV + (isTest ? ' (test)' : '') + ' environment\n');

const devServerPort = 5005;
const devServerHost = 'localhost';
let configEnv;

if (ENV === 'development') {
  configEnv = {
    rules: [
      isTest ? ({
        enforce: 'pre',
        test: /\.js$/,
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'test'),
        use: [{
          loader: 'jshint-loader'
        }]
      }) : ({})
    ],

    devtool: 'inline-source-map',

    plugins: [],

    devServer: !isTest ? {
      historyApiFallback: {
        rewrites: [
          { from: /\/*\/*\.html$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.css$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/*\/*\.js$/, to: (context) => '/demo' + context.parsedUrl.pathname },
          { from: /\/ui-scroll-demo\.gif$/, to: '/demo/ui-scroll-demo.gif' },
          { from: /^\/$/, to: '/demo/index.html' }
        ]
      },
      proxy: {
        '/dist': {
          target: 'http://' + devServerHost + ':' + devServerPort,
          pathRewrite: { '^/dist': '' }
        }
      },
      inline: true,
      quiet: false,
      stats: {
        modules: false,
        errors: true,
        warnings: true
      },
      port: devServerPort,
      host: devServerHost,
      publicPath: '/'
    } : {},

    watch: true
  }
}

if (ENV === 'production') {
  configEnv = {
    rules: [],

    devtool: 'source-map',

    plugins: [
      new CleanWebpackPlugin('dist', {
        root: __dirname
      }),
      new webpack.optimize.UglifyJsPlugin({
        sourceMap: true,
        compress: {
          warnings: true,
        },
        output: {
          comments: false,
        },
        include: /\.min\.js$/
      }),
      new CopyWebpackPlugin([
        { from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.min.js' },
        { from: 'src/ui-scroll-jqlite.js', to: 'ui-scroll-jqlite.js' }
      ], { copyUnmodified: true }),
      new webpack.BannerPlugin(getBanner())
    ],

    devServer: {},

    watch: false
  }
}

function buildConfig(entryName, entryPath, library) {
  let entry = {}
  entry[entryName] = entryPath

  return {
    entry,
    output: {
      path: path.join(__dirname, 'dist'),
      filename: '[name].js',
      library: library,
      libraryTarget: 'umd'
    },

    cache: false,

    devtool: configEnv.devtool,

    module: {
      rules: [...configEnv.rules,
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader'
        },
        {
          enforce: 'pre',
          test: /\.js$/,
          exclude: /node_modules/,
          include: path.resolve(__dirname, 'src'),
          use: [{
            loader: 'jshint-loader'
          }]
        }
      ]
    },

    plugins: configEnv.plugins,

    devServer: configEnv.devServer,

    watch: configEnv.watch
  }
}

let configs = [
  buildConfig('ui-scroll', path.resolve(__dirname, 'src/ui-scroll.js'), 'uiScroll'),
  buildConfig('ui-scroll-grid', path.resolve(__dirname, 'src/ui-scroll-grid.js'), 'uiScrollGrid')
];

if (ENV === 'production') {
  configs = configs.concat([
    buildConfig('ui-scroll.min', path.resolve(__dirname, 'src/ui-scroll.js'), 'uiScroll'),
    buildConfig('ui-scroll-grid.min', path.resolve(__dirname, 'src/ui-scroll-grid.js'), 'uiScrollGrid')
  ])
}

module.exports = configs
