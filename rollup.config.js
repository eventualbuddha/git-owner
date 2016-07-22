import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

var pkg = require('./package.json');

export default {
  entry: 'lib/index.js',
  external: ['child_process'],
  plugins: [babel(babelrc())],
  sourceMap: 'inline',
  targets: [
    {
      format: 'es',
      dest: pkg['jsnext:main']
    },
    {
      format: 'umd',
      moduleName: 'gitOwner',
      dest: pkg['main']
    }
  ]
};
