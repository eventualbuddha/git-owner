let file;
let format;

import { gitBlameStats } from '../lib/index';
import type { BlameStats } from '../lib/index';

export default function run() {
  parseArguments();
  processFile(file, (err: ?Error, stats: ?BlameStats) => {
    if (err) { throw err; }

    if (format === 'json') {
      console.log(stats.committers.map(pair => pair[1]));
    } else {
      const maxPercentage = stats.committers.reduce((max, pair) => Math.max(max, pair[0]), 0);

      stats.committers.forEach(function(pair) {
        const percentage = `${pair[0]}`;
        const committer = pair[1];

        console.log(
          '%s%s% %s',
          new Array((`${maxPercentage}`).length - percentage.length + 1).join(' '),
          percentage,
          committer.email
        );
      });

      console.log();
      if (stats.pairedLines > 0) {
        console.log('%s lines, %s paired.', stats.totalLines, stats.pairedLines);
      } else {
        console.log('%s lines.', stats.totalLines);
      }
    }
  });
}

function parseArguments() {
  const args = process.argv.slice(2);
  let arg;

  while ((arg = args.shift())) {
    if (arg === '-h' || arg === '--help') {
      usage(0);
    } else if (arg === '-f' || arg === '--format') {
      let next = args.shift();
      if (!next) {
        usage(1);
      } else {
        next = next.toLowerCase();
      }
      if (next !== 'json') {
        usage(1);
      }
      format = next;
    } else if (arg[0] === '-') {
      usage(1);
    } else if (!file) {
      file = arg;
    } else {
      usage(1);
    }
  }

  if (!file) {
    usage(1);
  }
}

function usage(code: number=null) {
  console.error('git owner [-f JSON] FILE');
  if (code !== null) {
    process.exit(code);
  }
}

function processFile(file: string, callback: (error: ?Error, stats: ?BlameStats) => void) {
  gitBlameStats(file, (err, stats) => {
    if (err) {
      return callback(err);
    }

    stats.committers = stats.committers
      .sort((c1, c2) => c2.lines - c1.lines)
      .map(committer => {
        const percentage = Math.round(
          100 * committer.lines / stats.totalLines
        );
        return [percentage, committer];
      });

    callback(null, stats);
  });
}
