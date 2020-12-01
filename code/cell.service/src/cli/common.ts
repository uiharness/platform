import { fs } from '@platform/fs';
import * as t from '../common/types';
export { Config } from '../server/config';

export { fs, t };
export { cli } from '@platform/cli';
export { log } from '@platform/log/lib/server';
export { defaultValue, time } from '@platform/util.value';
export { http } from '@platform/http';

export { PKG } from '../common/constants';
export const PATH = {
  CONFIG_DIR: fs.resolve('config'),
};

export const util = {
  /**
   * Ensure the config directory exists.
   */
  async ensureConfigDir(args: { dir?: string } = {}) {
    const dir = args.dir || PATH.CONFIG_DIR;
    await fs.ensureDir(dir);
    await util.renameToYml({ dir });
    return dir;
  },
  /**
   * Rename all YAML files within the directory to `.yml`
   */
  async renameToYml(args: { dir?: string } = {}) {
    const dir = args.dir || PATH.CONFIG_DIR;
    const names = (await fs.readdir(dir)).filter((name) => name.endsWith('.yaml'));

    const renamed: { from: string; to: string }[] = [];
    for (const name of names) {
      const from = fs.join(dir, name);
      const to = fs.join(dir, `${name.replace(/\.yaml$/, '')}.yml`);
      await fs.rename(from, to);
      renamed.push({ from, to });
    }
    return { renamed };
  },
};