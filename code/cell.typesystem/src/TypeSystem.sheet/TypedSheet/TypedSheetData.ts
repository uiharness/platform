import { filter } from 'rxjs/operators';

import { coord, rx, t, Uri } from './common';
import { TypedSheetRow } from './TypedSheetRow';

type IArgs = {
  sheet: t.ITypedSheet;
  typename: string;
  types: t.IColumnTypeDef[];
  ctx: t.SheetCtx;
  range?: string;
};

type ILoading<T, K extends keyof T> = {
  query: string;
  promise: Promise<t.ITypedSheetData<T, K>>;
};

/**
 * An exanding data-cursor for iterating over a set of rows
 * within a sheet for a particular type.
 *
 * Generic (see [TypedSheet] for more):
 *    <T> = TypeIndex = { [TypeName]:Type }
 *
 */
export class TypedSheetData<T, K extends keyof T> implements t.ITypedSheetData<T, K> {
  public static create = <T, K extends keyof T>(args: IArgs): t.ITypedSheetData<T, K> => {
    return new TypedSheetData<T, K>(args);
  };

  public static DEFAULT = {
    RANGE: '1:500',
    PAGE: 500,
  };

  public static formatRange(input?: string) {
    const text = (input || '').trim();
    const DEFAULT = TypedSheetData.DEFAULT;
    if (!text) {
      return DEFAULT.RANGE;
    }

    const range = coord.range.fromKey(text);
    if (!range.isValid) {
      return DEFAULT.RANGE;
    }

    const left = {
      key: range.left.key,
      index: range.left.row,
      isInfinity: isInfinity(range.left.key),
    };
    const right = {
      key: range.right.key,
      index: range.right.row,
      isInfinity: isInfinity(range.right.key),
    };

    if (left.isInfinity && right.isInfinity) {
      return DEFAULT.RANGE;
    }
    if (left.isInfinity) {
      left.index = DEFAULT.PAGE - 1;
    }
    if (right.isInfinity) {
      right.index = DEFAULT.PAGE - 1;
    }

    const edges = [Math.max(0, left.index) + 1, Math.max(0, right.index) + 1].sort(diff);
    return `${edges[0]}:${edges[1]}`;
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: IArgs) {
    this._sheet = args.sheet;
    this.typename = args.typename;
    this.types = args.types;
    this._ctx = args.ctx;
    this._range = TypedSheetData.formatRange(args.range);

    // Monitor for changes.
    rx.payload<t.ITypedSheetSyncEvent>(args.ctx.event$, 'TypedSheet/sync')
      .pipe(filter((e) => this.isThisSheet(e.changes.uri)))
      .subscribe((e) => {
        // Increase the "total rows" count if required.
        const keys = Object.keys(e.changes.cells || {});
        const max = coord.cell.max.row(keys) + 1;
        this._total = max > this._total ? max : this._total;
      });
  }

  /**
   * [Fields]
   */
  private readonly _ctx: t.SheetCtx;
  private readonly _sheet: t.ITypedSheet;
  private _rows: t.ITypedSheetRow<T, K>[] = [];
  private _range: string;
  private _status: t.ITypedSheetData<T, K>['status'] = 'INIT';
  private _total = -1;
  private _loading: ILoading<T, K>[] = [];
  private _isLoaded = false;

  public readonly typename: string;
  public readonly types: t.IColumnTypeDef[];

  /**
   * [Properties]
   */
  public get uri() {
    return this._sheet.uri;
  }

  public get rows(): t.ITypedSheetRow<T, K>[] {
    return [...this._rows];
  }

  public get range() {
    return this._range;
  }

  public get status() {
    return this._status;
  }

  public get isLoaded() {
    return this._isLoaded;
  }

  public get total() {
    // NB: If total is "-1" then this signals that it should be
    //     recalculated.  Taking the maximum of total or the loaded
    //     row length ensures that any expansions to the data-set via
    //     the "TypedSheet/sync" event over time.
    return this._total < 0 ? this._total : Math.max(this._total, this._rows.length);
  }

  /**
   * [Methods] - interface (public)
   */
  public toString() {
    return this.uri.toString();
  }

  public exists(index: number) {
    return Boolean(this._rows[index]);
  }

  public row(index: number): t.ITypedSheetRow<T, K> {
    if (index < 0) {
      throw new Error(`Row index must be >=0`);
    }

    if (!this.exists(index)) {
      this._rows[index] = this.createRow(index);
    }

    return this._rows[index];
  }

