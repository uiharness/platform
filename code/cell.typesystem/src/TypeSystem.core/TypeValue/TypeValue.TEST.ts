import { expect, t } from '../../test';
import { TypeValue } from '.';

describe('TypeValue', () => {
  describe('is (flags)', () => {
    it('isRef', () => {
      const test = (input: any, expected: boolean) => {
        expect(TypeValue.isRef(input)).to.eql(expected);
      };

      test(undefined, false);
      test({}, false);
      test('', false);
      test('  ', false);
      test('string', false);
      test('  boolean  ', false);

      test('ns:foo', true);
      test('ns:foo/MyThing', true);
      test('  ns:foo  ', true);
      test('  ns:foo/MyThing  ', true);
      test('ns:foo[]', true);
      test('ns:foo/MyThing[]', true);
    });

    it('isArray: eg. "string[]" or "(string | ns:foo)[]"', () => {
      const test = (input: any, expected: boolean) => {
        const res = TypeValue.isArray(input);
        if (!res === expected) {
          throw new Error(`Fail: ${input}`);
        }
      };

      test(undefined, false);
      test({}, false);
      test('', false);
      test('  ', false);
      test('string', false);
      test('  boolean  ', false);
      test('Array<number>', false); // Never valid - syntax not supported.

      test('string []', false); // Space before "[]".
      test('string[ ]', false); // Space within "[ ]".

      test('string[]', true);
      test('  boolean[]  ', true); // Space trimmed.
      test('ns:foo[]', true);

      test('(string | number)[]', true);
      test('(string|boolean)[]', true); // No spaces (correct, but not great formatting).
      test('(string[] | number)[]', true);
      test('(string | ns:foo)[]', true);
      test('(string | (boolean | number)[])[]', true);
      test('(string | ("red" | "green"))[]', true);
      test('(string | ("red" | "green")[] | number)[]', true);
      test('(string | ns:foo[] | ns:bar)[]', true);

      test(`"red"[]`, true);
      test(`'red'[]`, true);

      // Invalid: empty.
      test('()[]', false);
      test('(  )[]', false);
    });

    it('isGroup', () => {
      const test = (input: any, expected: boolean) => {
        expect(TypeValue.isGroup(input)).to.eql(expected);
      };

      test(undefined, false);
      test({}, false);
      test('', false);
      test('  ', false);
      test('string', false);
      test('  boolean  ', false);

      test('(string)', true);
      test('  (string | boolean)  ', true);
      test('(ns:foo | boolean)[] ', true);

      test('()', true);
      test('(  )', true);
      test('()[]', true);
      test('(  )[]', true);
    });

    it('isPrimitive', () => {
      const test = (input: any, expected: boolean) => {
        const res = TypeValue.isPrimitive(input);
        expect(res).to.eql(expected);
      };
      test(undefined, true);
      test(null, true);
      test('', true);
      test('hello', true);
      test(123, true);
      test(true, true);
      test(false, true);

      test({}, false);
    });
  });

  describe('trim', () => {
    it('trimArray', () => {
      const test = (input: any, expected: string) => {
        const res = TypeValue.trimArray(input);
        expect(res).to.eql(expected, input);
      };
      test(undefined, '');
      test({}, '');
      test('', '');
      test('  ', '');
      test(' string[] ', 'string');
      test(' (string | boolean)[] ', '(string | boolean)');
    });

    it('trimQuotes', () => {
      const test = (input: any, expected: string) => {
        const res = TypeValue.trimQuotes(input);
        expect(res).to.eql(expected, input);
      };
      test(undefined, '');
      test({}, '');
      test('', '');
      test(' ', '');
      test(`'red'`, `red`);
      test(`"red"`, `red`);
      test(`  "red"  `, `red`);
    });

    it('trimParentheses', () => {
      const test = (input: any, expected: string) => {
        const res = TypeValue.trimParentheses(input);
        expect(res).to.eql(expected, input);
      };
      test(undefined, '');
      test({}, '');
      test('', '');
      test(' ', '');
      test('()', '');
      test('(  )', '');
      test('(foo)', 'foo');
      test('(  foo  )', 'foo');
      test('(string | boolean)', 'string | boolean');
      test('  (  string | boolean  )  ', 'string | boolean');
    });
  });

  describe('toType', () => {
    it('empty (UNKNOWN)', () => {
      const test = (input?: any) => {
        const res = TypeValue.toType(input);
        expect(res.kind).to.eql('UNKNOWN');
        expect(res.typename).to.eql('');
      };
      test('');
      test('  ');
      test();
      test(null);
      test({});
    });

    describe('VALUE', () => {
      const test = (input: string, isArray?: boolean) => {
        const res = TypeValue.toType(`  ${input}  `);
        expect(res.kind).to.eql('VALUE');
        expect(res.typename).to.eql(TypeValue.trimArray(input));
        expect(res.isArray).to.eql(isArray);
      };

      it('string', () => {
        test('string');
        test('string[]', true);
      });

      it('boolean', () => {
        test('boolean');
        test('boolean[]', true);
      });

      it('number', () => {
        test('number');
        test('number[]', true);
      });

      it('null', () => {
        test('null');
        test('null[]', true);
      });

      it('undefined', () => {
        test('undefined');
        test('undefined[]', true);
      });
    });

    describe('ENUM', () => {
      it('ENUM (single)', () => {
        const test = (input: any, typename: string, isArray?: boolean) => {
          const res = TypeValue.toType(input);
          expect(res.kind).to.eql('ENUM');
          expect(res.typename).to.eql(typename);
          expect(res.isArray).to.eql(isArray);
        };
        test(`"red"`, `'red'`);
        test(`'blue'`, `'blue'`);
        test(`'  blue  '`, `'blue'`);
        test(`"red"[]`, `'red'`, true);
      });

      it('ENUM (union)', () => {
        const res = TypeValue.toType(`'red' | "blue" | 'green'[]`);

        expect(res.kind).to.eql('UNION');
        expect(res.typename).to.eql(`'red' | 'blue' | 'green'[]`);

        if (res.kind === 'UNION') {
          expect(res.types.every((t) => t.kind === 'ENUM')).to.eql(true);
          expect(res.types.length).to.eql(3);
          expect(res.types[0].typename).to.eql(`'red'`);

          expect(res.types[1].typename).to.eql(`'blue'`);

          expect(res.types[2].typename).to.eql(`'green'`);
          expect(res.types[2].isArray).to.eql(true);
        }
      });
    });

    describe('REF', () => {
      it('kind: UNKNOWN (not a NS or COLUMN)', () => {
        const res = TypeValue.toType('cell:foo:A1');
        expect(res.kind).to.eql('UNKNOWN');
        expect(res.typename).to.eql('cell:foo:A1');
      });

      const test = (
        input: string,
        scope: t.ITypeRef['scope'],
        uri: string,
        typename: string,
        isArray?: boolean,
      ) => {
        const res = TypeValue.toType(input);
        expect(res.kind).to.eql('REF');
        if (res.kind === 'REF') {
          expect(res.uri).to.eql(uri);
          expect(res.scope).to.eql(scope);
          expect(res.typename).to.eql(typename);
          expect(res.types).to.eql([]); // NB: Populated elsewhere.
          expect(res.isArray).to.eql(isArray);
        }
      };

      it('scope: NS', () => {
        test('ns:foo', 'NS', 'ns:foo', '');
        test(' ns:foo ', 'NS', 'ns:foo', '');
        test('ns:foo/MyThing ', 'NS', 'ns:foo', 'MyThing');
      });

      it('scope: NS (array)', () => {
        test('ns:foo[]', 'NS', 'ns:foo', '', true);
        test(' ns:foo[] ', 'NS', 'ns:foo', '', true);
        test('ns:foo/MyThing[]', 'NS', 'ns:foo', 'MyThing', true);
      });

      it('scope: COLUMN', () => {
        test('cell:foo:A', 'COLUMN', 'cell:foo:A', '');
        test(' cell:foo:A ', 'COLUMN', 'cell:foo:A', '');
        test('cell:foo:A/MyThing ', 'COLUMN', 'cell:foo:A', 'MyThing');
      });

      it('scope: COLUMN (array)', () => {
        test('cell:foo:A[]', 'COLUMN', 'cell:foo:A', '', true);
        test(' cell:foo:A[] ', 'COLUMN', 'cell:foo:A', '', true);
        test('cell:foo:A/MyThing[] ', 'COLUMN', 'cell:foo:A', 'MyThing', true);
      });
    });
  });

  describe('parse', () => {
    it('returns input', () => {
      const test = (input?: string) => {
        const res = TypeValue.parse(input);
        expect(res.input).to.eql((input || '').trim());
      };
      test();
      test('string');
      test('  string  ');
      test('string[]');
      test('ns:foo');
      test('ns:foo[]');
    });

    it('UNKNOWN', () => {
      const test = (input: any, isArray?: boolean) => {
        const res = TypeValue.parse(input).type;
        const typename = (typeof input === 'string' ? input || '' : '').trim();
        expect(res.kind).to.eql('UNKNOWN');
        expect(res.typename).to.eql(typename);
        expect(res.isArray).to.eql(isArray);
      };
      test(undefined);
      test(null);
      test({});
      test(123);
      test(true);
      test('');
      test('  ');

      // Case-sensitive (so unknown).
      test('STRING');
      test('BOOLEAN');
      test('NUMBER');
      test('NULL');
      test('UNDEFINED');

      test('String');
      test('Boolean');
      test('Number');
      test('Null');
      test('Undefined');

      test('STRING[]', true);

      test('string[][]'); // NB: Multi-dimensional arrays not supported.
    });

    it('VALUE', () => {
      const test = (input: string, isArray?: boolean) => {
        const res = TypeValue.parse(input).type;
        expect(res.kind).to.eql('VALUE');
        expect(res.typename).to.eql(TypeValue.trimArray(input.trim()));
        expect(res.isArray).to.eql(isArray);
      };

      test('string');
      test('boolean');
      test('number');
      test('null');
      test('undefined');

      test('  string   ');

      test(' string[] ', true);
      test('boolean[]', true);
      test('number[]', true);
      test('null[]', true);
      test('undefined[]', true);
    });

    it('VALUE (single grouped value)', () => {
      const test = (input: string, typename: string, isArray?: boolean) => {
        const res = TypeValue.parse(input);
        expect(res.type.kind).to.eql('VALUE');
        expect(res.type.typename).to.eql(typename);
        expect(res.type.isArray).to.eql(isArray);
      };
      test('(string)', 'string');
      test('(string)[]', 'string[]', true);
    });

    it('REF', () => {
      const test = (input: string, uri: string, typename: string, isArray?: boolean) => {
        const res = TypeValue.parse(input);
        expect(res.type.kind).to.eql('REF');
        expect(res.type.isArray).to.eql(isArray);
        if (res.type.kind === 'REF') {
          expect(res.type.uri).to.eql(uri);
          expect(res.type.typename).to.eql(typename);
          expect(res.type.types).to.eql([]);
        }
      };
      test('ns:foo', 'ns:foo', '');
      test('  ns:foo  ', 'ns:foo', '');
      test('ns:foo[]', 'ns:foo', '', true); // NB: Trims array suffix.

      test('ns:foo/MyThing', 'ns:foo', 'MyThing');
      test('ns:foo/MyThing[]', 'ns:foo', 'MyThing', true);
    });

    describe('UNION', () => {
      it('UNION', () => {
        const res = TypeValue.parse(`string | number[] | "red" | 'blue'[]`).type;
        expect(res).to.eql({
          kind: 'UNION',
          typename: `string | number[] | 'red' | 'blue'[]`,
          types: [
            { kind: 'VALUE', typename: 'string' },
            { kind: 'VALUE', typename: 'number', isArray: true },
            { kind: 'ENUM', typename: `'red'` },
            { kind: 'ENUM', typename: `'blue'`, isArray: true },
          ],
        });
      });

      it('UNION (namespace array)', () => {
        const res = TypeValue.parse(`string | ns:foo[]`).type;

        // NB: The URI is stored on the child REF without the array ("[]") notation
        //     whilst the UNION's typename correctly retains the "ns:foo[]" array suffix.
        expect(res).to.eql({
          kind: 'UNION',
          typename: 'string | ns:foo[]',
          types: [
            { kind: 'VALUE', typename: 'string' },
            { kind: 'REF', uri: 'ns:foo', scope: 'NS', typename: '', isArray: true, types: [] },
          ],
        });
      });

      it('UNION (two groups)', () => {
        const typename = '(string | number) | (boolean | ns:foo)[]';
        const res = TypeValue.parse(typename).type;

        expect(res.kind).to.eql('UNION');
        expect(res.isArray).to.eql(undefined);
        if (res.kind === 'UNION') {
          expect(res.types.length).to.eql(2);
          expect(res.types[0]).to.eql({
            kind: 'UNION',
            typename: 'string | number',
            types: [
              { kind: 'VALUE', typename: 'string' },
              { kind: 'VALUE', typename: 'number' },
            ],
          });

          expect(res.types[1]).to.eql({
            kind: 'UNION',
            typename: '(boolean | ns:foo)[]',
            types: [
              { kind: 'VALUE', typename: 'boolean' },
              { kind: 'REF', uri: 'ns:foo', scope: 'NS', typename: '', types: [] },
            ],
            isArray: true,
          });
        }
      });

      it('UNION (aggregate array)', () => {
        const res = TypeValue.parse(`(string | number[] | "red")[]`).type;
        expect(res).to.eql({
          kind: 'UNION',
          typename: `(string | number[] | 'red')[]`,
          types: [
            { kind: 'VALUE', typename: 'string' },
            { kind: 'VALUE', typename: 'number', isArray: true },
            { kind: 'ENUM', typename: `'red'` },
          ],
          isArray: true,
        });
      });
    });
  });

  describe('tokenize', () => {
    it('token.next: (variants)', () => {
      const test = (
        input: string,
        kind: 'VALUE' | 'GROUP' | 'GROUP[]',
        text: string,
        next: string,
      ) => {
        const res = TypeValue.token.next(input);
        expect(res.input).to.eql(input);
        expect(res.kind).to.eql(kind);
        expect(res.text).to.eql(text);
        expect(res.next).to.eql(next);
      };

      // Non-group (VALUE).
      test(`string`, 'VALUE', `string`, ``);
      test(`  string  `, 'VALUE', `string`, ``);
      test(` |string  |   `, `VALUE`, `string`, ``);
      test(`string[]`, 'VALUE', `string[]`, ``);
      test(`number[]`, 'VALUE', `number[]`, ``);
      test(`string[][]`, 'VALUE', `string[][]`, ``);
      test(`  boolean[] `, 'VALUE', `boolean[]`, ``);
      test(`string | boolean | number|`, 'VALUE', `string`, `boolean | number`);
      test(`string | "red" | 'blue'`, 'VALUE', `string`, `"red" | 'blue'`);
      test(`boolean   |   (string | number)`, `VALUE`, `boolean`, `(string | number)`);

      test(`"red"`, `VALUE`, `"red"`, ``);
      test(`  'red'  `, `VALUE`, `'red'`, ``);
      test(`'red' | "green" |`, `VALUE`, `'red'`, `"green"`);

      // Group.
      test(`()`, `GROUP`, ``, ``);
      test(`(string)`, `GROUP`, `string`, ``);
      test(`(string[])`, `GROUP`, `string[]`, ``);
      test(`(string)[]`, `GROUP[]`, `string`, ``);
      test(`(string[])[]`, `GROUP[]`, `string[]`, ``);
      test(`(string | "red")[]`, `GROUP[]`, `string | "red"`, ``);

      test(` (string | boolean[]) | number| `, `GROUP`, `string | boolean[]`, `number`);
      test(` (string | boolean)[] | number| `, `GROUP[]`, `string | boolean`, `number`);

      test(`(string | (boolean | (number)))`, `GROUP`, `string | (boolean | (number))`, ``);

      test(`null | (string | number)`, `VALUE`, `null`, `(string | number)`);
      test(`null[] | (string | number)`, `VALUE`, `null[]`, `(string | number)`);

      test(`(string) | (boolean)`, `GROUP`, `string`, `(boolean)`);
      test(`(string) | boolean`, `GROUP`, `string`, `boolean`);
      test(`(string[]) | (boolean)`, `GROUP`, `string[]`, `(boolean)`);
      test(`(string)[] | (boolean)`, `GROUP[]`, `string`, `(boolean)`);
    });

    it('token.next: group after value: "null | (string | number)"', () => {
      const res = TypeValue.token.next(`null | (string | number)`);
      expect(res.kind).to.eql('VALUE');
      expect(res.text).to.eql('null');
      expect(res.next).to.eql('(string | number)');
    });

    it('token.next: two root-level groups', () => {
      const res1 = TypeValue.token.next(`(string | (number)[]) | (boolean | ns:foo)[]`);
      expect(res1.kind).to.eql('GROUP');
      expect(res1.text).to.eql('string | (number)[]');
      expect(res1.next).to.eql('(boolean | ns:foo)[]');

      const res2 = TypeValue.token.next(res1.next);
      expect(res2.kind).to.eql('GROUP[]');
      expect(res2.text).to.eql('boolean | ns:foo');
      expect(res2.next).to.eql('');
    });
  });

  describe('toTypename', () => {
    const toTypename = TypeValue.toTypename;

    it('string', () => {
      expect(toTypename('string')).to.eql('string');
      expect(toTypename(`"red"`)).to.eql(`'red'`);
    });

    it('isArray', () => {
      const type: t.ITypeValue = { kind: 'VALUE', typename: 'string' };
      expect(toTypename({ ...type })).to.eql('string');
      expect(toTypename({ ...type, isArray: true })).to.eql('string[]');
    });

    it('union', () => {
      const union: t.ITypeUnion = {
        kind: 'UNION',
        typename: '',
        types: [
          { kind: 'ENUM', typename: `"red"` },
          { kind: 'ENUM', typename: `"green"`, isArray: true },
          { kind: 'REF', typename: ``, uri: 'ns:foo', scope: 'NS', types: [] }, // NB: Typename not resolved yet.
          { kind: 'REF', typename: `MyFoo`, uri: 'ns:foo', scope: 'NS', types: [] },
          { kind: 'VALUE', typename: `string` },
        ],
      };
      const res1 = toTypename(union);
      const res2 = toTypename({ ...union, isArray: true });
      expect(res1).to.eql(`'red' | 'green'[] | ns:foo | MyFoo | string`);
      expect(res2).to.eql(`('red' | 'green'[] | ns:foo | MyFoo | string)[]`);
    });

    it('grouping', () => {
      const union: t.ITypeUnion = {
        kind: 'UNION',
        typename: '',
        types: [
          { kind: 'VALUE', typename: `boolean` },
          {
            kind: 'UNION',
            typename: '',
            types: [
              { kind: 'REF', typename: '', uri: 'ns:foo', scope: 'NS', types: [] },
              { kind: 'VALUE', typename: `string` },
            ],
          },
        ],
      };
      expect(toTypename(union)).to.eql('boolean | (ns:foo | string)');
      expect(toTypename({ ...union, isArray: true })).to.eql('(boolean | (ns:foo | string))[]');
    });

    it('adjust (handler)', () => {
      const union: t.ITypeUnion = {
        kind: 'UNION',
        typename: '',
        types: [
          { kind: 'VALUE', typename: `boolean` },
          {
            kind: 'UNION',
            typename: '',
            types: [
              { kind: 'REF', typename: 'MyThing', uri: 'ns:foo', scope: 'NS', types: [] },
              { kind: 'VALUE', typename: `string` },
            ],
          },
        ],
      };

      const res = toTypename(union, {
        adjust(e) {
          if (e.type.kind === 'REF') {
            e.adjust(`Promise<${e.type.typename}>`);
          }
        },
      });
      expect(res).to.eql(`boolean | (Promise<MyThing> | string)`);
    });
  });
});
