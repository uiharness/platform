import { ERROR, t } from '../common';
import { fromFuncs } from './fetch.fromFuncs';

/**
 * Constructs a sheet-data-fetcher from an HTTP host/client.
 */
export function fromClient(http: t.IHttpClient): t.ISheetFetcher {
  const getNs: t.FetchSheetNs = async (args) => {
    const res = await http.ns(args.ns).read();
    const exists = res.body.exists;
    let error: t.IHttpError | undefined;

    if (!exists) {
      const message = `The namespace (${args.ns}) does not exist`;
      error = { status: 404, message, type: ERROR.HTTP.NOT_FOUND };
    }

    const ns = (res.body.data.ns.props || {}) as t.INsProps;
    const payload: t.FetchSheetNsResult = { ns, error };
    return payload;
  };

  const getColumns: t.FetchSheetColumns = async (args) => {
    const res = await http.ns(args.ns).read({ columns: true });
    const error = formatError(
      res.error,
      (msg) => `Failed to retrieve type information from namespace (${args.ns}). ${msg}`,
    );

    const columns = res.body.data.columns;
    const payload: t.FetchSheetColumnsResult = { columns, error };
    return payload;
  };

  const getCells: t.FetchSheetCells = async (args) => {
    const { ns, query } = args;
    const res = await http.ns(ns).read({ cells: query, total: 'rows' });
    const error = formatError(
      res.error,
      (msg) => `Failed to retrieve cells "${query}" within namespace (${ns}). ${msg}`,
    );

    const cells = res.body.data.cells;
    const total = res.body.data.total || {};
    const rows = total.rows || 0;

    const payload: t.FetchSheetCellsResult = { total: { rows }, cells, error };
    return payload;
  };

  return fromFuncs({
    getNs,
    getColumns,
    getCells,
  });
}

/**
 * [Helpers]
 */

function formatError(error: t.IHttpError | undefined, getMessage: (message: string) => string) {
  return !error ? undefined : { ...error, message: getMessage(error.message) };
}
