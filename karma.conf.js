'use strict';

const webpackConfig = require('./webpack.config');
const IS_COVERAGE = !!process.env.IS_COVERAGE;

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
      'Chrome'
    ],
    frameworks: [
      'jasmine'
    ],
    files: [
      'framework/tests.js'
    ],
    exclude: [],
    preprocessors: {
      ['framework/tests.js']: [
        IS_COVERAGE ? 'coverage' : null,
        'webpack',
        'sourcemap'
      ].filter((it) => it),
    },
    reporters: [
      'mocha',
      IS_COVERAGE ? 'coverage' : null,
      IS_COVERAGE ? 'remap-coverage' : null,
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
      output: 'minimal' // 'full'
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    concurrency: 1
  });
};
