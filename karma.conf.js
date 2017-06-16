'use strict';

const webpackConfig = require('./webpack.config');
const IS_COVERALLS = !!process.env.IS_COVERALLS;
const IS_COVERAGE = IS_COVERALLS || !!process.env.IS_COVERAGE;
const IS_TRAVIS = !!process.env.TRAVIS;

module.exports = function (config) {

  config.set({
    basePath: '.',
    plugins: [
      'karma-webpack',

      'karma-jasmine',
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',

      'karma-sourcemap-loader',
      'karma-mocha-reporter',

      'karma-coveralls',
      'karma-coverage',
      'karma-remap-coverage',
    ],
    browsers: [
      IS_TRAVIS ? 'Firefox' : 'Chrome'
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
      IS_COVERALLS ? 'coveralls' : null,
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
      dir: 'coverage',
      reporters: [{
        type: 'lcov'
      }, {
        type: 'in-memory'
      }]
    },
    remapCoverageReporter: {
      'text-summary': null,
      html: './coverage/report-html',
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
