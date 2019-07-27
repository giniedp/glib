'use strict';

const path = require("path")
const IS_COVERAGE = !!process.env.IS_COVERAGE;
const IS_TRAVIS = !!process.env.TRAVIS;
const BROWSER = process.env.BROWSER;

module.exports = function (config) {

  config.set({
    basePath: './packages',
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-mocha-reporter',
      'karma-typescript',
    ],
    logLevel: 'info',
    browserConsoleLogOptions: {
      level: 'info',
    },
    frameworks: [
      'jasmine',
      'karma-typescript',
    ],
    browsers: [
      BROWSER || 'Chrome'
    ],
    browserDisconnectTimeout: 60 * 60 * 1000,
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [ '--remote-debugging-port=9222' ]
      }
    },

    proxies: {
      '/assets': path.join(__dirname, 'assets'),
    },
    files: [{
      pattern: '**/*.ts',
      watched: true,
      served: true,
      included: true,
    }, {
      pattern: '../assets/**/*',
      watched: true,
      served: true,
      included: false,
    }],
    exclude: [],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    reporters: [
      'progress',
      'mocha',
      'karma-typescript',
    ],
    mochaReporter: {
      output: 'minimal'
    },

    karmaTypescriptConfig: {
      bundlerOptions: {
        entrypoints: /(\.spec\.ts)$/,
        sourceMap: true,
        validateSyntax: false,
      },
      exclude: ['node_modules', 'release'],
      // compilerOptions: tsconfig.compilerOptions,
      tsconfig: 'tsconfig.cjs.json',
      // Pass options to remap-istanbul.
      remapOptions: {
        // a regex for excluding files from remapping
        // exclude: '',
        // a function for handling error messages
        warn: (msg) => console.log(msg)
      },
      converageOptions: {
        instrumentation: IS_COVERAGE,
        exclude: /\.(d|spec|test)\.ts/i,
      },
      reports: {
        'text-summary': '',
        html: {
          directory: 'coverage',
          subdirectory: 'html',
        },
        lcovonly: {
          directory: 'coverage',
          subdirectory: 'lcov',
          filename: 'lcov.info',
        },

      },
    },
  });
};
