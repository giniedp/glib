
const path = require('path')

// const IS_TRAVIS = !!process.env.TRAVIS
const IS_COVERAGE = !!process.env.IS_COVERAGE
const BROWSER = process.env.BROWSER

const projectDir = path.join(__dirname, '..', '..')
const assetsDir = path.join(projectDir, 'assets')

module.exports = (config) => {
  config.set({
    basePath: __dirname,
    plugins: [
      'karma-chrome-launcher',
      'karma-coverage-istanbul-reporter',
      'karma-firefox-launcher',
      'karma-jasmine',
      'karma-mocha-reporter',
      'karma-sourcemap-loader',
    ],
    logLevel: 'info',
    browserConsoleLogOptions: {
      level: 'info',
    },
    frameworks: ['jasmine'],
    browsers: [BROWSER || 'ChromeHeadless'],
    browserDisconnectTimeout: 60 * 60 * 1000,
    customLaunchers: {
      ChromeDebugging: {
        base: 'Chrome',
        flags: ['--remote-debugging-port=9222'],
      },
      Canary: {
        base: 'ChromeCanary',
        flags: ['--enable-unsafe-webgpu=true'],
      },
    },

    proxies: {
      '/assets': assetsDir,
    },
    files: [
      {
        pattern: 'test/index.spec.js',
        watched: true,
        served: true,
        included: true,
      },
      {
        pattern: path.join(assetsDir, '**', '*'),
        watched: true,
        served: true,
        included: false,
      },
    ],
    preprocessors: {
      '**/*.js': ['sourcemap'],
    },
    reporters: [
      'progress',
      'mocha',
      IS_COVERAGE ? 'coverage-istanbul' : null,
    ].filter((it) => it != null),
    mochaReporter: {
      output: 'minimal',
    },
    coverageIstanbulReporter: {
      includeAllSources: true,
      reports: ['html', 'lcovonly', 'text-summary'],
      dir: path.join(projectDir, 'coverage'),
      combineBrowserReports: true,
    },
  })
}
