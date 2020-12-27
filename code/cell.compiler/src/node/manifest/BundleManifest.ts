import { DEFAULT, deleteUndefined, Model, Schema, t } from '../common';
import { FileManifest, createAndSave } from './Manifest';

type M = t.BundleManifest;

/**
 * Helpers for creating and working with a [BundleManifest].
 */
export const BundleManifest = {
  /**
   * The filename of the bundle.
   */
  filename: FileManifest.filename,

  /**
   * URL to the manifest
   */
  url(host: string, uri: string, dir?: string) {
    const urls = Schema.urls(host);
    return urls.fn.bundle.manifest({ host, uri, dir });
  },

  /**
   * Generates a manifest.
   */
  async create(args: { model: t.CompilerModel; sourceDir: string; filename?: string }): Promise<M> {
    const { sourceDir, model, filename = BundleManifest.filename } = args;
    const data = Model(model);
    const manifest = await FileManifest.create({ sourceDir, model, filename });
    const { hash, files } = manifest;

    const REMOTE = DEFAULT.FILE.JS.REMOTE_ENTRY;
    const remoteEntry = files.some((file) => file.path.endsWith(REMOTE)) ? REMOTE : undefined;

    const bundle: M['bundle'] = deleteUndefined({
      mode: data.mode(),
      target: data.target(),
      entry: data.entryFile,
      remoteEntry,
    });

    return {
      kind: 'bundle',
      hash,
      bundle,
      files,
    };
  },

  /**
   * Write the bundle manifest to the file-system.
   */
  async createAndSave(args: { model: t.CompilerModel; sourceDir: string; filename?: string }) {
    const { model, sourceDir, filename } = args;
    return createAndSave<M>({
      create: () => BundleManifest.create({ sourceDir, model, filename }),
      sourceDir,
      filename,
      model,
    });
  },

  /**
   * Reads from file-system.
   */
  async read(args: { dir: string; filename?: string }) {
    return FileManifest.read<M>(args);
  },

  /**
   * Writes a manifest to the file-system.
   */
  async write(args: { manifest: M; dir: string; filename?: string }) {
    return FileManifest.write<M>(args);
  },
};
