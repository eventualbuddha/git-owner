import config from './rollup.config';

config.dest = 'dist/git-owner.umd.js';
config.format = 'umd';
config.moduleName = 'gitOwner';

export default config;
