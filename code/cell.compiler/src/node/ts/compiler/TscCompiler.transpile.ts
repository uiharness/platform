import { exec, fs, ProgressSpinner, slug, t } from '../../common';
import { TypeManifest } from '../../manifest';

/**
 * Wrapper for running the `tsc` typescript compiler
 * with a programmatic API.
 *
 * NOTE:
 *    Uses [exec] child_process under the hood.
 *
 */
export function Transpiler(tsconfig: t.TsCompilerConfig): t.TscTranspile {
  return async (args) => {
    const { model } = args;
    const outdir = fs.resolve(args.outdir);
    const spinner = ProgressSpinner({ label: args.spinnerLabel || 'building typescript' });

    // Prepare [tsconfig].
    const json = await tsconfig.json();
    json.compilerOptions = { ...(json.compilerOptions || {}), ...args.compilerOptions };
    json.compilerOptions.outDir = outdir;
    if (args.source) {
      json.include = Array.isArray(args.source) ? args.source : [args.source];
    }

    // Save the transient [tsconfig] file.
    const path = fs.join(fs.dirname(tsconfig.path), `tsconfig.tmp.${slug()}`);
    await fs.writeFile(tsconfig.path, JSON.stringify(json, null, '  '));

    // Run the command.
    if (!args.silent) spinner.start();
    let error: string | undefined;
    const cmd = exec.command(`tsc --project ${tsconfig.path}`);
    const cwd = fs.dirname(path);
    const res = await cmd.run({ cwd, silent: true });
    if (!res.ok) {
      const emitted = res.errors.map((err) => err).join('\n');
      error = `Failed to transpile typescript. ${emitted}`.trim();
    }

    // Save the type-declaration manifest.
    const info = await TypeManifest.info(model?.entry?.main);
    const { manifest } = await TypeManifest.createAndSave({
      base: fs.dirname(outdir),
      dir: fs.basename(outdir),
      model,
      info,
    });

    // Clean up.
    spinner.stop();
    await fs.remove(path);

    // Finish up.
    return {
      tsconfig: json,
      out: { dir: outdir, manifest },
      error,
    };
  };
}
