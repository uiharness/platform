import { expect, t } from '../../test';

import { Cell } from '.';
import { createGrid } from '../Grid/Grid.TEST';

describe('Cell', () => {
  describe('static', () => {
    it('converts row/column to key', () => {
      expect(Cell.toKey({ row: 0, column: 0 })).to.eql('A1');
      expect(Cell.toKey({ row: 4, column: 1 })).to.eql('B5');
    });

    it('isEmpty', () => {
      const test = (input: t.IGridCellData | undefined, expected: boolean) => {
        expect(Cell.isEmpty(input)).to.eql(expected);
      };
      test(undefined, true);
      test({ value: '' }, true);
      test({ value: undefined }, true);
      test({ value: undefined, props: {} }, true); // NB: props object is empty.
      test({ value: '', props: {} }, true);

      test({ value: ' ' }, false);
      test({ value: 0 }, false);
      test({ value: null }, false);
      test({ value: {} }, false);
      test({ value: { foo: 123 } }, false);
      test({ value: true }, false);
      test({ value: false }, false);
      test({ value: undefined, props: { value: 123 } }, false); // NB: has props, not empty.
    });

    it('isEmptyValue', () => {
      const test = (input: t.CellValue | undefined, expected: boolean) => {
        expect(Cell.isEmptyValue(input)).to.eql(expected);
      };
      test(undefined, true);
      test('', true);

      test(' ', false);
      test(null, false);
      test(0, false);
      test(123, false);
      test({}, false);
      test([], false);
      test(true, false);
      test(false, false);
    });
  });

  describe('cell.value', () => {
    it('has default value (undefined)', () => {
      const grid = createGrid();
      const cell = grid.cell('A1');
      expect(cell.key).to.eql('A1');
      expect(cell.data.value).to.eql(undefined);
    });
  });

  describe('cell.props', () => {
    it('has default props (empty {})', () => {
      const grid = createGrid();
      const cell = grid.cell('A1');
      expect(cell.data.props).to.eql({});
    });

    it('Cell.props (default values)', () => {
      const grid = createGrid().changeCells({
        A2: {
          value: 'A2',
          props: {
            style: { bold: true },
            merge: { colspan: 3 },
            view: { cell: { type: 'FOO', className: 'my-class' } },
          },
        },
      });
      const A1 = grid.cell('A1');
      const A2 = grid.cell('A2');

      const res1 = Cell.props(A1.data.props); // NB: Default values (no actual data in grid).
      const res2 = Cell.props(A2.data.props);

      expect(A1.data.props).to.eql({});
      expect(res1.style).to.eql({});
      expect(res1.merge).to.eql({});
      expect(res1.view).to.eql({});

      expect(res2.style.bold).to.eql(true);
      expect(res2.merge.colspan).to.eql(3);
      expect(res2.view.cell && res2.view.cell.type).to.eql('FOO');
      expect(res2.view.cell && res2.view.cell.className).to.eql('my-class');
    });
  });

  describe('diff', () => {
    it('no difference', () => {
      const cell: t.IGridCellData = { value: 1, props: { style: { bold: true } } };
      const res = Cell.diff(cell, cell);
      expect(res.left).to.eql(cell);
      expect(res.right).to.eql(cell);
      expect(res.isDifferent).to.eql(false);
      expect(res.list.length).to.eql(0);
    });

    it('is different', () => {
      const left: t.IGridCellData = { value: 1, props: { style: { bold: true } } };
      const right: t.IGridCellData = { value: 2, props: { style: { bold: false } } };
      const res = Cell.diff(left, right);

      expect(res.isDifferent).to.eql(true);
      expect(res.list.length).to.eql(2);

      expect((res.list[0].path || []).join('.')).to.eql('value');
      expect((res.list[1].path || []).join('.')).to.eql('props.style.bold');
    });
  });

  describe('rowspan/colspan', () => {
    it('default span values (1)', () => {
      const grid = createGrid();
      const cell = grid.cell('A1');
      expect(cell.rowspan).to.eql(1);
      expect(cell.colspan).to.eql(1);
    });

    it('updates col/row span values', () => {
      const values1 = {
        A1: { value: 'A1', props: { merge: { colspan: 2 } } },
        B2: { value: 'B2', props: { merge: { colspan: 3, rowspan: 5 } } },
      };
      const grid = createGrid().changeCells(values1);
      const cells = grid.data.cells as any;
      expect(cells.A1.props.merge.colspan).to.eql(2);
      expect(cells.B2.props.merge.colspan).to.eql(3);
      expect(cells.B2.props.merge.rowspan).to.eql(5);
    });
  });
});
