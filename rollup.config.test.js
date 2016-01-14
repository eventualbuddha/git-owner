import config from './rollup.config';

config.entry = 'test/test.js';
config.dest = 'build/test-bundle.js';
config.format = 'cjs';
config.plugins.push({
  intro: () => `require('source-map-support').install();`
});

export default config;
