import { constants, t, value, R } from '../../common';
import { TypeScript } from '../TypeScript';
import { toTypescriptHeader } from './TypeClient.fn.typescript.header';
import { TypeValue } from '../TypeValue';
import { TypeTarget } from '../TypeTarget';

/**
 * Converts type definitions to valid typescript declarations.
 */
export function typescript(
  def: t.INsTypeDef | t.INsTypeDef[],
  options: { header?: boolean; exports?: boolean; imports?: boolean } = {},
) {
  const defs = Array.isArray(def) ? def : [def];
  const api: t.ITypeClientTypescript = {
    /**
     * Comments to insert at the head of the typescript.
     */
    get header() {
      const uri = R.uniq(defs.map(def => def.uri));

      const toPkg = (name?: string, version?: string) => {
        const pkg = { name: name || 'Unnamed', version: version || '0.0.0' };
        return pkg;
      };

      // The current module executing the code generator.
      const PKG = constants.PKG;
      const pkg = toPkg(PKG.name, PKG.version);

      // The current schema used to generate the code.
      return toTypescriptHeader({ uri, pkg });
    },

    /**
     * Generated typescript declarations(s).
     */
    get declaration() {
      const header = value.defaultValue(options.header, true) ? api.header : undefined;

      let isRefUsed = false;
      const addedTypenames: string[] = [];

      const toDeclaration = (typename: string) => {
        const def = defs.find(def => def.typename === typename);
        if (!def) {
          return '';
        }
        return TypeScript.toDeclaration({
          typename,
          exports: options.exports,
          types: def.columns,
          filterType: e => {
            const exists = addedTypenames.includes(e.typename);
            addedTypenames.push(e.typename);
            return !exists;
          },
          adjustLine(e) {
            const target = e.typeDef.target;
            const typename = TypeValue.toTypename(e.type, {
              adjust(line) {
                if (line.type.kind === 'REF' && TypeTarget.isRef(target)) {
                  const T = line.type.typename;
                  const name = line.type.isArray
                    ? `t.ITypedSheetRefs<${T}>`
                    : `t.ITypedSheetRef<${T}>`;
                  line.adjust(name);
                  isRefUsed = true;
                }
              },
            });
            if (typename !== e.typename) {
              e.adjust(`${e.prop}${e.optional}: ${typename}`);
            }
          },
        });
      };

      const typenames = R.uniq(defs.map(def => def.typename));
      const code = typenames.map(typename => toDeclaration(typename)).join('\n');
      const imports = options.imports !== false ? `import * as t from '@platform/cell.types';` : '';

      let res = '';
      res = !header ? res : `${res}\n${header}\n`;
      res = !isRefUsed || !imports ? res : `${res}\n${imports}\n`;
      res = `${res}\n${code}`;
      res = res[0] === '\n' ? res.substring(1) : res; // NB: Trim first new-line.
      res = res.replace(/\n{3,}/g, '\n\n'); // NB: collapse any multi-line spaces.
      res = res.replace(/\n*$/, '');
      res = res.length > 0 ? `${res}\n` : res;

      return res;
    },

    /**
     * Save the typescript declarations as a binary file.
     */
    async save(fs: t.IFs, path: string) {
      const errors = defs.reduce((acc, next) => [...acc, ...next.errors], [] as t.ITypeError[]);
      if (errors.length > 0) {
        const lines = errors.map((err, i) => `${i + 1}) ${err.message}`).join('\n');
        throw new Error(`Cannot save definition to typescript as it contains errors:\n${lines}`);
      }

      path = preparePath(path);
      await fs.ensureDir(fs.dirname(path));

      const text = api.toString({ path });
      await fs.writeFile(path, text);

      return { path, text };
    },

    toString(options: { path?: string } = {}) {
      const { path } = options;
      let text = api.declaration;
      if (path) {
        const filename = path.substring(path.lastIndexOf('/') + 1);
        text = text.replace(/\<filename\>\.ts/g, filename);
      }
      return text;
    },
  };

  return api;
}

/**
 * [Helpers]
 */

function preparePath(path: string) {
  path = path.endsWith('.ts') ? path : `${path}.ts`;
  return path;
}
