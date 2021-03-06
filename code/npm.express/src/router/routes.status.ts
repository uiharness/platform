import { express, filesize, fs, getProcess, npm, t, value } from '../common';

const pkg = require('../../package.json'); // eslint-disable-line

export function create(args: { getContext: t.GetNpmRouteContext }) {
  const router = express.Router();

  /**
   * [POST] Updates the module to the latest version.
   */
  router.get('/status', async (req, res) => {
    try {
      type Query = {
        versions?: number;
        size?: boolean;
      };

      // Setup initial conditions.
      const query: Query = req.query;
      const queryKeys = Object.keys(query);
      const context = await args.getContext();
      const { name, downloadDir, prerelease, NPM_TOKEN } = context;

      // Retrieve status info.
      const { info, dir, isChanged } = await getStatus({
        name,
        downloadDir,
        prerelease,
        NPM_TOKEN,
      });

      // Determine process state.
      const process = getProcess(dir, NPM_TOKEN);
      const isRunning = process.isRunning;
      const status = isChanged ? 'UPDATE_PENDING' : 'LATEST';

      // Build status response.
      let response = { isRunning, status, prerelease, token: Boolean(NPM_TOKEN), ...info } as any;
      response = prerelease ? { ...response, prerelease } : response;

      // Retrieve version history.
      const showVersions = queryKeys.includes('versions') && req.query.versions !== 'false';

      if (showVersions) {
        let versions = await npm.getVersionHistory(name, { prerelease, NPM_TOKEN });
        let total = value.toNumber(req.query.versions);
        if (typeof total === 'number') {
          total = total < 0 ? 0 : total;
          versions = versions.slice(0, total);
        }
        response = { ...response, versions };
      }

      // Retrieve folder size.
      const showSize = queryKeys.includes('size') && req.query.size !== 'false';
      if (showSize) {
        const bytes = (await fs.size.dir(downloadDir)).bytes;
        const size = { bytes, display: filesize(bytes, { round: 0 }) };
        response = { ...response, size };
      }

      // Finish up.
      response = { ...response, 'npm.express': pkg.version };
      res.send(response);
    } catch (error) {
      res.send({ status: 500, error: error.message });
    }
  });

  // Finish up.
  return router;
}

/**
 * Retrieves status details.
 */
export async function getStatus(args: {
  name: string;
  downloadDir: string;
  prerelease: t.NpmPrerelease;
  NPM_TOKEN?: string;
}) {
  const { name, downloadDir, prerelease, NPM_TOKEN } = args;
  const dir = getDir(name, downloadDir);
  const pkg = npm.pkg(dir);
  const cwd = downloadDir;
  const latest = (await npm.getVersion(name, { cwd, prerelease, NPM_TOKEN })) || '-';
  const current = pkg.version || '-';
  const isChanged = current !== latest;
  const version = {
    current,
    latest,
  };
  const info = { name, version };
  return { info, dir, isChanged };
}

/**
 * Retrieve the path to the given module.
 */
export function getDir(name: string, downloadDir: string) {
  return fs.join(downloadDir, 'node_modules', name);
}
