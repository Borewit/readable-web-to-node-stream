// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');
const webpack = require('webpack');

module.exports = config => {
  config.set({
    basePath: 'lib',
    frameworks: [
      'jasmine'
    ],
    files: [
      {pattern: '**/*.spec.ts'}
    ],
    preprocessors: {
      '**/*.ts': 'webpack'
    },

    webpack: {
      mode: 'development',
      resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
          process: 'process/browser'
        }
      },
      // Ensure buffer is available
      plugins: [
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        })
      ],
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: 'ts-loader'
          },
          {
            test: /\.ts$/,
            use: {loader: 'istanbul-instrumenter-loader'},
            enforce: 'post',
            exclude: /\.spec\.ts$/
          }

        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    },

    reporters: ['kjhtml', 'dots', 'coverage-istanbul'],
    // https://www.npmjs.com/package/karma-coverage-istanbul-reporter
    coverageIstanbulReporter: {
      dir: path.join(__dirname, 'coverage'),
      reports: ['text-summary', 'lcovonly'],
      fixWebpackSourcePaths: true,
      'report-config': {
        html: {
          // outputs the report in ./coverage/html
          subdir: 'html'
        }
      },
      combineBrowserReports: true // Combines coverage information from multiple browsers into one report
    },

    mocha: {
      timeout: 20000 // 20 seconds
    },

    browsers: ['Chrome'],
    colors: true
  });
};
