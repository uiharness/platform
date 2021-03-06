import { R, coord } from '../../common';

/**
 * Generates test data at the given size.
 */
export function testData(args: { totalColumns: number; totalRows: number }) {
  const list = R.flatten(
    Array.from({ length: args.totalColumns }).map((v, column) => {
      return Array.from({ length: args.totalRows }).map((v, row) => {
        const key = coord.cell.toKey(column, row);
        return { key, value: key };
      });
    }),
  );

  return {
    list,
    get values() {
      return list.reduce((acc, next) => {
        acc[next.key] = next.value;
        return acc;
      }, {});
    },
  };
}
