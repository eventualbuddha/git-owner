let file;
let format;

import gitBlameStats from './gitBlameStats';
import { BlameStats } from './gitBlameStats';

export default function run() {
  parseArguments();
  gitBlameStats(file, (err: Error | null, stats: BlameStats | null) => {
    if (err || !stats) { throw err; }

    if (format === 'json') {
      console.log(stats.committers);
    } else {
      const maxPercentage = stats.committers.reduce((max, committer) => Math.max(max, committer.percentage), 0);

      stats.committers.forEach(function(committer) {
        const percentage = `${committer.percentage * 100}`;

        console.log(
          '%s%s% %s',
          new Array((`${maxPercentage * 100}`).length - percentage.length + 1).join(' '),
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

function usage(code: number | null=null) {
  console.error('git owner [-f JSON] FILE');
  if (code !== null) {
    process.exit(code);
  }
}
