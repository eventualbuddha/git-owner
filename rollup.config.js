import typescript from 'rollup-plugin-typescript';
import * as ts from 'typescript';

var pkg = require('./package.json');

export default {
  entry: 'lib/index.ts',
  external: ['child_process'],
  plugins: [typescript({ typescript: ts })],
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
