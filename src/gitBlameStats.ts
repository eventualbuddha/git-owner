import { spawn } from 'child_process';

export type BlameStats = {
  committers: Array<CommitterStats>,
  totalLines: number,
  pairedLines: number
};

export type CommitterStats = {
  email: string;
  lines: number;
  percentage: number;
};

export type spawnFunction = typeof spawn;

/**
 * Generates statistics about the committers for a given file.
 */
export default function gitBlameStats(file: string, callback: (error: Error | null, stats: BlameStats | null) => void, _spawn: spawnFunction=spawn) {
  let blame = _spawn('git', ['blame', '-C', '-w', file, '--line-porcelain']);
  let data = '';
  let stderr = '';

  blame.stdout.on('data', chunk => data += chunk);
  blame.stderr.on('data', chunk => stderr += chunk);

  blame.on('close', code => {
    if (code !== 0) {
      callback(new Error(stderr), null);
    }

    let committers: Array<CommitterStats> = [];
    let committersByEmail: { [email: string]: CommitterStats; } = {};
    let totalLines = 0;
    let pairedLines = 0;

    data.split('\n').forEach(line => {
      let emails = committerEmailsFromLine(line);
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
function committerEmailsFromLine(line: string): Array<string> | null {
  if (line.indexOf(COMMITTER_MAIL + ' ') < 0) {
    return null;
  }

  let email = line.slice(COMMITTER_MAIL.length + 2, -1);
  let match = email.match(/^git(?:hub)?\+(.+)(@.+)$/);

  if (match) {
    let usernames = match[1];
    let athostname = match[2];
    return usernames.split('+').map(username => username + athostname);
  } else {
    return [email];
  }
}
