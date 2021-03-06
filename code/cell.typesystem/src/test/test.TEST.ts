import { fs, stub, TYPE_DEFS } from '.';
import { TypeClient } from '../TypeSystem.core/TypeClient';
import { expect } from 'chai';

describe('test', () => {
  describe('TypeSystem: generate sample typescript declaration files', () => {
    const dir = fs.join(__dirname, '../test/.d.ts');

    const loadDefs = async (ns: string) => {
      ns = ns.trim().replace(/^ns\:/, '');
      const fetch = stub.fetch({ defs: TYPE_DEFS });
      const defs = (await TypeClient.load({ ns, fetch })).defs;
      return defs;
    };

    const save = async (ns: string) => {
      const defs = await loadDefs(ns);
      const ts = TypeClient.typescript(defs);
      await ts.save(fs, fs.join(dir, ns));
    };

    it('save: test/foo.ts', async () => save('foo'));
    it('save: test/foo.primitives.ts', async () => save('foo.primitives'));
    it('save: test/foo.messages.ts', async () => save('foo.messages'));
    it('save: test/foo.enum.ts', async () => save('foo.enum'));
    it('save: test/foo.defaults.ts', async () => save('foo.defaults'));
    it('save: test/foo.multi.ts', async () => save('foo.multi'));

    it('save: [all]', async () => {
      const uris = [
        'foo',
        'foo.primitives',
        'foo.messages',
        'foo.enum',
        'foo.defaults',
        'foo.multi',
      ];
      const defs = (await Promise.all(uris.map((ns) => loadDefs(ns)))).flat();
      const ts = TypeClient.typescript(defs);
      await ts.save(fs, fs.join(dir, 'all.ts'));
    });
  });

  describe('fetch', () => {
    const fetch = stub.fetch({
      defs: TYPE_DEFS,
      cells: {
        A1: { value: 'A1' },
        A2: { value: 'A2' },
        B1: { value: 'B1' },
        B5: { value: 'B5' },
        C1: { value: 'C1' },
        Z9: { value: 'Z9' },
      },
    });

    it('getCells', async () => {
      const res = await fetch.getCells({ ns: 'foo', query: 'A1:ZZ99' });
      const cells = res.cells || {};
      expect(res.total.rows).to.eql(9);
      expect(Object.keys(cells).sort()).to.eql(['A1', 'A2', 'B1', 'B5', 'C1', 'Z9']);
    });

    it('getCells: query (filter result)', async () => {
      const res = await fetch.getCells({ ns: 'foo', query: 'A1:B4' });
      const cells = res.cells || {};
      expect(res.total.rows).to.eql(9);
      expect(Object.keys(cells).sort()).to.eql(['A1', 'A2', 'B1']);
    });
  });
});
