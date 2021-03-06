import { t } from './common';
import { CompilerOptions } from 'typescript';

export type TscDir = { base: string; dirname: string };
export type TscPathTransform = { from: string; to: string };

export type TscConfig = { path: string; json(): Promise<t.TscConfigFile> };
export type TscConfigFile = {
  extends: string;
  include: string[];
  compilerOptions: CompilerOptions;
};

/**
 * Typescript compiler.
 */
export type TscCompiler = {
  readonly tsconfig: t.TscConfig;
  readonly declarations: t.TscDeclarations;
  readonly manifest: t.TscManifest;
  copyBundle: t.TscCopyBundle;
  copyRefs: t.TscCopyRefs;
  transpile: t.TscTranspile;
};

/**
 * Generic [tsc] transpiler.
 */
export type TscTranspile = (args: t.TscTranspileArgs) => Promise<t.TscTranspileResult>;

export type TscTranspileArgs = {
  outdir: string;
  source?: string | string[]; // File or glob pattern (eg: src/foo/**/*) used as "include" field in [tsconfig].
  silent?: boolean;
  spinnerLabel?: string;
  compilerOptions?: CompilerOptions;
  transformPath?: TscTransformPath;
};

export type TscTransformPath = (path: string) => string | undefined;

export type TscTranspileResult = {
  tsconfig: TscConfigFile;
  out: { dir: string; manifest: t.TypelibManifest };
  transformations: TscPathTransform[];
  error?: string;
};

/**
 * Manifest
 */
export type TscManifest = {
  exists(dir: string): Promise<boolean>;
  generate: TscManifestGenerate;
  validate(dir: string, manifest: t.Manifest): Promise<t.ManifestValidation>;
};

export type TscManifestGenerate = (
  args: t.TscManifestGenerateArgs,
) => Promise<t.TscManifestGenerateResult>;
export type TscManifestGenerateArgs = { dir: string };
export type TscManifestGenerateResult = {
  path: string;
  manifest: t.TypelibManifest;
  info: t.TypelibManifestInfo;
};

/**
 * Copying
 */
export type TscCopy = {
  bundle: t.TscCopyBundle;
  refs: t.TscCopyRefs;
};

/**
 * Copy Bunel
 */
export type TscCopyBundle = (args: TscCopyBundleArgs) => Promise<TscCopyBundleResult>;

export type TscCopyBundleArgs = {
  from: string; // Directory path.
  to: string; //   Directory path.
  filter?: (path: string) => boolean;
  transformPath?: TscTransformPath;
};

export type TscCopyBundleResult = {
  from: TscDir;
  to: TscDir;
  paths: string[];
  transformations: TscPathTransform[];
  manifest: t.TypelibManifest;
};

/**
 * Copy bundle refs (imports/exports).
 */
export type TscCopyRefs = (args: TscCopyRefsArgs) => Promise<TscCopyRefsResult>;

export type TscCopyRefsArgs = {
  sourceDir: string; // Directory of the bundle.
  targetDir?: string; // Directory to copy refs to. If ommited the parent of [sourceDir] is used.
  force?: boolean; // Force copy if already cached.
  recursive?: boolean; // Default: true.
};

export type TscCopyRefsResult = {
  source: string;
  target: string;
  copied: TscCopyRefsResultRef[];
};
export type TscCopyRefsResultRef = {
  module: string;
  from: string;
  to: string;
  total: number;
};

/**
 * Tools for compiling ".d.ts" declarations
 */
export type TscDeclarations = {
  transpile: TscTranspileDeclarations;
};

export type TscTranspileDeclarations = (
  args: TscTranspileDeclarationsArgs,
) => Promise<TscTranspileDeclarationsResult>;

export type TscTranspileDeclarationsArgs = {
  outdir: string;
  source?: string | string[]; // File or glob pattern, eg: src/foo/**/*
  silent?: boolean;
  copyRefs?: boolean; // Default: true
};

export type TscTranspileDeclarationsResult = TscTranspileResult;
