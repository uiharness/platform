import { TypeDefault } from '../TypeDefault';
import { TypeTarget } from '../TypeTarget';
import { Schema, t, util } from './common';
import { TypedSheetRef } from './TypedSheetRef';
import { TypedSheetRefs } from './TypedSheetRefs';

type TypedSheetRowArgs = {
  index: number;
  uri: string | t.IRowUri;
  columns: TypedColumnData[];
  ctx: t.SheetCtx;
};

type TypedColumnData = {
  typeDef: t.IColumnTypeDef;
  cell: t.ICellData;
};

/**
 * A strongly-typed row.
 */
export class TypedSheetRow<T> implements t.ITypedSheetRow<T> {
  public static create = <T>(args: TypedSheetRowArgs) => {
    return new TypedSheetRow<T>(args) as t.ITypedSheetRow<T>;
  };

  /**
   * [Lifecycle]
   */
  private constructor(args: TypedSheetRowArgs) {
    this.index = args.index;
    this.uri = util.formatRowUri(args.uri);
    this.ctx = args.ctx;
    this._columns = args.columns;
  }

  /**
   * [Fields]
   */
  private readonly ctx: t.SheetCtx;
  private readonly _columns: TypedColumnData[] = [];
  private readonly _prop: { [key: string]: t.ITypedSheetRowProp<T, any> } = {};
  private _props: t.ITypedSheetRowProps<T>;
  private _types: t.ITypedSheetRowTypes<T>;

  public readonly index: number;
  public readonly uri: t.IRowUri;

  /**
   * [Properties]
   */
  public get types() {
    if (!this._types) {
      type M = t.ITypedSheetRowTypes<T>['map'];
      const columns = this._columns;
      let list: t.IColumnTypeDef[] | undefined;
      let map: M | undefined;

      this._types = {
        get list() {
          return list || (list = columns.map(({ typeDef: type }) => type));
        },
        get map() {
          if (!map) {
            map = columns.reduce((acc, column) => {
              acc[column.typeDef.prop] = column.typeDef;
              return acc;
            }, {}) as M;
          }
          return map;
        },
      };
    }

    return this._types;
  }

  public get props(): t.ITypedSheetRowProps<T> {
    if (!this._props) {
      const props = {};
      this._columns.forEach(column => {
        const name = column.typeDef.prop as keyof T;
        Object.defineProperty(props, name, {
          get: () => this.prop(name).get(),
          set: value => this.prop(name).set(value),
        });
      });
      this._props = props as any;
    }
    return this._props;
  }

  /**
   * Methods
   */

  public toObject(): T {
    return this._columns.reduce((acc, column) => {
      const prop = column.typeDef.prop;
      acc[prop] = this.prop(prop as keyof T).get();
      return acc;
    }, {}) as T;
  }

  public type(prop: keyof T) {
    const column = this._columns.find(def => def.typeDef.prop === prop);
    if (!column) {
      const err = `The property '${prop}' is not defined by a column on [${this.uri}]`;
      throw new Error(err);
    }
    return column.typeDef;
  }

  /**
   * Read/write handle for a single cell (property).
   */
  public prop<K extends keyof T>(name: K): t.ITypedSheetRowProp<T, K> {
    if (this._prop[name as string]) {
      return this._prop[name as string]; // Already created and cached.
    }

    const self = this; // tslint:disable-line
    const column = this.findColumn(name);
    const typeDef = column.typeDef;
    const ctx = this.ctx;

    const target = TypeTarget.parse(typeDef.target);
    if (!target.isValid) {
      const err = `Property '${name}' (column ${typeDef.column}) has an invalid target '${typeDef.target}'.`;
      throw new Error(err);
    }

    const api: t.ITypedSheetRowProp<T, K> = {
      /**
       * Get a cell (property) value.
       */
      get(): T[K] {
        const done = (result?: any): T[K] => {
          if (result === undefined && TypeDefault.isTypeDefaultValue(typeDef.default)) {
            // NB: Only look for a default value definition.
            //     If the default value was declared with as a REF, that will have been looked up
            //     and stored as a {value} by the [TypeClient] prior to this sync code being called.
            result = (typeDef.default as t.ITypeDefaultValue).value;
          }

          if (result === undefined && typeDef.type.isArray) {
            result = []; // For array types, an empty array is expected rather than [undefined].
          }

          return result;
        };

        if (!target.isValid) {
          const err = `Cannot read property '${typeDef.prop}' (column ${typeDef.column}) because the target '${typeDef.target}' is invalid.`;
          throw new Error(err);
        }

        if (target.isInline) {
          return done(TypeTarget.inline(typeDef).read(column.cell));
        }

        if (target.isRef) {
          const typeDef = column.typeDef as t.IColumnTypeDef<t.ITypeRef>;

          // Schema.ref.links.
          const cell = column.cell;
          const links = cell.links || {};
          const link = Schema.ref.links.find(links).byName('type');

          let ns = link ? link.uri.toString() : '';
          if (!ns) {
            ns = Schema.uri.create.ns(Schema.cuid());
            const key = Schema.ref.links.toKey('type');

            links[key] = ns;
          }

          // if (link) {
          //   // link.
          //   self.
          // }

          // console.log('-------------------------------------------');
          // console.log('link', link);
          // ns;

          const ref = typeDef.type.isArray
            ? TypedSheetRefs.create({ ns, typeDef, data: cell, ctx })
            : TypedSheetRef.create({ typeDef, ctx });
          return done(ref);
        }

        throw new Error(`Failed to read property '${name}' (column ${typeDef.column}).`);
      },

      /**
       * Set a cell (property) value.
       */
      set(value: T[K]) {
        if (target.isInline) {
          const cell = column.cell;
          const data = value as any;
          column.cell = TypeTarget.inline(typeDef).write({ cell, data });
        }

        if (target.isRef) {
          // console.log('target', target);
          // TypeTarget.re
          // TODO 🐷
        }

        return self;
      },

      /**
       * Remove a property value.
       */
      clear() {
        return api.set(undefined as any);
      },
    };

    this._prop[name as string] = api; // Cache.
    return api;
  }

  /**
   * [Helpers]
   */

  private findColumn<K extends keyof T>(prop: K) {
    const res = this._columns.find(column => column.typeDef.prop === prop);
    if (!res) {
      const err = `Column-definition for the property '${prop}' not found.`;
      throw new Error(err);
    }
    return res;
  }
}