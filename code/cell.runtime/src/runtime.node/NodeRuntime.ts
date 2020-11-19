import { exec } from '@platform/exec';

import { fs, HttpClient, log, logger, Schema, t, path } from './common';

const IS_CLOUD = Boolean(process.env.VERCEL_URL);
const TMP = IS_CLOUD ? '/tmp' : fs.resolve('tmp');
const CACHE_DIR = fs.join(TMP, 'runtime.node');
const MANIFEST_FILENAME = 'index.json';

/**
 * Runtime environment for executing bundles on [node-js].
 */
export const NodeRuntime = (args: { host: string; uri: string; dir?: string }) => {
  const { uri, host } = args;
  const dir = path.dir(args.dir);
  const client = HttpClient.create(host).cell(uri);

  const runtime = {
    get url() {
      const urls = Schema.urls(host).cell(uri);
      return {
        files: urls.files.list.query({ filter: `${dir.path}/**` }),
        manifest: urls.file.byName(path.dir(dir.path).append(MANIFEST_FILENAME)),
      };
    },

    get cachedir() {
      const hostname = host
        .replace(/^http:\/\//, '')
        .replace(/^https:\/\//, '')
        .replace(/\:/g, '-');
      return fs.join(CACHE_DIR, hostname, uri.replace(/\:/g, '-'));
    },

    /**
     * Determine if the bundle files exist locally.
     */
    async existsLocally() {
      return fs.pathExists(dir.prepend(runtime.cachedir));
    },

    /**
     * Download the bundle locally from the network.
     */
    async pull(options: { silent?: boolean } = {}) {
      const { silent } = options;
      const cachedir = runtime.cachedir;
      const bundleDir = dir.prepend(cachedir);
      await fs.remove(bundleDir);

      if (!silent) {
        const url = runtime.url.manifest;
        const from = logger.format.url(url.toString());
        const to = path.trimBase(bundleDir);
        const table = log.table({ border: false });

        const add = (key: string, value: string) => {
          table.add([log.gray(` • ${log.white(key)}`), log.gray(value)]);
        };
        add('from', from);
        add('to', to);

        log.info();
        log.info.gray(`pulling bundle`);
        table.log();
        log.info();
      }

      let count = 0;
      const list = await client.files.list({ filter: dir.append('**') });
      await Promise.all(
        list.body.map(async (file) => {
          const res = await client.file.name(file.path).download();
          if (typeof res.body === 'object') {
            count++;
            const path = fs.join(cachedir, file.path);
            await fs.stream.save(path, res.body as any);
          }
        }),
      );

      if (!silent) {
        const size = (await fs.size.dir(bundleDir)).toString({ round: 0 });
        log.info.gray(`${log.green(count)} files pulled (${log.yellow(size)})`);
        logger.hr().newline();
      }
    },

    /**
     * Pull and run.
     */
    async run(options: { pull?: true; silent?: boolean } = {}) {
      const { silent } = options;
      const cachedir = runtime.cachedir;
      const exists = await runtime.existsLocally();
      const isPullRequired = !exists || options.pull;

      if (isPullRequired) {
        await runtime.pull({ silent });
      }

      const manifestPath = fs.join(dir.prepend(cachedir), MANIFEST_FILENAME);
      if (!(await fs.pathExists(manifestPath))) {
        throw new Error(`A bundle manifest does not exist [${host}/${uri}].`);
      }
      const manifest = (await fs.readJson(manifestPath)) as t.BundleManifest;

      if (!silent) {
        const size = fs.size.toString(manifest.bytes, { round: 0 });
        const table = log.table({ border: false });
        const add = (key: string, value: string) => {
          table.add([log.green(key), log.gray(value)]);
        };

        add('runtime', 'node');
        add('target', `${manifest.target}, ${manifest.mode}`);
        add('source ', logger.format.url(runtime.url.files.toString()));
        add('entry', manifest.entry);
        add('size', `${log.yellow(size)} (${manifest.files.length} files)`);

        table.log();
        logger.hr().newline();
      }

      const cmd = `node ${manifest.entry}`;
      const cwd = dir.prepend(cachedir);
      const res = await exec.command(cmd).run({ cwd, silent });

      if (!silent) {
        const code = res.code === 0 ? log.green(0) : log.red(res.code);
        log.info();
        log.info.gray(`status code: ${code}`);

        if (res.errors) {
          const errors = res.errors.map((message) => ({ message }));
          logger.errors(errors);
        }
      }
    },
  };

  return runtime;
};