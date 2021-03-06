import { Subject } from 'rxjs';
import { R, t, time, util } from '../common';
import { one } from './calculate.one';

/**
 * Calculate changes across a range of cells within a table.
 */
export function many(args: {
  cells: string | string[];
  refs: t.IRefs;
  getValue: t.RefGetValue;
  getFunc: t.GetFunc;
  events$?: Subject<t.FuncEvent>;
  eid?: string;
}): t.FuncPromise<t.IFuncManyResponse> {
  const eid = args.eid || util.eid();
  const promise = new Promise<t.IFuncManyResponse>(async (resolve, reject) => {
    const timer = time.timer();
    const { refs, getValue, getFunc, events$ } = args;
    const cells = Array.isArray(args.cells) ? args.cells : [args.cells];

    // Fire PRE event.
    if (args.events$) {
      args.events$.next({
        type: 'FUNC/many/begin',
        payload: { eid, cells },
      });
    }

    // Build complete list of cell implicated in the update.
    let keys: string[] = cells;
    const addIncoming = (cells: string[]) => {
      cells.forEach((key) => (refs.in[key] || []).forEach((ref) => keys.push(ref.cell)));
    };
    const addOutgoing = (cells: string[]) => {
      cells.forEach((key) =>
        (refs.out[key] || []).forEach((ref) => keys.push(util.path(ref.path).last)),
      );
    };
    addIncoming(cells);
    addOutgoing(cells);

    // De-dupe and topologically sort keys.
    // Order:
    //    LEAST-dependent => MOST-dependent
    //
    keys = util.sort({ refs, keys: R.uniq(keys) }).keys;
    const isKeyOfFormula = async (key: string) => util.isFormula(await getValue(key));

    // Add the originally specified keys back in if they:
    //    1) are formulas, and
    //    2) have been removed (above) because they have no refs (eg "=1+2").
    for (const key of cells) {
      if (!keys.includes(key) && (await isKeyOfFormula(key))) {
        keys.unshift(key);
      }
    }

    // Calculate each cell that is a formula.
    const list: t.IFuncResponse[] = [];
    for (const cell of keys) {
      if (await isKeyOfFormula(cell)) {
        list.push(await one({ cell, eid, refs, getValue, getFunc, events$ }));
      }
    }

    // Prepare response.
    const ok = !list.some((item) => !item.ok);
    const elapsed = timer.elapsed.msec;
    let map: t.IFuncResponseMap;
    const payload: t.IFuncManyResponse = {
      ok,
      eid,
      list,
      elapsed,
      get map() {
        if (!map) {
          map = list.reduce((acc, next, i) => {
            acc[next.cell] = next;
            return acc;
          }, {});
        }
        return map;
      },
    };

    // Finish up.
    if (args.events$) {
      args.events$.next({
        type: 'FUNC/many/end',
        payload,
      });
    }
    return resolve(payload);
  });

  // Assign initial properties to the returned
  // promise for use prior to resolving.
  (promise as any).eid = eid;
  return promise as t.FuncPromise<t.IFuncManyResponse>;
}
