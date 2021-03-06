import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil, map, delay } from 'rxjs/operators';
import { css, CssValue, t, datagrid, value as valueUtil, renderer } from '../../../common';
import { DbGridEditor } from './DbGrid.Editor';
import { updateWatch, ITestGridState } from '../../../cli';

export type IDbGridProps = { db: t.ITestRendererDb; style?: CssValue };
export type IDbGridState = { values?: datagrid.IGridValues };

const PATTERN = {
  CELL: 'cell/',
};

export class DbGrid extends React.PureComponent<IDbGridProps, IDbGridState> {
  public state: IDbGridState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<Partial<IDbGridState>>();
  private grid$ = new Subject<datagrid.GridEvent>();

  public static contextType = renderer.Context;
  public context!: t.ITestRendererContext;

  public datagrid!: datagrid.DataGrid;
  private datagridRef = (ref: datagrid.DataGrid) => (this.datagrid = ref);

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
  }

  public async componentDidMount() {
    const grid$ = this.grid$.pipe(takeUntil(this.unmounted$));
    grid$.pipe(filter(e => !['GRID/keydown'].includes(e.type))).subscribe(e => {
      // console.log('🌳  EVENT', e.type, e.payload);
    });

    // Watch for chagnes to cells.
    const dbWatch$ = this.db.watch$.pipe(
      takeUntil(this.unmounted$),
      filter(e => e.key.startsWith(PATTERN.CELL)),
      filter(e => e.isChanged),
    );
    await this.db.watch(PATTERN.CELL);

    // Update the GRID when the DB changes.
    dbWatch$.pipe(delay(0)).subscribe(e => {
      this.updateGridCell(e.key, e.value.to);
    });

    // Update the DB when the GRID changes.
    grid$
      .pipe(
        filter(e => e.type === 'GRID/cell/change'),
        map(e => e.payload as datagrid.IGridCellChange),
        filter(e => e.isChanged),
        filter(e => !e.isCancelled),
        // delay(0),
      )
      .subscribe(async e => {
        this.saveCellToDb(e.cell.key, e.value.to, { watch: true });
      });

    // Finish up.
    this.loadFromDb();
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.datagrid.dispose();
  }

  /**
   * [Properties]
   */
  public get grid() {
    return this.datagrid ? this.datagrid.grid : undefined;
  }

  public get db() {
    return this.props.db;
  }

  public get gridState(): ITestGridState {
    const grid = this.grid;
    return { selection: grid ? grid.selection : undefined };
  }

  /**
   * [Methods]
   */
  public async loadFromDb() {
    const grid = this.grid;
    if (grid) {
      const db = this.db;
      const res = await db.values({ pattern: PATTERN.CELL });

      const values = Object.keys(res).reduce((acc, next, i) => {
        const key = toCellKey(next);
        acc = { ...acc, [key]: res[next].value };
        return acc;
      }, {});

      grid.changeValues(values);
    }
  }

  public async updateGridCell(dbKey: string, value: any) {
    const grid = this.grid;
    if (grid) {
      const cellKey = toCellKey(dbKey);
      value = value === null || value === undefined ? undefined : value;
      const pos = datagrid.Cell.toPosition(cellKey);
      const cell = grid.cell(pos);
      cell.value = value;
    }
  }

  public async saveCellToDb(dbKey: string, value: any, options: { watch?: boolean } = {}) {
    const db = this.db;
    dbKey = toDbKey(dbKey);

    const watch = async (value: any) => {
      if (!options.watch) {
        return;
      }
      if (value === null) {
        await updateWatch({ db, removeKeys: [dbKey] });
      } else {
        await updateWatch({ db, addKeys: [dbKey] });
      }
    };

    if (value === '') {
      await db.delete(dbKey as any);
      await watch(undefined);
    } else {
      value = value === null || value === undefined ? undefined : value;
      value = valueUtil.toType(value);
      await db.put(dbKey as any, value);
      await watch(value);
    }
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        position: 'relative',
        flex: 1,
      }),
      grid: css({
        Absolute: 0,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <datagrid.DataGrid
          key={'test.grid'}
          ref={this.datagridRef}
          values={this.state.values}
          events$={this.grid$}
          factory={this.factory}
          totalColumns={52}
          totalRows={1000}
          initial={{ selection: 'A1' }}
          style={styles.grid}
        />
      </div>
    );
  }

  private factory: datagrid.GridFactory = req => {
    switch (req.type) {
      case 'EDITOR':
        return <DbGridEditor />;

      case 'CELL':
        const value =
          typeof req.value === 'object' && !req.value === null
            ? JSON.stringify(req.value)
            : req.value;
        return <div>{value}</div>;

      default:
        this.context.log.info(`Factory type '${req.type}' not supported by test.`);
        return null;
    }
  };
}

/**
 * [Helpers]
 */
function toCellKey(dbKey: string) {
  return dbKey.replace(/^cell\//, '');
}

function toDbKey(cellKey: string) {
  return `cell/${toCellKey(cellKey)}`;
}
