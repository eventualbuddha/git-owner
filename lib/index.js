/* jshint node:true, undef:true */

/**
 * @type {{committers: Array.<CommitterStats>, totalLines: number, pairedLines: number}}
 */
var BlameStats;

/**
 * Generates statistics about the committers for a given file.
 *
 * @param {string} file
 * @param {function(?Error, ?BlameStats)} callback
 */
function gitBlameStats(file, callback) {
  /* jshint unused:true */
  var cp = require('child_process');
  var blame = cp.spawn('git', ['blame', '-C', file, '--line-porcelain']);
  var data = '';
  var stderr = '';

  blame.stdout.on('data', function(chunk) { data += chunk; });
  blame.stderr.on('data', function(chunk) { stderr += chunk; });

  blame.on('close', function(code) {
    if (code !== 0) {
      callback(new Error(stderr));
    }

    var committers = [];
    var committersByEmail = {};
    var totalLines = 0;
    var pairedLines = 0;

    data.split('\n').forEach(function(line) {
      var emails = committerEmailsFromLine(line);
      if (emails) {
        totalLines++;
        if (emails.length > 1) {
          pairedLines++;
        }

        emails.forEach(function(email) {
          var committer = committersByEmail[email];
          if (!committer) {
            committers.push(
              committersByEmail[email] = committer = {email: email, lines: 0}
            );
          }
          committer.lines++;
        });
      }
    });

    callback(null, {
      committers: committers,
      totalLines: totalLines,
      pairedLines: pairedLines
    });
  });
}
exports.gitBlameStats = gitBlameStats;

var COMMITTER_MAIL = 'committer-mail';

/**
 * Gets the email addresses associated with this particular git-blame line.
 *
 * @private
 * @param {string} line
 * @return {Array.<string>}
 */
function committerEmailsFromLine(line) {
  /* jshint unused:true */
  if (line.indexOf(COMMITTER_MAIL + ' ') === 0) {
    var email = line.slice(COMMITTER_MAIL.length + 2, -1);
    var match = email.match(/^git(?:hub)?\+(.+)(@.+)$/);

    if (match) {
      var usernames = match[1];
      var athostname = match[2];
      return usernames.split('+').map(function(username) {
        return username + athostname;
      });
    } else {
      return [email];
    }
  }
}
