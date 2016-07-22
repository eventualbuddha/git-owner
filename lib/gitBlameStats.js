/* @flow */

import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';

export type BlameStats = {
  committers: Array<CommitterStats>,
  totalLines: number,
  pairedLines: number
};

type CommitterStats = {
  email: string;
  lines: number;
  percentage: number;
};

type spawnFunction = typeof spawn;

/**
 * Generates statistics about the committers for a given file.
 */
export default function gitBlameStats(file: string, callback: (error: ?Error, stats: ?BlameStats) => void, _spawn: spawnFunction=spawn) {
  const blame = _spawn('git', ['blame', '-C', file, '--line-porcelain']);
  let data = '';
  let stderr = '';

  blame.stdout.on('data', chunk => data += chunk);
  blame.stderr.on('data', chunk => stderr += chunk);

  blame.on('close', code => {
    if (code !== 0) {
      callback(new Error(stderr));
    }

    const committers = [];
    const committersByEmail = {};
    let totalLines = 0;
    let pairedLines = 0;

    data.split('\n').forEach(line => {
      const emails = committerEmailsFromLine(line);
      if (emails) {
        totalLines++;
        if (emails.length > 1) {
          pairedLines++;
        }

        emails.forEach(email => {
          let committer = committersByEmail[email];
          if (!committer) {
            committers.push(
              committersByEmail[email] = committer = {
                email,
                lines: 0,
                percentage: 0
              }
            );
          }
          committer.lines++;
        });
      }
    });

    committers.forEach(committer => {
      committer.percentage = committer.lines / totalLines;
    });

    callback(null, {
      committers,
      totalLines,
      pairedLines
    });
  });
}

const COMMITTER_MAIL = 'committer-mail';

/**
 * Gets the email addresses associated with this particular git-blame line.
 */
function committerEmailsFromLine(line: string): ?Array<string> {
  if (line.indexOf(COMMITTER_MAIL + ' ') < 0) {
    return null;
  }

  const email = line.slice(COMMITTER_MAIL.length + 2, -1);
  const match = email.match(/^git(?:hub)?\+(.+)(@.+)$/);

  if (match) {
    const usernames = match[1];
    const athostname = match[2];
    return usernames.split('+').map(username => username + athostname);
  } else {
    return [email];
  }
}