  public async load(args: string | t.ITypedSheetDataOptions): Promise<t.ITypedSheetData<T, K>> {
    // Wrangle the given argument range.
    let argRange = typeof args === 'string' ? args : args?.range;
    if (argRange) {
      argRange = this.expandRange(argRange);
    }

    const query = argRange || this.range; // NB: Use the narrowest range passed to do the least amount of work (avoiding the complete expanded range).
    const alreadyLoading = this._loading.find((item) => item.query === query);
    if (alreadyLoading) {
      return alreadyLoading.promise; // NB: A load operation is already in progress.
    }

    const ns = this.uri.toString();
    const promise = new Promise<t.ITypedSheetData<T, K>>(async (resolve, reject) => {
      this._status = 'LOADING';

      // Fire BEFORE event.
      const sheet = this._sheet;
      this.fire({
        type: 'TypedSheet/loading',
        payload: { sheet, range: query },
      });

      // Query cell data from the network.
      const { total, error } = await this._ctx.fetch.getCells({ ns, query });
      if (error) {
        reject(new Error(error.message));
      }

      // Load the retrieved range of rows.
      const range = coord.range.fromKey(query);
      const min = Math.max(0, range.left.row);
      const max = Math.min(total.rows - 1, range.right.row);
      const wait = Array.from({ length: max - min + 1 }).map((v, i) => {
        const index = i + min;
        return this.row(index).load();
      });
      await Promise.all(wait);

      // Update state.
      this._total = total.rows;
      this._status = 'LOADED';
      this._isLoaded = true; // NB: Always true after initial load.
      this._loading = this._loading.filter((item) => item.query !== query);

      // Fire AFTER event.
      this.fire({
        type: 'TypedSheet/loaded',
        payload: {
          sheet,
          range: this.range,
          total: this.total,
        },
      });

      // Finish up.
      return resolve(this);
    });

    this._loading = [...this._loading, { query, promise }]; // NB: Stored so repeat calls while loading return the same promise.
    return promise;
  }

  public forEach(fn: (row: t.ITypedSheetRowProps<T[K]>, index: number) => void) {
    this._rows.forEach((row, i) => fn(row.props, i));
  }

  public filter(fn: (row: t.ITypedSheetRowProps<T[K]>, index: number) => boolean) {
    return this._rows.filter((row, i) => fn(row.props, i));
  }

  public find(fn: (row: t.ITypedSheetRowProps<T[K]>, index: number) => boolean) {
    return this._rows.find((row, i) => fn(row.props, i));
  }

  public map<U>(fn: (row: t.ITypedSheetRowProps<T[K]>, index: number) => U) {
    return this._rows.map((row, i) => fn(row.props, i));
  }

  public reduce<U>(
    fn: (prev: U, next: t.ITypedSheetRowProps<T[K]>, index: number) => U,
    initial: U,
  ) {
    return this._rows.reduce((acc, next, index) => {
      return fn(acc, next.props, index);
    }, initial);
  }

  /**
   * [Methods] - internal to module.
   */

  public expandRange(range: string) {
    range = TypedSheetData.formatRange(range);
    this._range = this.isLoaded
      ? mergeRanges(range, this._range) // NB: Expand the range if this new range is additive (already loaded).
      : range; // NB: Replace if this is the first load.
    return this._range;
  }

  /**
   * [Internal]
   */
  private fire(e: t.TypedSheetEvent) {
    this._ctx.event$.next(e);
  }

  private createRow(index: number) {
    const ctx = this._ctx;
    const uri = Uri.create.row(this.uri.toString(), (index + 1).toString());
    const columns = this.types;
    const typename = this.typename;
    const sheet = this._sheet;
    return TypedSheetRow.create<T, K>({ sheet, typename, uri, columns, ctx });
  }

  private isThisSheet(ns: string) {
    return Uri.strip.ns(ns) === this._sheet.uri.id;
  }
}

/**
 * [Helpers]
 */
const diff = (a: number, b: number) => a - b;
const isInfinity = (input: string) => input === '*' || input === '**';

const mergeRanges = (input1: string, input2: string) => {
  const range1 = coord.range.fromKey(input1).square;
  const range2 = coord.range.fromKey(input2).square;

  const min = Math.min(0, range1.left.row, range2.left.row) + 1;
  const max = Math.max(range1.right.row, range2.right.row) + 1;

  return `${min}:${max}`;
};
