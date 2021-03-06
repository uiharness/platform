import { path, Schema, t, util } from '../common';

export * from '../types';

const LocalFile = Schema.File.Path.Local;

/**
 * Initializes a "local" file-system API.
 */
export function init(args: { dir: string; fs: t.IFs }): t.IFsLocal {
  const fs = args.fs;
  const dir = fs.resolve(args.dir);
  const root = dir;

  const local: t.IFsLocal = {
    type: 'LOCAL',

    /**
     * Root directory of the file system.
     */
    dir,

    /**
     * Convert the given string to an absolute path.
     */
    resolve(uri: string, options?: t.IFsResolveOptionsLocal): t.IFsLocation {
      const type = options?.type ?? 'DEFAULT';

      if (type === 'SIGNED/post') {
        // NB: A local simulated end-point of an AWS/S3 "presignedPost" URL.
        const args = options as t.S3SignedPostOptions;
        const key = path.resolve({ uri, dir });
        const mime = args.contentType || Schema.Mime.toType(key, 'application/octet-stream');
        return {
          path: Schema.Urls.routes.LOCAL.FS,
          props: { 'content-type': mime, key },
        };
      }

      if (type !== 'DEFAULT') {
        const err = `Local file-system resolve only supports "DEFAULT" or "SIGNED/post" operation.`;
        throw new Error(err);
      }

      return {
        path: path.resolve({ uri, dir }),
        props: {}, // NB: only relevant for S3 (pre-signed POST).
      };
    },

    /**
     * Retrieve meta-data of a local file.
     */
    async info(uri: string): Promise<t.IFsInfoLocal> {
      uri = (uri || '').trim();
      const path = local.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });
      const readResponse = await this.read(uri);
      const { status, file } = readResponse;
      const exists = status !== 404;
      return {
        uri,
        exists,
        path,
        location,
        hash: file ? file.hash : '',
        bytes: file ? file.bytes : -1,
      };
    },

    /**
     * Read from the local file-system.
     */
    async read(uri: string): Promise<t.IFsReadLocal> {
      uri = (uri || '').trim();
      const path = local.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });

      // Ensure the file exists.
      if (!(await fs.exists(path))) {
        const error: t.IFsError = {
          type: 'FS/read',
          message: `A file with the URI [${uri}] does not exist.`,
          path,
        };
        return { ok: false, status: 404, uri, error };
      }

      // Load the file.
      try {
        const data = await fs.readFile(path);
        const file: t.IFsFileData = {
          path,
          location,
          data,
          get hash() {
            return Schema.hash.sha256(data);
          },
          get bytes() {
            return Uint8Array.from(file.data).length;
          },
        };
        return { ok: true, status: 200, uri, file };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/read',
          message: `Failed to write file at URI [${uri}]. ${err.message}`,
          path,
        };
        return { ok: false, status: 500, uri, error };
      }
    },

    /**
     * Write to the local file-system.
     */
    async write(uri: string, data: Buffer): Promise<t.IFsWriteLocal> {
      if (!data) {
        throw new Error(`Cannot write, no data provided.`);
      }

      uri = (uri || '').trim();
      const path = local.resolve(uri).path;
      const location = LocalFile.toAbsoluteLocation({ path, root });
      const file: t.IFsFileData = {
        path,
        location,
        data,
        get hash() {
          return Schema.hash.sha256(data);
        },
        get bytes() {
          return Uint8Array.from(file.data).length;
        },
      };

      try {
        await fs.ensureDir(fs.dirname(path));
        await fs.writeFile(path, data);
        return { uri, ok: true, status: 200, file };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/write',
          message: `Failed to write [${uri}]. ${err.message}`,
          path,
        };
        return { ok: false, status: 500, uri, file, error };
      }
    },

    /**
     * Delete from the local file-system.
     */
    async delete(uri: string | string[]): Promise<t.IFsDeleteLocal> {
      const uris = (Array.isArray(uri) ? uri : [uri]).map((uri) => (uri || '').trim());
      const paths = uris.map((uri) => local.resolve(uri).path);
      const locations = paths.map((path) => LocalFile.toAbsoluteLocation({ path, root }));

      try {
        await Promise.all(paths.map((path) => fs.remove(path)));
        return { ok: true, status: 200, uris, locations };
      } catch (err) {
        const error: t.IFsError = {
          type: 'FS/delete',
          message: `Failed to delete [${uri}]. ${err.message}`,
          path: paths.join(','),
        };
        return { ok: false, status: 500, uris, locations, error };
      }
    },

    /**
     * Copy a file.
     */
    async copy(sourceUri: string, targetUri: string): Promise<t.IFsCopyLocal> {
      const format = (input: string) => {
        const uri = (input || '').trim();
        const path = local.resolve(uri).path;
        return { uri, path };
      };

      const source = format(sourceUri);
      const target = format(targetUri);

      const done = (status: number, error?: t.IFsError) => {
        const ok = util.isOK(status);
        return { ok, status, source: source.uri, target: target.uri, error };
      };

      try {
        await fs.ensureDir(fs.dirname(target.path));
        await fs.copyFile(source.path, target.path);
        return done(200);
      } catch (err) {
        const message = `Failed to copy from [${source.uri}] to [${target.uri}]. ${err.message}`;
        const error: t.IFsError = {
          type: 'FS/copy',
          message,
          path: target.path,
        };
        return done(500, error);
      }
    },
  };

  return local;
}
