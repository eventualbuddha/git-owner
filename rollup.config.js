import babel from 'rollup-plugin-babel';

export default {
  entry: 'lib/index.js',
  external: ['child_process'],
  plugins: [babel()],
  sourceMap: 'inline'
};
