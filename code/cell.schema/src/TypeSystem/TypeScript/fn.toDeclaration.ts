import { t } from '../common';

/**
 * Generate a typescript declaration file.
 */
export function toDeclaration(args: { typename: string; types: t.ITypeDef[]; header?: string }) {
  const write = (args: { typename: string; types: t.ITypeDef[]; written: string[] }) => {
    const { written } = args;
    if (written.includes(args.typename)) {
      return '';
    }

    const lines = args.types.map(item => {
      const prop = item.prop;
      const type = typeof item.type === 'string' ? item.type : item.type.typename;
      const optional = item.optional ? '?' : '';
      return `  ${prop}${optional}: ${type};`;
    });

    let res = `
export declare type ${args.typename} = {
${lines.join('\n')}
};`.substring(1);

    written.push(args.typename);

    args.types
      .map(({ type }) => type as t.ITypeRef)
      .filter(type => type.kind === 'REF')
      .forEach(type => {
        const { typename, types } = type;
        const declaration = write({ typename, types, written }); // <== RECURSION 🌳
        if (declaration) {
          res = `${res}\n\n${declaration}`;
        }
      });

    return res;
  };

  let text = write({ ...args, written: [] });
  text = args.header ? `${args.header}\n\n${text}` : text;
  return `${text}\n`;
}