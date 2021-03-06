import { Observable } from '../common';

/**
 * Raw database [Node] data.
 */
export type IDbNodeProps<K> = {
  key: K;
  deleted: boolean | undefined;
  clock: number[];
  feed: number;
  seq: number;
  path: number[];
  inflate: number;
  trie: any;
};

export type DbNodeValue = string | number | boolean | undefined;
export type IDbNode<K = any, V extends DbNodeValue = any> = IDbNodeProps<K> & {
  value?: V;
};

/**
 * Parsed database [Value]
 */
export type IDbValue<K, V> = {
  value?: V;
  props: IDbValueProps<K>;
};
export type IDbValueProps<K> = IDbNodeProps<K> & { exists: boolean };
export type IDbValues<D extends {} = any> = { [key in keyof D]: IDbValue<keyof D, D[keyof D]> };
export type IDbValuesArgs = { pattern?: string; recursive?: boolean; gt?: boolean };

/**
 * [Database]
 */
export type IDb<D extends {} = any> = IDbProps &
  IDbMethods<D> & {
    readonly events$: Observable<DbEvent>;
    readonly watch$: Observable<IDbWatchChange<D>>;
    readonly dispose$: Observable<{}>;
    toString(): string;
    dispose(): void;
  };

export type IDbProps = {
  readonly dir: string;
  readonly key: string;
  readonly discoveryKey: string;
  readonly localKey: string;
  readonly watching: string[];
  readonly isDisposed: boolean;
  readonly checkoutVersion: string | undefined;
};

export type IDbMethods<D extends {} = any> = {
  checkout(version: string): Promise<IDb<D>>;
  version(): Promise<string>;
  get<K extends keyof D>(key: K): Promise<IDbValue<K, D[K]>>;
  put<K extends keyof D>(key: K, value: D[K]): Promise<IDbValue<K, D[K]>>;
  delete<K extends keyof D>(key: K): Promise<IDbValue<K, D[K]>>;
  getMany<T extends object = D>(keys: Array<keyof D>): Promise<IDbValues<T>>;
  putMany<T extends object = D>(data: IDbUpdateObject<T> | IDbUpdateList<T>): Promise<IDbValues<T>>;
  deleteMany<T extends object = D>(data: Array<keyof T>): Promise<void>;
  watch<T extends object = D>(...pattern: Array<keyof T>): Promise<void>;
  unwatch<T extends object = D>(...pattern: Array<keyof T>): Promise<void>;
  isAuthorized(peerKey?: string | Buffer): Promise<boolean>;
  authorize(peerKey: string | Buffer): Promise<void>;
  values<T extends object = D>(args: IDbValuesArgs): Promise<IDbValues<T>>;
  history<K extends keyof D>(
    key: K,
    options?: { take?: number },
  ): Promise<Array<IDbValue<K, D[K]>>>;
};

export type IDbUpdateObject<D extends object = any> = { [key in keyof D]: D[keyof D] };
export type IDbUpdateList<D extends object = any> = Array<{ key: keyof D; value: D[keyof D] }>;

export type IDbTimestamps = {
  createdAt: number;
  modifiedAt: number;
};

/**
 * [Events]
 */
export type DbEvent = IDbErrorEvent | IDbWatchEvent;
export type IDbWatchEvent<D extends {} = any> = {
  type: 'DB/watch';
  payload: IDbWatchChange<D>;
};
export type IDbWatchChange<D extends {} = any> = {
  db: { key: string };
  key: keyof D;
  value: { from?: D[keyof D]; to?: D[keyof D] };
  isChanged: boolean;
  isDeleted: boolean;
  pattern: string | '*';
  version: string; // database-version.
};
export type IDbErrorEvent = {
  type: 'DB/error';
  payload: { db: { key: string }; error: Error };
};
