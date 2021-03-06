import * as t from '../../common/types';
export * from '../../common/types';

export type SheetCtx = {
  event$: t.Subject<t.TypedSheetEvent>;
  dispose$: t.Observable<void>;
  fetch: t.ISheetFetcher;
  cache: t.IMemoryCache;
  pool: t.ISheetPool;
  sheet: {
    load<T>(args: { ns: string }): Promise<t.ITypedSheet<T>>;
    create<T>(args: { implements: string }): Promise<t.ITypedSheet<T>>;
  };
};
