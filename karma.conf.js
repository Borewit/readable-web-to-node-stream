// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');

module.exports = config => {
  config.set({
    basePath: '.',
    frameworks: [
      'jasmine'
    ],
    files: [
      {pattern: 'lib/**/*.spec.ts'}
    ],
    preprocessors: {
      '**/*.ts': 'webpack',
    },

    webpack: {
      mode: 'development',
      entry: './lib/index.ts',
      resolve: {
        extensions: ['.tsx', '.ts', '.js']
      },
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader',
            include: path.resolve('lib')
          },
          {
            test: /\.ts$/,
            use: {loader: 'istanbul-instrumenter-loader'},
            enforce: 'post',
            include: path.resolve('lib'),
            exclude: /\.spec\.ts$/
          }

        ]
      },
    },
    webpackMiddleware: {
      noInfo: true
    },

    reporters: ['progress', 'kjhtml', 'coverage-istanbul', 'spec'],
    // https://www.npmjs.com/package/karma-coverage-istanbul-reporter
    coverageIstanbulReporter: {
      dir: path.join(__dirname, 'coverage'),
      reports: ['text-summary', 'lcovonly', 'html'],
      fixWebpackSourcePaths: true,
      'report-config': {
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }
      },
      combineBrowserReports: true // Combines coverage information from multiple browsers into one report
    },

    // global BrowserStack configuration
    browserStack: {
      forcelocal: true,  // force traffic through the local BrowserStack tunnel, passes flag through to BrowserStackTunnel
      project: 'readable-web-to-node-stream'
    },

    // define browsers
    customLaunchers: {
      bs_win_chrome: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Chrome'
      },
      bs_win_firefox: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Firefox'
      },
      bs_osx_safari: {
        base: 'BrowserStack',
        os: 'OS X',
        os_version: 'Mojave',
        browser: 'Safari'
      },
      bs_win_edge: {
        base: 'BrowserStack',
        os: 'Windows',
        os_version: '10',
        browser: 'Edge'
      }
    },

    //autoWatch: true,
    browsers: ['Chrome', 'Safari', 'Firefox'],
    colors: true,
    singleRun: false,

    browserNoActivityTimeout: 20000,
    browserDisconnectTimeout: 30000,
    browserDisconnectTolerance: 1,
  });
};
