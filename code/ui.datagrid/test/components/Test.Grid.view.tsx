import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

import {
  CellEditor,
  css,
  datagrid,
  GlamorValue,
  Handsontable as HandsontableLib,
  markdown,
  t,
} from '../common';
import { DebugEditor } from './Debug.Editor';
import { SAMPLE } from './SAMPLE';

export type DataGrid = datagrid.DataGrid;

export type ITestGridViewProps = {
  events$?: Subject<t.GridEvent>;
  editorType: t.TestEditorType;
  totalColumns?: number;
  totalRows?: number;
  getFunc?: t.GetFunc;
  style?: GlamorValue;
  Table?: Handsontable;
};
export type ITestGridViewState = {
  values?: t.IGridCells;
  columns?: t.IGridColumns;
  rows?: t.IGridRows;
};

export class TestGridView extends React.PureComponent<ITestGridViewProps, ITestGridViewState> {
  public state: ITestGridViewState = {
    values: SAMPLE.CELLS,
    columns: SAMPLE.COLUMNS,
    rows: SAMPLE.ROWS,
  };
  public state$ = new Subject<Partial<ITestGridViewState>>();
  private unmounted$ = new Subject<{}>();
  private events$ = this.props.events$ || new Subject<t.GridEvent>();

  public datagrid!: datagrid.DataGrid;
  private datagridRef = (ref: datagrid.DataGrid) => (this.datagrid = ref);

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
  }

  public componentDidMount() {
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));
    const keyboard$ = this.grid.keyboard$;

    events$.pipe(filter(e => !['GRID/keydown'].includes(e.type))).subscribe(e => {
      // console.log('🌳 EVENT', e.type, e.payload);
    });

    // keyboard$
    //   .pipe(
    //     filter(e => e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey),
    //     filter(e => e.key.toUpperCase() === 'B'),
    //   )
    //   .subscribe(e => {
    //     console.log('e', e);
    //     // this.grid.changeCells({ A1: { value: 'hello', props: { bold: true } } });
    //     const selection = this.grid.selection;
    //     console.log('selection', selection);
    //     if (selection && selection.cell) {
    //       const cell = this.grid.cell(selection.cell);
    //       const value = cell.value;
    //       const props = (cell.props || {}) as any;
    //       const bold = props.bold ? false : true;
    //       const change = { [cell.key]: { value, props: { ...props, bold } } };
    //       console.log('change', change);
    //       this.grid.changeCells(change);
    //       // cell.props = {...cell.props}
    //     }
    //   });

    events$
      .pipe(
        filter(e => e.type === 'GRID/EDITOR/end'),
        map(e => e.payload as t.IEndEditing),
        filter(e => !e.isCancelled),
      )
      .subscribe(e => {
        // e.payload.cancel();
      });

    const beginEdit$ = events$.pipe(
      filter(e => e.type === 'GRID/EDITOR/begin'),
      map(e => e.payload as t.IBeginEditing),
    );

    beginEdit$.pipe(filter(e => e.cell.key === 'B1')).subscribe(e => {
      // Cancel B1 edit operations before they begin.
      e.cancel();
    });

    const change$ = events$.pipe(
      filter(e => e.type === 'GRID/cells/change'),
      map(e => e.payload as t.IGridCellsChange),
    );

    const selection$ = events$.pipe(
      filter(e => e.type === 'GRID/selection'),
      map(e => e.payload as t.IGridSelectionChange),
    );

    change$.subscribe(e => {
      // e.cancel();
      // console.log('CHANGE', e);
    });

    change$.pipe().subscribe(e => {
      const B2 = e.changes.find(change => change.cell.key === 'B2');
      if (B2) {
        B2.cancel();
      }
    });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  private get Table() {
    const { Table = HandsontableLib } = this.props;
    return Table as Handsontable;
  }

  public get grid() {
    return this.datagrid.grid;
  }

  /**
   * [Render]
   */
  public render() {
    const { totalColumns, totalRows } = this.props;

    return (
      <datagrid.DataGrid
        key={'test.grid'}
        ref={this.datagridRef}
        values={this.state.values}
        columns={this.state.columns}
        rows={this.state.rows}
        events$={this.events$}
        factory={this.factory}
        getFunc={this.props.getFunc}
        // defaults={{ rowHeight: 200 }}
        // keyBindings={[{ command: 'COPY', key: 'CMD+D' }]}
        totalColumns={totalColumns}
        totalRows={totalRows}
        Handsontable={this.Table}
        initial={{ selection: 'A1' }}
        style={this.props.style}
        canSelectAll={false}
      />
    );
  }

  private factory: t.GridFactory = req => {
    switch (req.type) {
      case 'EDITOR':
        return this.renderEditor();

      case 'CELL':
        const view = req.cell.props.view;
        if (!view.type) {
          return formatValue(req.cell.data);
        } else {
          const styles = {
            base: css({ backgroundColor: 'rgba(255, 0, 0, 0.1)' }),
          };
          return <div {...styles.base}>CUSTOM: {view.type}</div>;
        }

      default:
        console.log(`Factory type '${req.type}' not supported by test.`);
        return null;
    }
  };

  private renderEditor = () => {
    switch (this.props.editorType) {
      case 'default':
        return <CellEditor />;

      default:
        return <DebugEditor />;
    }
  };
}

/**
 * [Helpers]
 */
function formatValue(cell: t.IGridCell) {
  let value = cell.props && cell.props.value ? cell.props.value : cell.value;
  value = typeof value === 'string' && !value.startsWith('=') ? markdown.toHtmlSync(value) : value;
  value = typeof value === 'object' ? JSON.stringify(value) : value;
  return value;
}
