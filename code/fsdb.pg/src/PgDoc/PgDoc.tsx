/**
 * NOTIFY event stream
 * - https://github.com/andywer/pg-listen
 * - https://www.postgresql.org/docs/current/sql-notify.html
 * - https://www.postgresql.org/docs/current/sql-listen.html
 */

import { Subject } from 'rxjs';
import { take, share } from 'rxjs/operators';

import { R, t, pg, defaultValue, time, value as valueUtil, DbUri } from '../common';
import { Pg } from './Pg';

export type IPgDocArgs = {
  db: pg.PoolConfig;
};

type IRow = { id: number; path: string; data: t.Json; createdAt: number; modifiedAt: number };

/**
 * A file-system like document store backed by Postgres.
 */
export class PgDoc implements t.IDb {
  /**
   * [Static]
   */
  public static create(args: IPgDocArgs) {
    const db = new PgDoc(args);
    return db;
  }

  public static parseKey(key: string, options: { requirePath?: boolean } = {}) {
    const uri = DbUri.create().parse(key);
    key = uri.path.dir;
    const index = key.indexOf('/');
    const table = index > -1 ? key.substring(0, index).trim() : key;
    const path = key
      .substr(table.length + 1)
      .replace(/\/*$/, '')
      .trim();

    if (!table) {
      throw new Error(`The key path does not have a root table name: ${key}`);
    }

    if (!path && defaultValue(options.requirePath, true)) {
      throw new Error(`The key for table '${table}' does not have path name: ${key}`);
    }

    if (path.includes('//')) {
      throw new Error(`The key path contains "//": ${key}`);
    }

    /**
     * TODO
     * - ensure valid characters (??)
     * - no:
     *    - quote markes "" or ''
     *    - anything that the file-system rejects (OSX)
     */

    return {
      table,
      path,
      value: key,
      toString: () => key,
    };
  }

  public static join(...parts: string[]) {
    return parts.map((part) => part.replace(/^\/*/, '').replace(/\/*$/, '')).join('/');
  }

  private static toTimestamps(row?: IRow) {
    const createdAt = valueUtil.toNumber(row ? row.createdAt : -1);
    const modifiedAt = valueUtil.toNumber(row ? row.modifiedAt : -1);
    return { createdAt, modifiedAt };
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: IPgDocArgs) {
    this._args = args;
    this.db = Pg.create({ db: args.db });
    this.db.dispose$.pipe(take(1)).subscribe(() => this.dispose());
  }

  public dispose() {
    this.db.dispose();
    this._dispose$.next();
    this._dispose$.complete();
  }
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  /**
   * [Fields]
   */
  private readonly _args: IPgDocArgs;
  public readonly db: Pg;
  private readonly uri = DbUri.create();

  private readonly _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.pipe(share());

  private readonly _events$ = new Subject<t.DbEvent>();
  public readonly events$ = this._events$.pipe(share());

  /**
   * [Methods]
   */

  public toString() {
    const { host, database } = this._args.db;
    return `[db:${host}/${database}]`;
  }

  /**
   * [Get]
   */
  public async get(key: string): Promise<t.IDbValue> {
    this.throwIfDisposed('get');
    return (await this.getMany([key]))[0];
  }
  public async getMany(keys: string[]): Promise<t.IDbValue[]> {
    this.throwIfDisposed('getMany');
    keys = R.uniq(keys);
    await this.ensureTables(keys);
    const res = await Promise.all(
      keys
        .map((key) => PgDoc.parseKey(key))
        .map(async (key) => {
          const variables = [key.path];
          const sql = `SELECT * FROM "${key.table}" WHERE path = $1`;
          const res = await this.db.query(sql, variables);
          const { rows } = res;
          return { rows, path: key.toString() };
        }),
    );

    const rows: IRow[] = R.flatten(
      res.map((query) => query.rows.map((row) => ({ ...row, path: query.path }))),
    );

    return keys.map((key) => {
      const row = rows.find((item) => item.path === key);
      const value = row && typeof row.data === 'object' ? (row.data as any).data : undefined;
      const exists = Boolean(value);
      const { createdAt, modifiedAt } = PgDoc.toTimestamps(row);
      const res: t.IDbValue = {
        value,
        props: { key, exists, createdAt, modifiedAt },
      };
      return res;
    });
  }
  public async getValue<T extends t.Json | undefined>(key: string): Promise<T> {
    this.throwIfDisposed('putValue');
    const res = await this.get(key);
    return (res ? res.value : undefined) as T;
  }

  /**
   * [Put]
   */

  public async put(key: string, value?: t.Json, options?: t.IDbPutOptions): Promise<t.IDbValue> {
    this.throwIfDisposed('put');
    return (await this.putMany([{ key, value, ...options }]))[0];
  }
  public async putMany(items: t.IDbPutItem[]): Promise<t.IDbValue[]> {
    this.throwIfDisposed('putMany');
    await this.ensureTables(items.map((item) => item.key));
    const now = time.now.timestamp;
    await Promise.all(
      items
        .map((item) => ({
          key: PgDoc.parseKey(item.key),
          value: item.value,
          createdAt: defaultValue(item.createdAt, now),
          modifiedAt: defaultValue(item.modifiedAt, now),
        }))
        .map((item) => {
          const data = { data: item.value };
          const { createdAt, modifiedAt } = item;
          const table = item.key.table;
          const path = item.key.path;
          const json = JSON.stringify(data);
          const variables = [path, json, createdAt, modifiedAt];
          const sql = `
            INSERT INTO "${table}" ("path", "data", "createdAt", "modifiedAt")
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (path)
              DO
                UPDATE
                SET "data" = EXCLUDED.data, "modifiedAt" = ${now};
          `;
          return { sql, variables };
        })
        .map(({ sql, variables }) => this.db.query(sql, variables)),
    );
    return this.getMany(items.map((item) => item.key));
  }

  /**
   * [Delete]
   */

  public async delete(key: string): Promise<t.IDbValue> {
    this.throwIfDisposed('delete');
    return (await this.deleteMany([key]))[0];
  }
  public async deleteMany(keys: string[]): Promise<t.IDbValue[]> {
    this.throwIfDisposed('deleteMany');
    keys = R.uniq(keys);
    await this.ensureTables(keys);

    await Promise.all(
      keys
        .map((key) => PgDoc.parseKey(key))
        .map(async (key) => {
          const sql = `DELETE FROM "${key.table}" WHERE path = '${key.path}'`;
          const res = await this.db.query(sql);
          const { rows } = res;
          return { rows, path: key.toString() };
        }),
    );

    return keys.map((key) => {
      const res: t.IDbValue = {
        value: undefined,
        props: { key, exists: false, createdAt: -1, modifiedAt: -1 },
      };
      return res;
    });
  }

  /**
   * [Find]
   */

  public async find(query: string | t.IDbQuery): Promise<t.IDbFindResult> {
    this.throwIfDisposed('find');

    let keys: string[] | undefined;
    let map: t.IDbFindResult['map'] | undefined;
    let error: Error | undefined;
    let list: t.IDbValue[] = [];

    try {
      const pattern = (typeof query === 'object' ? query.path : query) || '';
      if (!pattern) {
        throw new Error(`A query pattern must contain at least a root TABLE name.`);
      }
      const uri = this.uri.parse(pattern);
      const deep = uri.path.suffix === '**';

      // Prepare search SQL statement.
      const key = PgDoc.parseKey(pattern, { requirePath: false });
      let sql = `SELECT * FROM "${key.table}"`;
      sql = key.path ? `${sql} WHERE path ~ '^${key.path}'` : sql;
      sql = `${sql};`;

      // Query the database.
      const res = await this.db.query(sql);
      list = res.rows
        .filter((row) => {
          // NB: This may be able to be done in a more advanced regex in SQL above.
          return deep
            ? true // Deep: All child paths accepted.
            : !row.path.substring(key.path.length + 1).includes('/'); // Not deep: ensure this is not deeper than the given path.
        })
        .map((row) => {
          const value = row && typeof row.data === 'object' ? (row.data as any).data : undefined;
          const { createdAt, modifiedAt } = PgDoc.toTimestamps(row);
          const res: t.IDbValue = {
            value,
            props: {
              key: PgDoc.join(key.table, row.path),
              exists: Boolean(value),
              createdAt,
              modifiedAt,
            },
          };
          return res;
        });
    } catch (err) {
      error = err;
    }

    // Return data structure.
    const result: t.IDbFindResult = {
      length: list.length,
      list,
      get keys() {
        if (!keys) {
          keys = list.map((item) => item.props.key);
        }
        return keys;
      },
      get map() {
        if (!map) {
          map = list.reduce((acc, next) => ({ ...acc, [next.props.key]: next.value }), {});
        }
        return map;
      },
      error,
    };

    // Finish up.
    return result;
  }

  /**
   * [Helpers]
   */

  private async ensureTables(keys: string[]) {
    const tables = R.uniq(keys.map((key) => PgDoc.parseKey(key)).map((item) => item.table));
    await Promise.all(tables.map((table) => this.ensureTable(table)));
  }

  private async ensureTable(table: string) {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS "public"."${table}" (
        "id" serial,
        "path" text NOT NULL,
        "createdAt" bigint NOT NULL,
        "modifiedAt" bigint NOT NULL,
        "data" jsonb,
        PRIMARY KEY ("id"),
        UNIQUE ("path")
      );
    `);
  }

  private throwIfDisposed(action: string) {
    if (this.isDisposed) {
      throw new Error(`Cannot ${action} because the ${this.toString()} has been disposed.`);
    }
  }
}
