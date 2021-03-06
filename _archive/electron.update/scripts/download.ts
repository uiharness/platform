import * as minimist from 'minimist';
import { Release } from '../src/main';

const argv = minimist(process.argv.slice(2));
const version = argv._[0];
const release = Release.create({
  version,
  baseUrl: 'https://platform.sfo2.digitaloceanspaces.com/electron.loader/releases',
  baseDir: './tmp/release',
});

(async () => {
  console.log(await release.remote());
  console.log('release.dir', release.dir);
  console.log('-------------------------------------------');

  await release.download({});
})();
