import { t, expect } from '../test';
import { NodeRuntime } from '.';

/**
 * NOTE:
 *    For all server/data related tests that exercise pulling
 *    bundles from a server see:
 *
 *        [@platform/cell.router]/src/tests/test.route/func.TEST.ts
 *
 *    Which spins up a mock server to test against.
 *
 */
describe('NodeRuntime', () => {
  it('✨✨ NOTE: See tests in [cell.router]', () => {
    //
  });

  it('create (init)', () => {
    const runtime = NodeRuntime.create();
    expect(runtime.name).to.eql('cell.runtime.node');
  });

  it('node version', () => {
    const runtime = NodeRuntime.create();
    const version = (process.version || '').replace(/^v/, '');
    expect(runtime.version).to.eql(version);
  });

  it('urls', () => {
    const bundle: t.RuntimeBundleOrigin = { host: 'domain.com', uri: 'cell:foo:A1', dir: 'v1' };
    const urls = NodeRuntime.urls(bundle);
    expect(urls.files).to.eql('https://domain.com/cell:foo:A1/fs?filter=v1/**');
    expect(urls.manifest).to.eql('https://domain.com/cell:foo:A1/fs/v1/index.json');
  });
});
