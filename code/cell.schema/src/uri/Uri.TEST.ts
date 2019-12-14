import { expect, t } from '../test';
import { Uri } from './Uri';

describe('Uri', () => {
  describe('ids', () => {
    it('Uri.cuid', () => {
      const res = Uri.cuid();
      expect(res.length).to.greaterThan(15);
    });

    it('Uri.slug', () => {
      const res = Uri.slug();
      expect(res.length).to.within(5, 10);
    });
  });

  describe('is', () => {
    it('is.uri', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.uri(input)).to.eql(expected);
      };

      test('ns:abcd', true);
      test('cell:abcd!A1', true);
      test('cell:abcd!1', true);
      test('cell:abcd!A', true);
      test('file:abcd.123', true);

      test(undefined, false);
      test('', false);
      test('ns:', false);
      test('row:', false);
      test('col:', false);
      test('cell:', false);
      test('file:', false);
      test('cell:abcd', false);
      test('row:abcd', false);
      test('col:abcd', false);
      test('file:abcd', false);
      test('file:abcd:123', false);
      test('file:abcd-123', false);
    });

    it('is.type', () => {
      const test = (type: t.UriType, input?: string, expected?: boolean) => {
        expect(Uri.is.type(type, input)).to.eql(expected, `${type} | input: ${input}`);
      };

      test('ns', 'ns:abcd', true);
      test('CELL', 'cell:abcd!A1', true);
      test('COLUMN', 'cell:abcd!A', true);
      test('ROW', 'cell:abcd!1', true);
      test('FILE', 'file:abc.123', true);
      test('UNKNOWN', 'foo:bar!1', true);

      test('ns', undefined, false);
      test('CELL', undefined, false);
      test('COLUMN', undefined, false);
      test('ROW', undefined, false);
      test('FILE', undefined, false);

      test('ns', '', false);
      test('CELL', '', false);
      test('COLUMN', '', false);
      test('ROW', '', false);
      test('FILE', '', false);
    });

    it('is.ns', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.ns(input)).to.eql(expected);
      };
      test('ns:abcd', true);
      test('', false);
      test(undefined, false);
      test('cell:abcd!A1', false);
      test('cell:abcd!1', false);
      test('cell:abcd!A', false);
    });

    it('is.file', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.file(input)).to.eql(expected);
      };
      test('file:abcd.123', true);
      test('file:abcd', false);
      test('ns:abcd', false);
      test('', false);
      test(undefined, false);
    });

    it('is.cell', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.cell(input)).to.eql(expected);
      };
      test('cell:abcd!A1', true);
      test('', false);
      test(undefined, false);
      test('ns:abcd', false);
      test('col:abcd!A', false);
    });

    it('is.row', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.row(input)).to.eql(expected);
      };
      test('cell:abcd!1', true);
      test('', false);
      test(undefined, false);
      test('ns:abcd', false);
      test('cell:abcd!A', false);
    });

    it('is.column', () => {
      const test = (input?: string, expected?: boolean) => {
        expect(Uri.is.column(input)).to.eql(expected);
      };
      test('cell:abcd!A', true);
      test('', false);
      test(undefined, false);
      test('ns:abcd', false);
      test('row:abcd!1', false);
    });
  });

  describe('parse', () => {
    it('ns', () => {
      const res = Uri.parse<t.INsUri>('ns:abcd');
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.parts.type).to.eql('ns');
      expect(res.parts.id).to.eql('abcd');
      expect(res.uri).to.eql('ns:abcd');
      expect(res.toString()).to.eql(res.uri);
    });

    it('cell', () => {
      const res = Uri.parse<t.ICellUri>('cell:abc!A1');
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.parts.type).to.eql('CELL');
      expect(res.parts.id).to.eql('abc!A1');
      expect(res.parts.ns).to.eql('abc');
      expect(res.parts.key).to.eql('A1');
      expect(res.uri).to.eql('cell:abc!A1');
      expect(res.toString()).to.eql(res.uri);
    });

    it('cell (row)', () => {
      const res = Uri.parse<t.IRowUri>('cell:abc!1');
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.parts.type).to.eql('ROW');
      expect(res.parts.id).to.eql('abc!1');
      expect(res.parts.ns).to.eql('abc');
      expect(res.parts.key).to.eql('1');
      expect(res.uri).to.eql('cell:abc!1');
      expect(res.toString()).to.eql(res.uri);
    });

    it('cell (column)', () => {
      const res = Uri.parse<t.IColumnUri>('cell:abc!A');
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.parts.type).to.eql('COLUMN');
      expect(res.parts.id).to.eql('abc!A');
      expect(res.parts.ns).to.eql('abc');
      expect(res.parts.key).to.eql('A');
      expect(res.uri).to.eql('cell:abc!A');
      expect(res.toString()).to.eql(res.uri);
    });

    it('file', () => {
      const res = Uri.parse<t.IFileUri>('file:abc.123');
      expect(res.ok).to.eql(true);
      expect(res.error).to.eql(undefined);
      expect(res.parts.type).to.eql('FILE');
      expect(res.parts.id).to.eql('abc.123');
      expect(res.parts.ns).to.eql('abc');
      expect(res.parts.file).to.eql('123');
      expect(res.uri).to.eql('file:abc.123');
      expect(res.toString()).to.eql(res.uri);
    });

    describe('error', () => {
      it('error: UNKNOWN', () => {
        const test = (input: string | undefined) => {
          const res = Uri.parse(input);
          expect(res.ok).to.eql(false);
          expect(res.parts.type).to.eql('UNKNOWN');
          expect(res.uri).to.eql((input || '').trim());
        };
        test(undefined);
        test('');
        test('   ');
        test('foo');
        test('foo:bar');
      });

      it('no ":" seperated parts', () => {
        const res = Uri.parse('foo');
        expect(res.ok).to.eql(false);
        expect(res.error && res.error.message).to.contain('Not a valid multi-part URI');
      });

      it('ns: no ID', () => {
        const test = (input?: string) => {
          const res = Uri.parse<t.INsUri>(input);
          expect(res.ok).to.eql(false);
          expect(res.error && res.error.message).to.contain('Namespace URI identifier not found');
        };
        test('ns:');
        test('ns: ');
      });

      it('cell: no namespace', () => {
        const test = (input: string) => {
          const res = Uri.parse<t.ICellUri>(input);
          expect(res.ok).to.eql(false);
          expect(res.error && res.error.message).to.contain(`ID of 'cell' not found`);
        };
        test('cell:');
        test('cell:  ');
        test('  cell:  ');
      });

      it('cell: no key', () => {
        const res = Uri.parse<t.ICellUri>('cell:abcd');
        expect(res.ok).to.eql(false);
        expect(res.error && res.error.message).to.contain(`URI does not contain a "!" character`);
        expect(res.parts.key).to.eql('');
        expect(res.parts.ns).to.eql('');
      });

      it('file', () => {
        const test = (input: string, error: string) => {
          const res = Uri.parse<t.IFileUri>(input);
          expect(res.ok).to.eql(false);
          expect(res.error && res.error.message).to.contain(error);
        };
        test('file:', 'File URI identifier not found');
        test('  file:  ', 'File URI identifier not found');
        test('file:foo', 'File identifier within namespace "foo" not found');
      });
    });
  });

  describe('create', () => {
    it('ns', () => {
      const test = (id: string, expected: string) => {
        const res = Uri.create.ns(id);
        expect(res).to.eql(expected);
      };
      test('foo', 'ns:foo');
      test('ns:foo', 'ns:foo');
      test(' ns::foo ', 'ns:foo');
      test('ns', 'ns:ns');
    });

    it('file', () => {
      const test = (ns: string, file: string, expected: string) => {
        const res = Uri.create.file(ns, file);
        expect(res).to.eql(expected);
      };
      test('foo', '123', 'file:foo.123');
      test(' foo ', ' 123 ', 'file:foo.123');
      test('file:foo', '123', 'file:foo.123');
    });

    it('cell', () => {
      const test = (ns: string, key: string, expected: string) => {
        const res = Uri.create.cell(ns, key);
        expect(res).to.eql(expected);
      };
      test('foo', 'A1', 'cell:foo!A1');
      test('foo', '!A1', 'cell:foo!A1');
      test('foo', '!!A1', 'cell:foo!A1');
    });

    it('row', () => {
      const test = (ns: string, key: string, expected: string) => {
        const res = Uri.create.row(ns, key);
        expect(res).to.eql(expected);
      };
      test('foo', '1', 'cell:foo!1');
      test('foo', '!1', 'cell:foo!1');
      test('foo', '!!1', 'cell:foo!1');
    });

    it('column', () => {
      const test = (ns: string, key: string, expected: string) => {
        const res = Uri.create.column(ns, key);
        expect(res).to.eql(expected);
      };
      test('foo', 'A', 'cell:foo!A');
      test('foo', '!A', 'cell:foo!A');
      test('foo', '!!A', 'cell:foo!A');
    });

    const ILLEGAL = {
      NS: '~`!@#$%^&*()_-+=,./?;|[]{}',
    };

    it('throws: ns', () => {
      expect(() => Uri.create.ns(':')).to.throw();
      expect(() => Uri.create.ns('ns:')).to.throw();
      expect(() => Uri.create.ns('  ns:  ')).to.throw();

      // Illegal characters.
      ILLEGAL.NS.split('').forEach(char => {
        const id = `ns:abc${char}def`;
        expect(() => Uri.create.ns(id)).to.throw();
      });
    });

    it('throws: file', () => {
      expect(() => Uri.create.file(':', 'fileid')).to.throw();
      expect(() => Uri.create.file('ns:', 'fileid')).to.throw();
      expect(() => Uri.create.file('  ns:  ', 'fileid')).to.throw();

      // Illegal namespace characters.
      ILLEGAL.NS.split('').forEach(char => {
        const ns = `ns:abc${char}def`;
        expect(() => Uri.create.file(ns, 'fileid')).to.throw();
      });

      // Illegal file-id characters.
      ILLEGAL.NS.split('').forEach(char => {
        const file = `abc${char}def`;
        expect(() => Uri.create.file('foo', file)).to.throw();
      });
    });

    it('throws: cell', () => {
      expect(() => Uri.create.cell('', 'A1')).to.throw();
      expect(() => Uri.create.cell('foo', '')).to.throw();
      expect(() => Uri.create.cell('foo', '!')).to.throw();
      expect(() => Uri.create.cell('foo', 'A')).to.throw();
      expect(() => Uri.create.cell('foo', '1')).to.throw();
    });

    it('throws: column', () => {
      expect(() => Uri.create.column('', 'A')).to.throw();
      expect(() => Uri.create.column('foo', '')).to.throw();
      expect(() => Uri.create.column('foo', '!')).to.throw();
      expect(() => Uri.create.column('foo', 'A1')).to.throw();
      expect(() => Uri.create.column('foo', '1')).to.throw();
    });

    it('throws: row', () => {
      expect(() => Uri.create.row('', '1')).to.throw();
      expect(() => Uri.create.row('foo', '')).to.throw();
      expect(() => Uri.create.row('foo', '!')).to.throw();
      expect(() => Uri.create.row('foo', 'A1')).to.throw();
      expect(() => Uri.create.row('foo', 'A')).to.throw();
    });
  });
});
