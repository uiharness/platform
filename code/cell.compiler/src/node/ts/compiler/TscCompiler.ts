import { fs, t } from '../../common';
import { compileDeclarations } from '../__compiler.declarations';
import { TscTranspiler } from './TscCompiler.transpile';
import { TscDeclarations } from './TscDeclarations';
import { TscCopy } from './TscCopy';
import { TscManifest } from './TscManifest';

/**
 * Create the typescript compiler.
 */
export function TscCompiler(tsconfigPath?: string) {
  const tsconfig: t.TscConfig = {
    path: fs.resolve(tsconfigPath || 'tsconfig.json'),
    async json() {
      const path = compiler.tsconfig.path;
      if (!(await fs.pathExists(path))) throw new Error(`tsconfig file not found at: ${path}`);
      return (await fs.readJson(path)) as t.TscConfigFile;
    },
  };

  const compiler: t.TscCompiler = {
    tsconfig,
    declarations: TscDeclarations(tsconfig),
    manifest: TscManifest,
    transpile: TscTranspiler(tsconfig),
    copyBundle: TscCopy.bundle,
    copyRefs: TscCopy.refs,

    /**
     * Compile typescript [.d.ts] declarations.
     */
    async declarations_OLD(args) {
      /**
       * TODO 🐷 REMOVE
       */
      return compileDeclarations({ ...args, tsconfig });
    },
  };

  return compiler;
}
