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
        { type: 'html' },          // Detailed HTML report (browsable)
        { type: 'text-summary' },  // Summary output in terminal
        { type: 'lcov' },          // Generates lcov report (for SonarQube/Coveralls)
        { type: 'json' },          // JSON report (for external tools)
        { type: 'cobertura' },     // Cobertura report (for Jenkins)
        { type: 'text' }           // Full detailed text report in the terminal
      ]
    },
    reporters: ['progress', 'kjhtml', 'coverage'], // Ensure coverage is included
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
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
    browsers: ['ChromeHeadlessCI'],
    singleRun: true,
    restartOnFileChange: true
  });
};
