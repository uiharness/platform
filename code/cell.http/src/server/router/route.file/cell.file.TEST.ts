import { createMock, expect, FormData, fs, http, t } from '../../../test';

describe('route: !A1/file', () => {
  it.skip('writes file to FS and updates model', async () => {
    const mock = await createMock();
    const url = mock.url('cell:foo!A1');
    const res = await http.get(url);
    await mock.dispose();

    console.log('-------------------------------------------');
    console.log('POST A1/file/kitten.js', res.json());

    /**
     * TODO
     * - file saved
     * - cell model updated
     * - namespace and cell hashes different
     * - change log.
     */
  });

  it.skip('reads a file (via /cell:foo!A1/files/kitten.js', async () => {
    // TODO 🐷
  });
});
