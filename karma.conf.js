// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
    config.set({
        basePath: '',
        frameworks: ['parallel', 'jasmine', '@angular/cli'],
        plugins: [
            require('karma-parallel'),
            require('karma-jasmine'),
            require('karma-phantomjs-launcher'),
            require('karma-coverage-istanbul-reporter'),
            require('karma-spec-reporter'),
            require('@angular/cli/plugins/karma')
        ],
        client: {
            clearContext: false, // leave Jasmine Spec Runner output visible in browser
            captureConsole: true
        },
        loggers: [
            { type: 'console' }
        ],
        coverageIstanbulReporter: {
            reports: ['html', 'lcovonly'],
            fixWebpackSourcePaths: true
        },
        angularCli: {
            environment: 'dev'
        },
        reporters: ['spec'],
        specReporter: {
            // limit number of lines logged per test
            maxLogLines: 5,
            suppressErrorSummary: false,
            suppressFailed: false,
            suppressPassed: false,
            suppressSkipped: false,
            showSpecTiming: true,
            failFast: false
        },
        port: 9875,
        colors: true,
        logLevel: config.LOG_INFO,
        browserNoActivityTimeout: 300000,
        browserDisconnectTimeout: 5000,
        browserDisconnectTolerance: 2,
        parallelOptions: {
            executors: require('os').cpus().length - 1,
            shardStrategy: 'round-robin'
        },
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true
    });
};
