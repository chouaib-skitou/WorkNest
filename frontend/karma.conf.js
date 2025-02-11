// karma.conf.js - Karma configuration file, see https://angular.io/guide/testing
module.exports = function (config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', '@angular-devkit/build-angular'],
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage'),
        require('@angular-devkit/build-angular/plugins/karma')
      ],
      client: {
        jasmine: {},
        clearContext: false // leave Jasmine Spec Runner output visible in browser
      },
      jasmineHtmlReporter: {
        suppressAll: true // removes duplicated traces
      },
      coverageReporter: {
        dir: require('path').join(__dirname, './coverage/frontend'),
        subdir: '.',
        reporters: [
          { type: 'html' },
          { type: 'text-summary' }
        ]
      },
      reporters: ['progress', 'kjhtml'],
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: false,
      // Define a custom launcher for CI environments
      customLaunchers: {
        ChromeHeadlessCI: {
          base: 'ChromeHeadless',
          flags: [
            '--no-sandbox',
            '--disable-gpu',
            '--disable-translate',
            '--disable-extensions'
          ]
        }
      },
      // Use the custom launcher for CI environments
      browsers: ['ChromeHeadlessCI'],
      singleRun: true,
      restartOnFileChange: true
    });
  };
  