import { IpcClient } from '@platform/electron/lib/types';
import { Observable } from 'rxjs';

export * from '../../types';

/**
 * [Value]
 */
export type IDbValueMeta<K> = {
  key: K;
  exists: boolean;
  deleted: boolean;
  clock: number[];
  feed: number;
  seq: number;
  path: number[];
  inflate: number;
  trie: any;
};

export type IDbValue<K, V> = {
  value: V | undefined;
  meta: IDbValueMeta<K>;
};

/**
 * [Database]
 */
export type IDbProps = {
  readonly key: string;
  readonly discoveryKey: string;
  readonly localKey: string;
  readonly watching: string[];
  readonly isDisposed: boolean;
};
export type IDb<D extends object = any> = IDbProps & {
  readonly events$: Observable<DbEvent>;
  readonly watch$: Observable<IDbWatchChange<D>>;
  version(): Promise<string>;
  checkout(version: string): IDb<D>;
  get<K extends keyof D>(key: K): Promise<IDbValue<K, D[K]>>;
  put<K extends keyof D>(key: K, value: D[K]): Promise<IDbValue<K, D[K]>>;
  del<K extends keyof D>(key: K): Promise<IDbValue<K, D[K]>>;
  watch(...pattern: string[]): IDb<D>;
  unwatch(...pattern: string[]): IDb<D>;
  dispose(): void;
};

/**
 * [Events]
 */
export type DbEvent = IDbErrorEvent | IDbWatchEvent;
export type IDbWatchEvent<D extends object = any> = {
  type: 'DB/watch';
  payload: IDbWatchChange<D>;
};
export type IDbWatchChange<D extends object = any> = {
  key: keyof D;
  value?: D[keyof D];
  pattern: string | '*';
  deleted: boolean;
  version: string; // database-version.
};

export type IDbErrorEvent = {
  type: 'DB/error';
  payload: { error: Error };
};

/**
 * [IPC] Events
 */

export type DbIpcClient = IpcClient<DbIpcEvent>;
export type DbIpcEvent = IDbIpcGetStateEvent;
export type IDbIpcGetStateEvent<T extends object = any> = {
  type: 'HYPERDB/getState';
  payload: {
    storage: string;
    dbKey?: string;
  };
};
export type IDbIpcGetStateResponse = {
  props: IDbProps;
};
