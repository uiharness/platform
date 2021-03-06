import { t } from '../common';

const CELLS: t.IGridData['cells'] = {
  A1: { value: '=A5' },
  A2: { value: '123', props: { style: { bold: true } } },
  A3: { value: 'A3 `code`' },
  A5: { value: '=A2', props: { merge: { colspan: 2 } } },
  A6: { value: '=SUM(1, A5, C4)' },
  A8: { value: '=SUM(1,2)' },
  A9: { value: '=1+2+5' },
  A10: { value: '=1+B10+B10' },

  // Circular-ref loop (error).
  A14: { value: '=A15' },
  A15: { value: '=A14' },
  A16: { value: '=A15' },
  A18: { value: '=A18' },
  A19: { value: '=A18' },

  B10: { value: '5' },
  A11: { value: '=SUM(1,B11,B11)' },
  B11: { value: '10' },
  B1: { value: 'locked' },
  B2: { value: 'cancel' },
  C1: {
    value: 'Yo',
    links: { main: 'ns:sample2' },
    props: {
      view: {
        cell: { type: 'MyView', className: 'my-foo' },
        screen: { type: 'MyScreen', className: 'my-screen' },
      },
    },
  },
  C2: {
    value: 'Child Namespace',
    props: {
      view: { screen: { type: 'GRID' } },
    },
  },
  C4: { value: 'Hello' },
  C5: { value: 'Hello', props: { merge: { rowspan: 2 } } },
};

const COLUMNS: t.IGridData['columns'] = {
  A: { props: { grid: { width: 250 } } },
};

const ROWS: t.IGridData['rows'] = {
  2: { props: { grid: { height: 80 } } },
};

export type ISampleData = {
  ns: string;
  cells: t.IGridData['cells'];
  columns: t.IGridData['columns'];
  rows: t.IGridData['rows'];
};

export const SAMPLE: ISampleData = {
  ns: 'ns:foo', // NB: the "ns:" uri prefix is stripped.
  cells: CELLS,
  columns: COLUMNS,
  rows: ROWS,
};
