'use strict';

const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
let isCoverage = false;

webpackConfig.devtool = undefined;
webpackConfig.entry = null;
webpackConfig.plugins = [
  // fixes sourcemaps / line number matching in tests
  // https://github.com/webpack-contrib/karma-webpack/issues/109#issuecomment-224961264
  // when using awesome-typescript-loader, do not enable inlineSourcemaps there nor in tsconfig
  new webpack.SourceMapDevToolPlugin({
    filename: null,          // if no value is provided the sourcemap is inlined
    test: /\.(ts|js)($|\?)/i // process .js and .ts files only
  })
];
webpackConfig.output = {};

module.exports = function (config) {

  config.set({
    basePath: '.',
    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-webpack',
      'karma-mocha-reporter',
      'karma-sourcemap-loader',
      'karma-coverage',
      'karma-remap-coverage',
    ],
    browsers: [
      // 'PhantomJS',
      'Chrome'
    ],
    frameworks: ['jasmine'],
    files: [
      './framework/tests.js'
    ],
    exclude: [],
    preprocessors: {
      'framework/tests.js': [
        isCoverage ? 'coverage' : null,
        'webpack',
        'sourcemap'
      ].filter((it) => it),
    },
    reporters: [
      'mocha',
      isCoverage ? 'coverage' : null,
      isCoverage ? 'remap-coverage' : null,
    ].filter((it) => it),

    webpack: webpackConfig,
    webpackServer: {
      noInfo: true, // prevent console spamming when running in Karma!
    },
    webpackMiddleware: {
      stats: 'errors-only',
    },

    coverageReporter: {
      type: 'in-memory'
    },
    remapCoverageReporter: {
      'text-summary': null,
      html: 'coverage',
    },

    mochaReporter: {
      output: 'full'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
    concurrency: 1
  });
};
