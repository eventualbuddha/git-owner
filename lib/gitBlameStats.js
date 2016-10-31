"use strict";
var child_process_1 = require('child_process');
/**
 * Generates statistics about the committers for a given file.
 */
function gitBlameStats(file, callback, _spawn) {
    if (_spawn === void 0) { _spawn = child_process_1.spawn; }
    var blame = _spawn('git', ['blame', '-C', '-w', file, '--line-porcelain']);
    var data = '';
    var stderr = '';
    blame.stdout.on('data', function (chunk) { return data += chunk; });
    blame.stderr.on('data', function (chunk) { return stderr += chunk; });
    blame.on('close', function (code) {
        if (code !== 0) {
            callback(new Error(stderr), null);
        }
        var committers = [];
        var committersByEmail = {};
        var totalLines = 0;
        var pairedLines = 0;
        data.split('\n').forEach(function (line) {
            var emails = committerEmailsFromLine(line);
            if (emails) {
                totalLines++;
                if (emails.length > 1) {
                    pairedLines++;
                }
                emails.forEach(function (email) {
                    var committer = committersByEmail[email];
                    if (!committer) {
                        committers.push(committersByEmail[email] = committer = {
                            email: email,
                            lines: 0,
                            percentage: 0
                        });
                    }
                    committer.lines++;
                });
            }
        });
        committers.forEach(function (committer) {
            committer.percentage = committer.lines / totalLines;
        });
        callback(null, {
            committers: committers,
            totalLines: totalLines,
            pairedLines: pairedLines
        });
    });
}
exports.__esModule = true;
exports["default"] = gitBlameStats;
var COMMITTER_MAIL = 'committer-mail';
/**
 * Gets the email addresses associated with this particular git-blame line.
 */
function committerEmailsFromLine(line) {
    if (line.indexOf(COMMITTER_MAIL + ' ') < 0) {
        return null;
    }
    var email = line.slice(COMMITTER_MAIL.length + 2, -1);
    var match = email.match(/^git(?:hub)?\+(.+)(@.+)$/);
    if (match) {
        var usernames = match[1];
        var athostname_1 = match[2];
        return usernames.split('+').map(function (username) { return username + athostname_1; });
    }
    else {
        return [email];
    }
}
