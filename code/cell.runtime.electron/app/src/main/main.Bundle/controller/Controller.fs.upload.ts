import {
  ENV,
  fs,
  HttpClient,
  log,
  ManifestSource,
  ManifestUrl,
  Paths,
  slug,
  t,
  time,
} from '../common';

type Uri = string;
type Url = string;
type Directory = string;
type File = t.IHttpClientCellFileUpload;

/**
 * Upload files to the given target.
 */
export async function uploadLocal(args: {
  http: t.IHttpClient;
  source: t.ManifestSource;
  target: { cell: Uri; dir: Directory };
  silent?: boolean;
}) {
  const timer = time.timer();
  const { http, source } = args;
  const host = http.origin;
  const target = {
    cell: args.target.cell,
    dir: (args.target.dir || '').trim().replace(/^\/*/, '').replace(/\/*$/, ''),
  };

  let files: File[] = [];
  const errors: string[] = [];
  const error = (message: string) => errors.push(message);
  const done = () => {
    const ok = errors.length === 0;
    return { ok, files, errors };
  };

  try {
    files = await readFiles({ source: source.dir, target: target.dir });
    const res = await http.cell(target.cell).fs.upload(files);

    if (!res.ok) {
      const errors = res.body.errors;
      error('Failed while uploading files');
      errors.forEach((err) => error(`${err.type}: ${err.message}`));
      Log.failure({ source, host, errors });
      return done(); // Failure.
    }

    if (!args.silent) {
      const elapsed = timer.elapsed.toString();
      const targetCell = target.cell;
      Log.success({ source, targetCell, host, files, elapsed });
    }

    return done(); // Success.
  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      log.info.yellow(`[Upload Error] Ensure the target server is online. ${log.gray(host)}`);
    } else {
      log.info.yellow(`[Upload Error] ${err.message}`);
    }
    error(err.message);
    return done(); // Failure.
  }
}

/**
 * Upload files from the given remote location.
 */
export async function uploadRemote(args: {
  http: t.IHttpClient;
  source: t.ManifestSource;
  manifest: t.ModuleManifest;
  target: { cell: Uri; dir: Directory };
  silent?: boolean;
}) {
  const { http, target, manifest, silent } = args;
  const tmp = fs.join(Paths.tmp.base, `copy.${slug()}`);
  const url = ManifestUrl(args.source.toString());
  const httpSource = HttpClient.create(url.domain).cell(url.cell);

  const prefixPath = (path: string) => (url.dir ? fs.join(url.dir, path) : path);
  const writeFile = async (path: string, data: ReadableStream<any> | t.Json) => {
    path = fs.join(tmp, path);
    await fs.ensureDir(fs.dirname(path));
    await fs.stream.save(path, data);
  };

  /**
   * Download remote files and save locally.
   */
  await Promise.all(
    manifest.files.map(async (item) => {
      const path = prefixPath(item.path);
      const file = await httpSource.fs.file(path).download();
      await writeFile(path, file.body);
    }),
  );

  /**
   * Save the manifest and upload to target.
   */
  const manifestPath = prefixPath('index.json');
  await writeFile(manifestPath, manifest);
  const source = ManifestSource(fs.join(tmp, manifestPath));
  const res = await uploadLocal({ http, source, target, silent });

  // Finish up.
  await fs.remove(tmp);
  return res;
}

/**
 * Helpers
 */

/**
 * Retrieve the set of files to upload.
 */
async function readFiles(dir: { source: Directory; target: Directory }) {
  const paths = await fs.glob.find(fs.resolve(`${dir.source}/**`));
  const files = await Promise.all(
    paths.map(async (path) => {
      const filename = fs.join(dir.target, path.substring(dir.source.length + 1));
      const data = await fs.readFile(path);
      const file: File = { filename, data };
      return file;
    }),
  );
  return files.filter((file) => file.data.byteLength > 0);
}

const Log = {
  /**
   * Write the details of an upload to the log.
   */
  success(args: {
    source: t.ManifestSource;
    targetCell: Uri;
    host: string;
    files: File[];
    elapsed: string;
  }) {
    const { host, files, targetCell, elapsed } = args;
    const bytes = files.reduce((acc, next) => acc + next.data.byteLength, 0);
    const size = fs.size.toString(bytes);
    const isLocalhost = host === 'localhost' || host.startsWith('localhost:');
    const protocol = isLocalhost ? 'http' : 'https';

    const table = log.table({ border: false });
    table.add(['  • host', `${protocol}://${host}`]);
    table.add(['  • cell', log.format.uri(targetCell)]);
    table.add(['  • files: ']);

    const addFile = (file: File) => {
      const { filename, data } = file;
      const name = log.format.filepath(filename);
      const size = fs.size.toString(data.byteLength);
      table.add(['', `${name} `, size]);
    };
    files.filter((file) => file.filename.endsWith('.map')).forEach((file) => addFile(file));
    files.filter((file) => !file.filename.endsWith('.map')).forEach((file) => addFile(file));
    table.add(['', '', log.white(size)]);

    log.info(`
  
  ${log.white(`uploaded`)}    ${log.gray(`(${elapsed})`)}
  ${log.gray(` from:      ${args.source.toString()}`)}
  ${log.gray(` to:`)}
  ${log.gray(table)}
  `);
  },

  /**
   * Write details about an upload failure.
   */
  failure(args: { source: t.ManifestSource; host: string; errors: t.IHttpErrorFile[] }) {
    log.info.yellow(`Failed to upload files.`);
    log.info.gray(' • packaged:', ENV.isPackaged);
    log.info.gray(' • dir:     ', args.source.toString());
    log.info.gray(' • host:    ', args.host);
    log.info.gray(' • errors:');
    args.errors.forEach((err) => {
      log.info();
      log.info.gray(`  • type:     ${err.type}`);
      log.info.gray(`    message:  ${err.message}`);
    });
  },
};
