"use strict";
var file;
var format;
var gitBlameStats_1 = require('./gitBlameStats');
function run() {
    parseArguments();
    gitBlameStats_1["default"](file, function (err, stats) {
        if (err || !stats) {
            throw err;
        }
        if (format === 'json') {
            console.log(stats.committers);
        }
        else {
            var maxPercentage_1 = stats.committers.reduce(function (max, committer) { return Math.max(max, committer.percentage); }, 0);
            stats.committers.forEach(function (committer) {
                var percentage = "" + committer.percentage * 100;
                console.log('%s%s% %s', new Array(("" + maxPercentage_1 * 100).length - percentage.length + 1).join(' '), percentage, committer.email);
            });
            console.log();
            if (stats.pairedLines > 0) {
                console.log('%s lines, %s paired.', stats.totalLines, stats.pairedLines);
            }
            else {
                console.log('%s lines.', stats.totalLines);
            }
        }
    });
}
exports.__esModule = true;
exports["default"] = run;
function parseArguments() {
    var args = process.argv.slice(2);
    var arg;
    while ((arg = args.shift())) {
        if (arg === '-h' || arg === '--help') {
            usage(0);
        }
        else if (arg === '-f' || arg === '--format') {
            var next = args.shift();
            if (!next) {
                usage(1);
            }
            else {
                next = next.toLowerCase();
            }
            if (next !== 'json') {
                usage(1);
            }
            format = next;
        }
        else if (arg[0] === '-') {
            usage(1);
        }
        else if (!file) {
            file = arg;
        }
        else {
            usage(1);
        }
    }
    if (!file) {
        usage(1);
    }
}
function usage(code) {
    if (code === void 0) { code = null; }
    console.error('git owner [-f JSON] FILE');
    if (code !== null) {
        process.exit(code);
    }
}
