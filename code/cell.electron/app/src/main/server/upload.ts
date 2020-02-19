import { app } from 'electron';
import { Client, constants, fs, log, t } from '../common';

type File = t.IClientCellFileUpload;

/**
 * Retrieve the set of files to upload.
 */
export async function getFiles(args: { sourceDir: string }) {
  const { sourceDir: dir } = args;
  const paths = await fs.glob.find(fs.resolve(`${dir}/**`));

  const wait = paths.map(async path => {
    const filename = path.substring(dir.length + 1);
    const data = await fs.readFile(path);
    const file: File = { filename, data };
    return file;
  });

  return Promise.all(wait);
}

/**
 * Upload files to the given target
 */
export async function upload(args: {
  sourceDir: string;
  targetCell?: string;
  files?: File[];
  silent?: boolean;
}) {
  const { sourceDir } = args;
  const targetCell = args.targetCell || constants.URI.UI_FILES;
  const files = args.files ? args.files : await getFiles({ sourceDir });

  const done = (ok: boolean) => {
    return { ok, files };
  };

  const host = constants.HOST;
  const client = Client.create(host);
  try {
    const res = await client.cell(targetCell).files.upload(files);

    if (!res.ok) {
      log.info.yellow(`Failed to upload files.`);
      log.info.gray('• packaged:', app.isPackaged);
      log.info.gray('• dir:     ', sourceDir);
      log.info.gray('• host:    ', host);
      log.info();
      return done(false);
    }

    if (!args.silent) {
      logUpload({ sourceDir: sourceDir, host, files });
    }

    return done(true);
  } catch (err) {
    if (err.message.includes('ECONNREFUSED')) {
      log.info.yellow(`Ensure the local CellOS server is online. ${log.gray(client.origin)}`);
      log.info();
    }
    return done(false);
  }
}

/**
 * Helpers
 */

function logUpload(args: { sourceDir: string; host: string; files: File[] }) {
  const { host, files, sourceDir } = args;
  const bytes = files.reduce((acc, next) => acc + next.data.byteLength, 0);
  const size = fs.size.toString(bytes);

  const table = log.table({ border: false });
  table.add([' • host', host]);
  table.add([' • cell', constants.URI.UI_FILES]);
  table.add([' • files: ']);

  const addFile = (file: File) => {
    const { filename, data } = file;
    const name = filename.endsWith('.map') ? log.gray(filename) : log.green(filename);
    const size = fs.size.toString(data.byteLength);
    table.add(['', name, size]);
  };
  files.filter(file => file.filename.endsWith('.map')).forEach(file => addFile(file));
  files.filter(file => !file.filename.endsWith('.map')).forEach(file => addFile(file));

  log.info(`

${log.blue(`uploaded`)}   ${log.gray(`(${size})`)}
${log.gray(`from:      ${sourceDir}`)}
${log.gray(`to:`)}
${log.gray(table)}
`);
}
