import { fs } from './libs';
import * as t from './types';
const env = fs.env.value;

import { BUNDLE } from '@platform/cell.schema/lib/common/constants';

const CONFIG = {
  parent: () => undefined,
  name: '',
  outdir: 'dist',
  mode: 'production',
  port: 3000,
  target: 'web',
  entry: {},
};

export const PKG = {
  PATH: fs.resolve('./package.json'),
  load: () => fs.readJsonSync(PKG.PATH) as t.CompilerPackageJson,
};

export const COMPILER = {
  PATH: fs.join(__dirname, '../../../package.json'),
  load() {
    const { name, version } = fs.readJsonSync(COMPILER.PATH) as t.INpmPackageJson;
    return { name, version };
  },
};

export const IS_CLOUD = Boolean(env('VERCEL_REGION'));
const TMP = IS_CLOUD ? '/tmp' : fs.resolve('tmp');

export const PATH = {
  TMP,
  LOGDIR: IS_CLOUD ? fs.join(TMP, '.log') : fs.resolve('./.log'),
  CACHEDIR: IS_CLOUD
    ? fs.join(TMP, '.cache/cell.compiler')
    : fs.resolve('./node_modules/.cache/cell.compiler'),
};

export const FILE = {
  JSON: { MANIFEST: BUNDLE.MANIFEST.FILENAME },
  JS: {
    REMOTE_ENTRY: 'remoteEntry.js',
    ENTRY: {
      WEB: 'index.html',
      NODE: 'main.js',
    },
  },
};

export const DEFAULT = {
  CONFIG,
  WEBPACK: { rules: [], plugins: [] },
  BASE: 'base', // Base configuration name.
  FILE,
};
