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
            require('karma-jasmine-html-reporter'),
            require('karma-coverage-istanbul-reporter'),
            require('@angular/cli/plugins/karma')
        ],
        client: {
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },
        coverageIstanbulReporter: {
            reports: ['html', 'lcovonly'],
            fixWebpackSourcePaths: true
        },
        angularCli: {
            environment: 'dev'
        },
        reporters: ['progress', 'kjhtml'],
        port: 9875,
        colors: true,
        logLevel: config.LOG_INFO,
        browserNoActivityTimeout: 300000,
        browserDisconnectTimeout: 5000,
        browserDisconnectTolerance: 2,
        parallelOptions: {
            executors: require('os').cpus().length,
            shardStrategy: 'round-robin'
        },
        autoWatch: true,
        browsers: ['PhantomJS'],
        singleRun: true
    });
};
