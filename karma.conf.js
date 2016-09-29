module.exports = function (config) {

  config.set({
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-typescript-preprocessor2',
      //'karma-sourcemap-loader',
      //'karma-remap-istanbul',
      //'karma-coverage'
    ],

    // base path, that will be used to resolve files and exclude
    basePath: '.',

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [
      { pattern: 'dist/glib.js', included: true, watched: true}, 
      { pattern: 'src/**/*.test.ts', included: true, watched: true },
      { pattern: 'src/**/*.spec.ts', included: true, watched: true },
      { pattern: 'src/**/*.d.ts', included: false, watched: false } 
    ],

    // list of files to exclude
    exclude: [

    ],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: [
      'dots',
      //'coverage',
      //'karma-remap-istanbul'
    ],
    // Do not include tests or libraries (these files will be instrumented by Istanbul)
    preprocessors: {
      'dist/glib.js': [
        //'sourcemap', 
        //'coverage'
      ]
    },

    typescriptPreprocessor: {
      compilerOptions: { 
        target: "es5",
        noResolve: true,
        outFile: "dist/glib.test.js",
        outDir: "dist",
        sourceMap: true,
        rootDir: "src",
      },
      // ignore all files that ends with .d.ts (this files will not be served) 
      ignorePath: function(path){ 
       return /\.d\.ts$/.test(path);
      },
      // transforming the filenames   
      transformPath: [function(path) { 
        return path.replace(/\.ts$/, '.js');
      }]
    },
    
    //coverageReporter: {
    //  type : 'json',
    //  dir : 'coverage/',
    //  file : 'coverage-final.json'
    //},
    //remapIstanbulReporter: {
    //    reports: {
    //      //lcovonly: 'coverage/lcov.info'
    //      //html: 'coverage/html'
    //      text: undefined
    //    }
    //},

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: [
      //'PhantomJS',
      //'Firefox',
      'Chrome'
    ],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false
  });
};
