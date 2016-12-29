import { deepEqual, strictEqual } from 'assert';
import mockSpawn = require('mock-spawn');
import { gitBlameStats } from '../src/index';

describe('gitBlameStats', () => {
  it('calls `git` on the command line with appropriate arguments', (done) => {
    let spawn = mockSpawn();
    spawn.setStrategy((command, args) => {
      strictEqual(command, 'git');
      deepEqual(args, ['blame', '-C', '-w', 'FILE.txt', '--line-porcelain']);
      return spawn.simple(0);
    });
    gitBlameStats('FILE.txt', err => done(err), spawn);
  });

  it('reads the committer-mail lines from stdout', (done) => {
    let spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <dave@example.com>', ''));
    gitBlameStats(
      'FILE.txt',
      (err, stats) => {
        strictEqual(err, null);
        deepEqual(stats, {
          committers: [{ email: 'dave@example.com', lines: 1, percentage: 1 }],
          totalLines: 1,
          pairedLines: 0
        });
        done(err);
      },
      spawn
    );
  });

  it('aggregates multiple lines by the same author', (done) => {
    let spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <dave@example.com>\ncommitter-mail <dave@example.com>', ''));
    gitBlameStats(
      'FILE.txt',
      (err, stats) => {
        strictEqual(err, null);
        deepEqual(stats, {
          committers: [{ email: 'dave@example.com', lines: 2, percentage: 1 }],
          totalLines: 2,
          pairedLines: 0
        });
        done(err);
      },
      spawn
    );
  });

  it('handles `git+` style pairs from committer-mail lines', (done) => {
    let spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <git+alice+bob@example.com>', ''));
    gitBlameStats(
      'FILE.txt',
      (err, stats) => {
        strictEqual(err, null);
        deepEqual(stats, {
          committers: [
            { email: 'alice@example.com', lines: 1, percentage: 1 },
            { email: 'bob@example.com', lines: 1, percentage: 1 }
          ],
          totalLines: 1,
          pairedLines: 1
        });
        done(err);
      },
      spawn
    );
  });

  it('handles `github+` style pairs from committer-mail lines', (done) => {
    let spawn = mockSpawn();
    spawn.setDefault(spawn.simple(0, 'committer-mail <github+alice+bob@example.com>', ''));
    gitBlameStats(
      'FILE.txt',
      (err, stats) => {
        strictEqual(err, null);
        deepEqual(stats, {
          committers: [
            { email: 'alice@example.com', lines: 1, percentage: 1 },
            { email: 'bob@example.com', lines: 1, percentage: 1 }
          ],
          totalLines: 1,
          pairedLines: 1
        });
        done(err);
      },
      spawn
    );
  });

  it('calls back with an error if `git-blame` fails', (done) => {
    let spawn = mockSpawn();
    spawn.setDefault(spawn.simple(1, '', 'OMG BBQ'));
    gitBlameStats(
      'FILE.txt',
      (err, stats) => {
        strictEqual(stats, null);
        strictEqual(err && err.message, 'OMG BBQ');
        done();
      },
      spawn
    );
  });
});
