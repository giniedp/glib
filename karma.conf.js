'use strict';

const IS_COVERAGE = !!process.env.IS_COVERAGE;
const IS_TRAVIS = !!process.env.TRAVIS;

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
    frameworks: [
      'jasmine',
      'karma-typescript',
    ],
    browsers: [
      IS_TRAVIS ? 'Firefox' : 'ChromeDebugging'
    ],
    browserDisconnectTimeout: 60 * 60 * 1000,
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: [ '--remote-debugging-port=9222' ]
      }
    },
    files: [
      '**/*.ts'
    ],
    exclude: [],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    reporters: [
      'mocha',
      'karma-typescript',
    ],

    karmaTypescriptConfig: {
      bundlerOptions: {
        entrypoints: /(\.spec\.ts)$/,
        sourceMap: true,
        validateSyntax: false,
      },
      exclude: ['node_modules', 'release'],
      // compilerOptions: tsconfig.compilerOptions,
      tsconfig: 'tsconfig.json',
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
        },
      },
    },
  });
};
