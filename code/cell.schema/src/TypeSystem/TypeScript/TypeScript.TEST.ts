import { expect, t } from '../test';
import { TypeScript } from '.';
import { ERROR_TYPENAME } from './fn.validate';

describe('TypeScript', () => {
  describe('TypeScript.primitives', () => {
    it('is immutable', () => {
      const test = (key: keyof t.ITypePrimitives) => {
        const res1 = TypeScript.primitives[key];
        const res2 = TypeScript.primitives[key];
        expect(res1).to.eql(res2);
        expect(res1).to.not.equal(res2);
      };
      test('string');
      test('number');
      test('boolean');
      test('null');
      test('undefined');
    });

    it('type: string', () => {
      const res = TypeScript.primitives.string;
      expect(res.kind).to.eql('VALUE');
      expect(res.typename).to.eql('string');
    });

    it('type: number', () => {
      const res = TypeScript.primitives.number;
      expect(res.kind).to.eql('VALUE');
      expect(res.typename).to.eql('number');
    });

    it('type: boolean', () => {
      const res = TypeScript.primitives.boolean;
      expect(res.kind).to.eql('VALUE');
      expect(res.typename).to.eql('boolean');
    });

    it('type: null', () => {
      const res = TypeScript.primitives.null;
      expect(res.kind).to.eql('VALUE');
      expect(res.typename).to.eql('null');
    });

    it('type: undefined', () => {
      const res = TypeScript.primitives.undefined;
      expect(res.kind).to.eql('VALUE');
      expect(res.typename).to.eql('undefined');
    });
  });

  describe('TypeScript.toDeclaration()', () => {
    const { string, boolean } = TypeScript.primitives;

    it('single type (no header)', () => {
      const typename = 'MyFoo';
      const types = [
        { prop: 'name', type: string },
        { prop: 'isEnabled', type: boolean, optional: true },
      ];

      const res = TypeScript.toDeclaration({ typename, types });
      expect(res).to.include(`export declare type MyFoo = {`);
      expect(res).to.include(`name: string;`);
      expect(res).to.include(`isEnabled?: boolean;`);
    });

    it('with header', () => {
      const header = `/**
 * My header
 */`;
      const typename = 'MyFoo';
      const types = [{ prop: 'name', type: string }];
      const res = TypeScript.toDeclaration({ typename, types, header });

      expect(res).to.include(header);
      expect(res).to.include(`export declare type MyFoo = {`);
      expect(res).to.include(`name: string;`);
    });

    it('multiple types (REF)', () => {
      const colorDef: t.ITypeRef = {
        kind: 'REF',
        scope: 'NS',
        uri: 'ns:foo.color',
        typename: 'MyColor',
        isArray: false,
        types: [
          { prop: 'name', type: string },
          { prop: 'hex', type: string },
        ],
      };

      const types = [
        { prop: 'title', type: string },
        { prop: 'color', type: colorDef, optional: true },
      ];

      const res = TypeScript.toDeclaration({ typename: 'MyOne', types });

      expect(res).to.include(`export declare type MyOne = {`);
      expect(res).to.include(`title: string;`);
      expect(res).to.include(`color?: MyColor;`);

      expect(res).to.include(`export declare type MyColor = {`);
      expect(res).to.include(`name: string;`);
      expect(res).to.include(`hex: string;`);
    });
  });

  describe('validate', () => {
    it('validate.objectTypename', () => {
      const test = (typename: string | undefined, err?: string) => {
        const res = TypeScript.validate.objectTypename(typename);
        const isValid = !err;
        expect(res.isValid).to.eql(isValid);
        expect(res.input).to.eql((typename || '').trim());
        if (err) {
          expect(res.error).to.include(err);
          expect(res.error).to.include(ERROR_TYPENAME);
        } else {
          expect(res.error).to.eql(undefined);
        }
      };

      // Valid.
      test('F');
      test('Foo');
      test(' Foo ');
      test('Foo1');
      test('FooBar');
      test('IThing');

      // Invalid
      test(undefined, 'Typename is empty');
      test('  ', 'Typename is empty');
      test('foo', 'Typename is lowercase');

      test('Fo.o', 'Typename contains invalid characters');
      test('Fo o', 'Typename contains invalid characters');
      test('Fo#o', 'Typename contains invalid characters');
      test('Fo!o', 'Typename contains invalid characters');
      test(' 1Foo', 'Typename starts with a number');
    });
  });

  describe('walk', () => {
    const refType: t.ITypeRef = {
      kind: 'REF',
      scope: 'NS',
      uri: 'fs:foo',
      typename: 'Foo',
      types: [],
    };

    it('non-deep types (primitives | ENUM | UNKNOWN)', () => {
      const test = (type: t.IType) => {
        const list: t.TypeVisitArgs[] = [];
        TypeScript.walk(type, e => list.push(e));
        expect(list).to.eql([]);
      };
      test({ kind: 'UNKNOWN', typename: 'Foo' });
      test({ kind: 'ENUM', typename: `"red"` });
      test({ kind: 'VALUE', typename: 'string' });
      test({ kind: 'VALUE', typename: 'number' });
      test({ kind: 'VALUE', typename: 'boolean' });
      test({ kind: 'VALUE', typename: 'null' });
      test({ kind: 'VALUE', typename: 'undefined' });
    });

    it('REF (empty)', () => {
      const list: t.TypeVisitArgs[] = [];
      TypeScript.walk(refType, e => list.push(e));
      expect(list).to.eql([]);
    });

    it('REF (deep)', () => {
      const types: t.ITypeDef[] = [
        { prop: 'name', type: { kind: 'VALUE', typename: 'string' }, optional: true },
        {
          prop: 'myRef',
          type: {
            ...refType,
            types: [
              {
                prop: 'child',
                type: {
                  ...refType,
                  types: [{ prop: 'grandchild', type: { kind: 'VALUE', typename: 'string' } }],
                },
              },
            ],
          },
        },
      ];
      const root = { ...refType, types };
      const list: t.TypeVisitArgs[] = [];

      TypeScript.walk(root, e => list.push(e));
      expect(list.length).to.eql(4);

      expect(list[0].level).to.eql(1);
      expect(list[0].root).to.eql(root);
      expect(list[0].prop).to.eql('name');
      expect(list[0].type.kind).to.eql('VALUE');
      expect(list[0].optional).to.eql(true);
      expect(list[0].path).to.eql('name');

      expect(list[1].level).to.eql(1);
      expect(list[1].root).to.eql(root);
      expect(list[1].prop).to.eql('myRef');
      expect(list[1].type.kind).to.eql('REF');
      expect(list[1].path).to.eql('myRef');

      expect(list[2].level).to.eql(2);
      expect(list[2].root).to.eql(root);
      expect(list[2].prop).to.eql('child');
      expect(list[2].type.kind).to.eql('REF');
      expect(list[2].path).to.eql('myRef.child');

      expect(list[3].level).to.eql(3);
      expect(list[3].root).to.eql(root);
      expect(list[3].prop).to.eql('grandchild');
      expect(list[3].type.kind).to.eql('VALUE');
      expect(list[3].path).to.eql('myRef.child.grandchild');
    });

    it('UNION (deep)', () => {
      const root: t.ITypeUnion = {
        kind: 'UNION',
        typename: 'MyRoot',
        types: [
          { kind: 'VALUE', typename: 'string' },
          {
            kind: 'UNION',
            typename: 'MyUnion',
            types: [
              { kind: 'ENUM', typename: '"red"' },
              { kind: 'ENUM', typename: '"green"' },
              {
                ...refType,
                typename: 'MyRef',
                types: [{ prop: 'color', type: { kind: 'VALUE', typename: 'number' } }],
              },
            ],
          },
        ],
      };
      const list: t.TypeVisitArgs[] = [];
      TypeScript.walk(root, e => list.push(e));

      expect(list.length).to.eql(6);

      expect(list[0].level).to.eql(1);
      expect(list[0].root).to.eql(root);
      expect(list[0].prop).to.eql(undefined);
      expect(list[0].path).to.eql('');
      expect(list[0].type.kind).to.eql('VALUE');
      expect(list[0].type.typename).to.eql('string');

      expect(list[1].level).to.eql(1);
      expect(list[1].root).to.eql(root);
      expect(list[1].prop).to.eql(undefined);
      expect(list[1].path).to.eql('');
      expect(list[1].type.kind).to.eql('UNION');
      expect(list[1].type.typename).to.eql('MyUnion');

      expect(list[2].level).to.eql(2);
      expect(list[2].root).to.eql(root);
      expect(list[2].prop).to.eql(undefined);
      expect(list[2].path).to.eql('');
      expect(list[2].type.kind).to.eql('ENUM');
      expect(list[2].type.typename).to.eql('"red"');

      expect(list[3].level).to.eql(2);
      expect(list[3].root).to.eql(root);
      expect(list[3].prop).to.eql(undefined);
      expect(list[3].path).to.eql('');
      expect(list[3].type.kind).to.eql('ENUM');
      expect(list[3].type.typename).to.eql('"green"');

      expect(list[4].level).to.eql(2);
      expect(list[4].root).to.eql(root);
      expect(list[4].prop).to.eql(undefined);
      expect(list[4].path).to.eql('');
      expect(list[4].type.kind).to.eql('REF');
      expect(list[4].type.typename).to.eql('MyRef');

      expect(list[5].level).to.eql(3);
      expect(list[5].root).to.eql(root);
      expect(list[5].prop).to.eql('color');
      expect(list[5].path).to.eql('color');
      expect(list[5].type.kind).to.eql('VALUE');
      expect(list[5].type.typename).to.eql('number');
    });
  });
});