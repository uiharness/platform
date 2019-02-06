import { exec, paths, join } from '../common';

export type ILintResult = {
  success: boolean;
  error?: Error;
};

/**
 * Runs the typescript linter.
 */
export async function lint(
  args: { silent?: boolean } = {},
): Promise<ILintResult> {
  const dir = paths.closestParentOf('tslint.json');
  if (!dir) {
    const error = new Error(`A 'tslint.json' file could not be found.`);
    return { success: false, error };
  }

  const modules = join(dir, 'node_modules');
  const path = {
    prettier: join(modules, 'prettier/bin-prettier'),
    tslint: join(modules, 'tslint/bin/tslint'),
  };

  const cmd = {
    prettier: `node ${path.prettier} all --write 'src/**/*.ts{,x}'`,
    tslint: `node ${path.tslint} 'src/**/*.ts{,x}' --format verbose --fix`,
  };

  try {
    let error: Error | undefined;
    const run = async (cmd: string, name: string, silent?: boolean) => {
      const res = await exec.run(cmd, { silent: silent || args.silent, dir });
      if (res.code !== 0) {
        error = new Error(`'${name}' failed.`);
      }
    };
    await run(cmd.prettier, 'prettier', true);
    await run(cmd.tslint, 'tslint');
    return { success: !error, error };
  } catch (error) {
    return { success: false, error };
  }
}
