import * as t from './types';
import { Db } from './Db.main';
import { Swarm } from '../swarm/main';
import { create } from './main.create';
import { value } from '../common';

type Refs = { [key: string]: { db: Db; swarm: Swarm } };
const refs: Refs = {};

/**
 * The IPC handler on the [main] process that manages DB's.
 */
export function init(args: { ipc: t.IpcClient; log: t.ILog }) {
  const ipc = args.ipc as t.DbIpcClient;
  const log = args.log;

  const getOrCreateDb = async (args: { dir: string; dbKey?: string }) => {
    const { dir, dbKey } = args;
    const key = dir;
    refs[key] = refs[key] || (await create({ dir, dbKey }));
    return refs[key];
  };

  /**
   * HANDLE state requests from DB `renderer` clients and
   * fire back the latest values.
   */
  ipc.handle<t.IDbIpcGetStateEvent>('HYPERDB/state/get', async e => {
    type E = t.IDbIpcUpdateStateEvent;
    type P = E['payload'];
    const { dir, dbKey } = e.payload.db;
    const db = (await getOrCreateDb({ dir, dbKey })).db;
    try {
      const { key, discoveryKey, localKey, watching, isDisposed } = db;
      const props: t.IDbProps = { key, discoveryKey, localKey, watching, isDisposed };
      const payload: P = { db: { dir }, props };
      ipc.send<E>('HYPERDB/state/update', payload);
    } catch (err) {
      const message = `Failed to get state fields of DB '${dir}'. ${err.message}`;
      log.error(message);
    }
  });

  /**
   * HANDLE invoke requests from DB `renderer` clients.
   */
  ipc.handle<t.IDbIpcInvokeEvent, t.IDbIpcInvokeResponse>('HYPERDB/invoke', async e => {
    const { method, params } = e.payload;
    const { dir, dbKey } = e.payload.db;
    const db = (await getOrCreateDb({ dir, dbKey })).db;
    try {
      const fn = db[method] as (...params: any[]) => any;
      const res = fn.apply(db, params);
      const result = value.isPromise(res) ? await res : res;
      return { method, result };
    } catch (err) {
      const message = err.message;
      const error = { message };
      return { method, error };
    }
  });
}
