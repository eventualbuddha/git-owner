'use strict';

var mockSpawn = require('mock-spawn');
mockSpawn = 'default' in mockSpawn ? mockSpawn['default'] : mockSpawn;
var assert = require('assert');
var child_process = require('child_process');

var babelHelpers_typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};


require('source-map-support').install();
/**
 * Generates statistics about the committers for a given file.
 */

function gitBlameStats(file, callback) {
  var _spawn = arguments.length <= 2 || arguments[2] === undefined ? child_process.spawn : arguments[2];

  if (!(typeof file === 'string')) {
    throw new TypeError('Value of argument "file" violates contract.\n\nExpected:\nstring\n\nGot:\n' + _inspect(file));
  }

  if (!(typeof callback === 'function')) {
    throw new TypeError('Value of argument "callback" violates contract.\n\nExpected:\n(?Error, ?BlameStats) => void\n\nGot:\n' + _inspect(callback));
  }

  var blame = _spawn('git', ['blame', '-C', file, '--line-porcelain']);
  var data = '';
  var stderr = '';

  blame.stdout.on('data', function (chunk) {
    return data += chunk;
  });
  blame.stderr.on('data', function (chunk) {
    return stderr += chunk;
  });

  blame.on('close', function (code) {
    if (code !== 0) {
      callback(new Error(stderr));
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
            committers.push(committersByEmail[email] = committer = { email: email, lines: 0 });
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

var COMMITTER_MAIL = 'committer-mail';

/**
 * Gets the email addresses associated with this particular git-blame line.
 */
function committerEmailsFromLine(line) {
  function _ref(_id) {
    if (!(Array.isArray(_id) && _id.every(function (item) {
      return typeof item === 'string';
    }))) {
      throw new TypeError('Function "committerEmailsFromLine" return value violates contract.\n\nExpected:\nArray<string>\n\nGot:\n' + _inspect(_id));
    }

    return _id;
  }

  if (!(typeof line === 'string')) {
    throw new TypeError('Value of argument "line" violates contract.\n\nExpected:\nstring\n\nGot:\n' + _inspect(line));
  }

  if (line.indexOf(COMMITTER_MAIL + ' ') === 0) {
    var _email = line.slice(COMMITTER_MAIL.length + 2, -1);
    var match = _email.match(/^git(?:hub)?\+(.+)(@.+)$/);

    if (match) {
      var _ret = function () {
        var usernames = match[1];
        var athostname = match[2];
        return {
          v: _ref(usernames.split('+').map(function (username) {
            return username + athostname;
          }))
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : babelHelpers_typeof(_ret)) === "object") return _ret.v;
    } else {
      return _ref([_email]);
    }
  }
}

function _inspect(input) {
  if (input === null) {
    return 'null';
  } else if (input === undefined) {
    return 'void';
  } else if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return typeof input === 'undefined' ? 'undefined' : babelHelpers_typeof(input);
  } else if (Array.isArray(input)) {
    if (input.length > 0) {
      var first = _inspect(input[0]);

      if (input.every(function (item) {
        return _inspect(item) === first;
      })) {
        return first.trim() + '[]';
      } else {
        return '[' + input.map(_inspect).join(', ') + ']';
      }
    } else {
      return 'Array';
    }
  } else {
    var keys = Object.keys(input);

    if (!keys.length) {
      if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
        return input.constructor.name;
      } else {
        return 'Object';
      }
    }

    var entries = keys.map(function (key) {
      return (/^([A-Z_$][A-Z0-9_$]*)$/i.test(key) ? key : JSON.stringify(key)) + ': ' + _inspect(input[key]) + ';';
    }).join('\n  ');

    if (input.constructor && input.constructor.name && input.constructor.name !== 'Object') {
      return input.constructor.name + ' {\n  ' + entries + '\n}';
    } else {
      return '{ ' + entries + '\n}';
    }
  }
}

describe('gitBlameStats', function () {
  it('calls `git` on the command line with appropriate arguments', function (done) {
    var spawn = mockSpawn();
    spawn.setStrategy(function (command, args) {
      assert.strictEqual(command, 'git');
      assert.deepEqual(args, ['blame', '-C', 'FILE.txt', '--line-porcelain']);
      return spawn.simple(0);
    });
    gitBlameStats('FILE.txt', function (err, stats) {
      return done(err);
    }, spawn);
  });

  it('reads the committer-mail lines from stdout', function (done) {
    var spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <dave@example.com>', ''));
    gitBlameStats('FILE.txt', function (err, stats) {
      assert.strictEqual(err, null);
      assert.deepEqual(stats, {
        committers: [{ email: 'dave@example.com', lines: 1 }],
        totalLines: 1,
        pairedLines: 0
      });
      done(err);
    }, spawn);
  });

  it('aggregates multiple lines by the same author', function (done) {
    var spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <dave@example.com>\ncommitter-mail <dave@example.com>', ''));
    gitBlameStats('FILE.txt', function (err, stats) {
      assert.strictEqual(err, null);
      assert.deepEqual(stats, {
        committers: [{ email: 'dave@example.com', lines: 2 }],
        totalLines: 2,
        pairedLines: 0
      });
      done(err);
    }, spawn);
  });

  it('handles `git+` style pairs from committer-mail lines', function (done) {
    var spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <git+alice+bob@example.com>', ''));
    gitBlameStats('FILE.txt', function (err, stats) {
      assert.strictEqual(err, null);
      assert.deepEqual(stats, {
        committers: [{ email: 'alice@example.com', lines: 1 }, { email: 'bob@example.com', lines: 1 }],
        totalLines: 1,
        pairedLines: 1
      });
      done(err);
    }, spawn);
  });

  it('handles `github+` style pairs from committer-mail lines', function (done) {
    var spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <github+alice+bob@example.com>', ''));
    gitBlameStats('FILE.txt', function (err, stats) {
      assert.strictEqual(err, null);
      assert.deepEqual(stats, {
        committers: [{ email: 'alice@example.com', lines: 1 }, { email: 'bob@example.com', lines: 1 }],
        totalLines: 1,
        pairedLines: 1
      });
      done(err);
    }, spawn);
  });

  it('calls back with an error if `git-blame` fails', function (done) {
    var spawn = mockSpawn();
    spawn.setDefault(spawn.simple(1, '', 'OMG BBQ'));
    gitBlameStats('FILE.txt', function (err, stats) {
      assert.strictEqual(stats);
      assert.strictEqual(err.message, 'OMG BBQ');
      done();
    }, spawn);
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1idW5kbGUuanMiLCJzb3VyY2VzIjpbIi4uL2xpYi9naXRCbGFtZVN0YXRzLmpzIiwiLi4vdGVzdC90ZXN0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNwYXduIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmV4cG9ydCB0eXBlIEJsYW1lU3RhdHMgPSB7XG4gIGNvbW1pdHRlcnM6IEFycmF5PENvbW1pdHRlclN0YXRzPixcbiAgdG90YWxMaW5lczogbnVtYmVyLFxuICBwYWlyZWRMaW5lczogbnVtYmVyXG59O1xuXG50eXBlIENvbW1pdHRlclN0YXRzID0ge1xuICBlbWFpbDogc3RyaW5nLFxuICBsaW5lczogbnVtYmVyXG59O1xuXG4vKipcbiAqIEdlbmVyYXRlcyBzdGF0aXN0aWNzIGFib3V0IHRoZSBjb21taXR0ZXJzIGZvciBhIGdpdmVuIGZpbGUuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGdpdEJsYW1lU3RhdHMoZmlsZTogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiA/RXJyb3IsIHN0YXRzOiA/QmxhbWVTdGF0cykgPT4gdm9pZCwgX3NwYXduPXNwYXduKSB7XG4gIGNvbnN0IGJsYW1lID0gX3NwYXduKCdnaXQnLCBbJ2JsYW1lJywgJy1DJywgZmlsZSwgJy0tbGluZS1wb3JjZWxhaW4nXSk7XG4gIGxldCBkYXRhID0gJyc7XG4gIGxldCBzdGRlcnIgPSAnJztcblxuICBibGFtZS5zdGRvdXQub24oJ2RhdGEnLCBjaHVuayA9PiBkYXRhICs9IGNodW5rKTtcbiAgYmxhbWUuc3RkZXJyLm9uKCdkYXRhJywgY2h1bmsgPT4gc3RkZXJyICs9IGNodW5rKTtcblxuICBibGFtZS5vbignY2xvc2UnLCBjb2RlID0+IHtcbiAgICBpZiAoY29kZSAhPT0gMCkge1xuICAgICAgY2FsbGJhY2sobmV3IEVycm9yKHN0ZGVycikpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbW1pdHRlcnMgPSBbXTtcbiAgICBjb25zdCBjb21taXR0ZXJzQnlFbWFpbCA9IHt9O1xuICAgIGxldCB0b3RhbExpbmVzID0gMDtcbiAgICBsZXQgcGFpcmVkTGluZXMgPSAwO1xuXG4gICAgZGF0YS5zcGxpdCgnXFxuJykuZm9yRWFjaChsaW5lID0+IHtcbiAgICAgIGNvbnN0IGVtYWlscyA9IGNvbW1pdHRlckVtYWlsc0Zyb21MaW5lKGxpbmUpO1xuICAgICAgaWYgKGVtYWlscykge1xuICAgICAgICB0b3RhbExpbmVzKys7XG4gICAgICAgIGlmIChlbWFpbHMubGVuZ3RoID4gMSkge1xuICAgICAgICAgIHBhaXJlZExpbmVzKys7XG4gICAgICAgIH1cblxuICAgICAgICBlbWFpbHMuZm9yRWFjaChlbWFpbCA9PiB7XG4gICAgICAgICAgbGV0IGNvbW1pdHRlciA9IGNvbW1pdHRlcnNCeUVtYWlsW2VtYWlsXTtcbiAgICAgICAgICBpZiAoIWNvbW1pdHRlcikge1xuICAgICAgICAgICAgY29tbWl0dGVycy5wdXNoKFxuICAgICAgICAgICAgICBjb21taXR0ZXJzQnlFbWFpbFtlbWFpbF0gPSBjb21taXR0ZXIgPSB7ZW1haWwsIGxpbmVzOiAwfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29tbWl0dGVyLmxpbmVzKys7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY2FsbGJhY2sobnVsbCwge1xuICAgICAgY29tbWl0dGVycyxcbiAgICAgIHRvdGFsTGluZXMsXG4gICAgICBwYWlyZWRMaW5lc1xuICAgIH0pO1xuICB9KTtcbn1cblxuY29uc3QgQ09NTUlUVEVSX01BSUwgPSAnY29tbWl0dGVyLW1haWwnO1xuXG4vKipcbiAqIEdldHMgdGhlIGVtYWlsIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBwYXJ0aWN1bGFyIGdpdC1ibGFtZSBsaW5lLlxuICovXG5mdW5jdGlvbiBjb21taXR0ZXJFbWFpbHNGcm9tTGluZShsaW5lOiBzdHJpbmcpOiBBcnJheTxzdHJpbmc+IHtcbiAgaWYgKGxpbmUuaW5kZXhPZihDT01NSVRURVJfTUFJTCArICcgJykgPT09IDApIHtcbiAgICBjb25zdCBlbWFpbCA9IGxpbmUuc2xpY2UoQ09NTUlUVEVSX01BSUwubGVuZ3RoICsgMiwgLTEpO1xuICAgIGNvbnN0IG1hdGNoID0gZW1haWwubWF0Y2goL15naXQoPzpodWIpP1xcKyguKykoQC4rKSQvKTtcblxuICAgIGlmIChtYXRjaCkge1xuICAgICAgY29uc3QgdXNlcm5hbWVzID0gbWF0Y2hbMV07XG4gICAgICBjb25zdCBhdGhvc3RuYW1lID0gbWF0Y2hbMl07XG4gICAgICByZXR1cm4gdXNlcm5hbWVzLnNwbGl0KCcrJykubWFwKHVzZXJuYW1lID0+IHVzZXJuYW1lICsgYXRob3N0bmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBbZW1haWxdO1xuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IGdpdEJsYW1lU3RhdHMgZnJvbSAnLi4vbGliL2dpdEJsYW1lU3RhdHMnO1xuaW1wb3J0IG1vY2tTcGF3biBmcm9tICdtb2NrLXNwYXduJztcbmltcG9ydCB7IHN0cmljdEVxdWFsLCBkZWVwRXF1YWwgfSBmcm9tICdhc3NlcnQnO1xuXG5kZXNjcmliZSgnZ2l0QmxhbWVTdGF0cycsICgpID0+IHtcbiAgaXQoJ2NhbGxzIGBnaXRgIG9uIHRoZSBjb21tYW5kIGxpbmUgd2l0aCBhcHByb3ByaWF0ZSBhcmd1bWVudHMnLCAoZG9uZSkgPT4ge1xuICAgIGNvbnN0IHNwYXduID0gbW9ja1NwYXduKCk7XG4gICAgc3Bhd24uc2V0U3RyYXRlZ3koKGNvbW1hbmQsIGFyZ3MpID0+IHtcbiAgICAgIHN0cmljdEVxdWFsKGNvbW1hbmQsICdnaXQnKTtcbiAgICAgIGRlZXBFcXVhbChhcmdzLCBbJ2JsYW1lJywgJy1DJywgJ0ZJTEUudHh0JywgJy0tbGluZS1wb3JjZWxhaW4nXSk7XG4gICAgICByZXR1cm4gc3Bhd24uc2ltcGxlKDApO1xuICAgIH0pO1xuICAgIGdpdEJsYW1lU3RhdHMoJ0ZJTEUudHh0JywgKGVyciwgc3RhdHMpID0+IGRvbmUoZXJyKSwgc3Bhd24pO1xuICB9KTtcblxuICBpdCgncmVhZHMgdGhlIGNvbW1pdHRlci1tYWlsIGxpbmVzIGZyb20gc3Rkb3V0JywgKGRvbmUpID0+IHtcbiAgICBjb25zdCBzcGF3biA9IG1vY2tTcGF3bigpO1xuICAgIHNwYXduLnNldERlZmF1bHQoc3Bhd24uc2ltcGxlKDAsICdjb21taXR0ZXItbWFpbCA8ZGF2ZUBleGFtcGxlLmNvbT4nLCAnJykpO1xuICAgIGdpdEJsYW1lU3RhdHMoXG4gICAgICAnRklMRS50eHQnLFxuICAgICAgKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgc3RyaWN0RXF1YWwoZXJyLCBudWxsKTtcbiAgICAgICAgZGVlcEVxdWFsKHN0YXRzLCB7XG4gICAgICAgICAgY29tbWl0dGVyczogW3sgZW1haWw6ICdkYXZlQGV4YW1wbGUuY29tJywgbGluZXM6IDEgfV0sXG4gICAgICAgICAgdG90YWxMaW5lczogMSxcbiAgICAgICAgICBwYWlyZWRMaW5lczogMFxuICAgICAgICB9KTtcbiAgICAgICAgZG9uZShlcnIpO1xuICAgICAgfSxcbiAgICAgIHNwYXduXG4gICAgKTtcbiAgfSk7XG5cbiAgaXQoJ2FnZ3JlZ2F0ZXMgbXVsdGlwbGUgbGluZXMgYnkgdGhlIHNhbWUgYXV0aG9yJywgKGRvbmUpID0+IHtcbiAgICBjb25zdCBzcGF3biA9IG1vY2tTcGF3bigpO1xuICAgIHNwYXduLnNldERlZmF1bHQoc3Bhd24uc2ltcGxlKDAsICdjb21taXR0ZXItbWFpbCA8ZGF2ZUBleGFtcGxlLmNvbT5cXG5jb21taXR0ZXItbWFpbCA8ZGF2ZUBleGFtcGxlLmNvbT4nLCAnJykpO1xuICAgIGdpdEJsYW1lU3RhdHMoXG4gICAgICAnRklMRS50eHQnLFxuICAgICAgKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgc3RyaWN0RXF1YWwoZXJyLCBudWxsKTtcbiAgICAgICAgZGVlcEVxdWFsKHN0YXRzLCB7XG4gICAgICAgICAgY29tbWl0dGVyczogW3sgZW1haWw6ICdkYXZlQGV4YW1wbGUuY29tJywgbGluZXM6IDIgfV0sXG4gICAgICAgICAgdG90YWxMaW5lczogMixcbiAgICAgICAgICBwYWlyZWRMaW5lczogMFxuICAgICAgICB9KTtcbiAgICAgICAgZG9uZShlcnIpO1xuICAgICAgfSxcbiAgICAgIHNwYXduXG4gICAgKTtcbiAgfSk7XG5cbiAgaXQoJ2hhbmRsZXMgYGdpdCtgIHN0eWxlIHBhaXJzIGZyb20gY29tbWl0dGVyLW1haWwgbGluZXMnLCAoZG9uZSkgPT4ge1xuICAgIGNvbnN0IHNwYXduID0gbW9ja1NwYXduKCk7XG4gICAgc3Bhd24uc2V0RGVmYXVsdChzcGF3bi5zaW1wbGUoMCwgJ2NvbW1pdHRlci1tYWlsIDxnaXQrYWxpY2UrYm9iQGV4YW1wbGUuY29tPicsICcnKSk7XG4gICAgZ2l0QmxhbWVTdGF0cyhcbiAgICAgICdGSUxFLnR4dCcsXG4gICAgICAoZXJyLCBzdGF0cykgPT4ge1xuICAgICAgICBzdHJpY3RFcXVhbChlcnIsIG51bGwpO1xuICAgICAgICBkZWVwRXF1YWwoc3RhdHMsIHtcbiAgICAgICAgICBjb21taXR0ZXJzOiBbXG4gICAgICAgICAgICB7IGVtYWlsOiAnYWxpY2VAZXhhbXBsZS5jb20nLCBsaW5lczogMSB9LFxuICAgICAgICAgICAgeyBlbWFpbDogJ2JvYkBleGFtcGxlLmNvbScsIGxpbmVzOiAxIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIHRvdGFsTGluZXM6IDEsXG4gICAgICAgICAgcGFpcmVkTGluZXM6IDFcbiAgICAgICAgfSk7XG4gICAgICAgIGRvbmUoZXJyKTtcbiAgICAgIH0sXG4gICAgICBzcGF3blxuICAgICk7XG4gIH0pO1xuXG4gIGl0KCdoYW5kbGVzIGBnaXRodWIrYCBzdHlsZSBwYWlycyBmcm9tIGNvbW1pdHRlci1tYWlsIGxpbmVzJywgKGRvbmUpID0+IHtcbiAgICBjb25zdCBzcGF3biA9IG1vY2tTcGF3bigpO1xuICAgIHNwYXduLnNldERlZmF1bHQoc3Bhd24uc2ltcGxlKDAsICdjb21taXR0ZXItbWFpbCA8Z2l0aHViK2FsaWNlK2JvYkBleGFtcGxlLmNvbT4nLCAnJykpO1xuICAgIGdpdEJsYW1lU3RhdHMoXG4gICAgICAnRklMRS50eHQnLFxuICAgICAgKGVyciwgc3RhdHMpID0+IHtcbiAgICAgICAgc3RyaWN0RXF1YWwoZXJyLCBudWxsKTtcbiAgICAgICAgZGVlcEVxdWFsKHN0YXRzLCB7XG4gICAgICAgICAgY29tbWl0dGVyczogW1xuICAgICAgICAgICAgeyBlbWFpbDogJ2FsaWNlQGV4YW1wbGUuY29tJywgbGluZXM6IDEgfSxcbiAgICAgICAgICAgIHsgZW1haWw6ICdib2JAZXhhbXBsZS5jb20nLCBsaW5lczogMSB9XG4gICAgICAgICAgXSxcbiAgICAgICAgICB0b3RhbExpbmVzOiAxLFxuICAgICAgICAgIHBhaXJlZExpbmVzOiAxXG4gICAgICAgIH0pO1xuICAgICAgICBkb25lKGVycik7XG4gICAgICB9LFxuICAgICAgc3Bhd25cbiAgICApO1xuICB9KTtcblxuICBpdCgnY2FsbHMgYmFjayB3aXRoIGFuIGVycm9yIGlmIGBnaXQtYmxhbWVgIGZhaWxzJywgKGRvbmUpID0+IHtcbiAgICBjb25zdCBzcGF3biA9IG1vY2tTcGF3bigpO1xuICAgIHNwYXduLnNldERlZmF1bHQoc3Bhd24uc2ltcGxlKDEsICcnLCAnT01HIEJCUScpKTtcbiAgICBnaXRCbGFtZVN0YXRzKFxuICAgICAgJ0ZJTEUudHh0JyxcbiAgICAgIChlcnIsIHN0YXRzKSA9PiB7XG4gICAgICAgIHN0cmljdEVxdWFsKHN0YXRzKTtcbiAgICAgICAgc3RyaWN0RXF1YWwoZXJyLm1lc3NhZ2UsICdPTUcgQkJRJyk7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgIH0sXG4gICAgICBzcGF3blxuICAgICk7XG4gIH0pO1xufSk7XG4iXSwibmFtZXMiOlsic3Bhd24iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkEsQUFBZSxTQUFTLGFBQWEsQ0FBQyxJQUFZLEVBQUUsUUFB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