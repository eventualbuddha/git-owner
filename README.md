# git-owner

Print "ownership" information for a file in git.

## Install

```
$ npm install -g git-owner
```

## Usage

Typically you'll probably want to use it on the command line:

```
# Who has contributed most to the Ember.js README?
$ git owner README.md
35% tom@sproutcore.com
23% gilesb@gmail.com
11% peter.wagenet@gmail.com
 9% bradfol@gmail.com
 5% trevor@well.com
 5% robert.w.jackson@me.com
 4% ilya@burstcreations.com
 2% andyhmltn@gmail.com
 2% charles@sproutcore.com
 2% bluewhale1982@gmail.com
 1% tomhuda@strobecorp.com
 1% wycats@gmail.com
 1% cory.forsyth@gmail.com
 1% tricknotes.rs@gmail.com
 1% gimil@mozy.com
 1% nwjsmith@gmail.com
 1% builes.adolfo@gmail.com
 1% bryan@brynary.com

200 lines.
```

You can also use it as a library:

```js
var gitBlameStats = require('../lib').gitBlameStats;
gitBlameStats(process.argv[2], function(err, stats) {
  console.log(stats);
});
```

## Contributing

Contributions are welcome, but at the moment there are no tests which might
make it a bit harder. You should have ample test files to try it out with,
though!
