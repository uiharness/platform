import { BundleManifest, FileManifest } from '.';
import { expect, fs, SampleBundles, t } from '../../test';

describe('BundleManifest', function () {
  this.timeout(99999);

  const TMP = fs.resolve('./tmp/test/BundleManifest');
  const config = SampleBundles.simpleNode.config;
  const sourceDir = SampleBundles.simpleNode.outdir;

  before(async () => {
    const force = false;
    await SampleBundles.simpleNode.bundle(force);
  });

  beforeEach(() => fs.remove(TMP));

  it('filename', () => {
    expect(BundleManifest.filename).to.eql('index.json');
  });

  it('create', async () => {
    const model = config.toObject();
    const manifest = await BundleManifest.create({ model, sourceDir });
    const files = manifest.files;

    expect(files.length).to.greaterThan(0);
    expect(manifest.kind).to.eql('bundle');
    expect(manifest.hash).to.eql(FileManifest.hash(files));
    expect(manifest.hash).to.match(/^sha256-/);

    expect(manifest.bundle.mode).to.eql('production');
    expect(manifest.bundle.target).to.eql('node');
    expect(manifest.bundle.entry).to.eql('main.js');
    expect(manifest.files.length).to.greaterThan(2);

    const expectEvery = (fn: (file: t.ManifestFile) => boolean) => {
      expect(files.every((file) => fn(file))).to.eql(true);
    };

    const expectSome = (fn: (file: t.ManifestFile) => boolean) => {
      expect(files.some((file) => fn(file))).to.eql(true);
    };

    expectEvery((file) => file.filehash.startsWith('sha256-'));
    expectEvery((file) => file.bytes > 0);
    expectEvery((file) => file.path.length > 0);
    expectSome((file) => file.public !== undefined);
    expectSome((file) => file.allowRedirect !== undefined);
  });

  it('writeFile => readFile', async () => {
    const model = config.toObject();
    const manifest = await BundleManifest.create({ model, sourceDir });

    const path = fs.join(TMP, BundleManifest.filename);
    expect(await fs.pathExists(path)).to.eql(false);

    await BundleManifest.write({ manifest, dir: TMP });
    expect(await fs.pathExists(path)).to.eql(true);

    const read = await BundleManifest.read({ dir: TMP });
    expect(read.path).to.eql(path);
    expect(read.manifest).to.eql(manifest);
  });

  it('createAndSave', async () => {
    const path = fs.join(TMP, BundleManifest.filename);
    expect(await fs.pathExists(path)).to.eql(false);

    const model = config.toObject();
    const res = await BundleManifest.createAndSave({ model, sourceDir: TMP });
    expect(res.path).to.eql(path);

    const read = await BundleManifest.read({ dir: TMP });
    expect(read.path).to.eql(path);
    expect(read.manifest).to.eql(res.manifest);
  });
});
