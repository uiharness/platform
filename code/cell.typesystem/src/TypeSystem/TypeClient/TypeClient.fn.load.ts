import { Subject } from 'rxjs';

import { deleteUndefined, ERROR, ErrorList, R, t, Uri, value as valueUtil } from '../../common';
import { TypeCache } from '../TypeCache';
import { TypeDefault } from '../TypeDefault';
import { TypeValue } from '../TypeValue';
import { formatNsUri } from '../util';
import * as valdiate from './TypeClient.fn.validate';
import { TypeProp } from '../TypeProp';

type Visit = { ns: string; level: number };
type Context = {
  fetch: t.ISheetFetcher;
  errors: ErrorList;
  visited: Visit[];
  cache: t.IMemoryCache;
};

const toCacheKey = (uri: string, ...path: string[]) => {
  const suffix = path.length === 0 ? '' : `/${path.join('/')}`;
  return `TypeClient/${uri.toString()}${suffix}`;
};

/**
 * Load a type-definition from the network.
 */
export async function load(args: {
  ns: string | t.INsUri;
  fetch: t.ISheetFetcher;
  cache?: t.IMemoryCache;
}): Promise<t.INsTypeDef[]> {
  const ns = formatNsUri(args.ns, { throw: false }).toString();

  // Check cache (if an external cache was provided).
  if (args.cache) {
    const key = toCacheKey(ns.toString());
    const value = args.cache.get(key);
    if (value instanceof Subject) {
      // NB: The load operation for the namespace currently in progress.
      //     Wait for the first request to complete.
      const res = await value.toPromise();
      // return [res]; // TEMP 🐷
    } else if (typeof value === 'object') {
      // Namespace already loaded within the cache.
      // return [value] as t.INsTypeDef[]; // TEMP 🐷
    }
  }

  const cache = TypeCache.toCache(args.cache);
  const fetch = TypeCache.fetch(args.fetch, { cache });
  const errors = ErrorList.create({ defaultType: ERROR.TYPE.DEF });
  const ctx: Context = { fetch, cache, errors, visited: [] };

  const res = await loadNamespace({ ns, ctx, level: 0 });
  return res; // TEMP 🐷
}

/**
 * [INTERNAL]
 */

/**
 * Loads the given namespace.
 */
async function loadNamespace(args: {
  level: number;
  ns: string;
  ctx: Context;
}): Promise<t.INsTypeDef[]> {
  const { level, ctx } = args;
  const { visited, cache, fetch, errors } = ctx;
  const ns = formatNsUri(args.ns, { throw: false }).toString();

  // Cache.
  const cacheKey = toCacheKey(ns);
  const loading$ = new Subject<t.INsTypeDef>();
  cache.put(cacheKey, loading$);
  loading$.subscribe(def => cache.put(cacheKey, def));

  const groupByTypename = (columns: t.IColumnTypeDef[]) => {
    const ERROR = '___ERROR___';
    const groups = R.groupBy(def => {
      const res = TypeProp.parse(def);
      return res.error ? ERROR : res.type;
    }, columns);
    delete groups[ERROR];
    Object.keys(groups).forEach(typename => {
      groups[typename].forEach(item => {
        item.prop = item.prop.substring(typename.length + 1);
      });
    });
    return groups;
  };

  const toTypeDef = (args: { typename: string; columns: t.IColumnTypeDef[] }) => {
    const { typename, columns } = args;
    const uri = ns;

    const columnErrors = columns.reduce(
      (acc, { error }) => (error ? [...acc, error] : acc),
      [] as t.ITypeError[],
    );

    let typeDef: t.INsTypeDef = {
      ok: errors.ok,
      uri,
      typename,
      columns,
      errors: [],
    };

    // Validate and prepare final error list.
    valdiate.ns({ ns, typeDef, errors });
    const errs = R.uniq([...errors.list, ...columnErrors]);
    const ok = errs.length === 0;
    typeDef = { ...typeDef, ok, errors: errs };

    // Finish up.
    loading$.next(typeDef);
    loading$.complete();
    return typeDef;
  };

  // Prepare return object.
  const done = (args: { columns?: t.IColumnTypeDef[] } = {}) => {
    const { columns = [] } = args;
    const groups = groupByTypename(columns);
    return Object.keys(groups).map(typename => toTypeDef({ typename, columns: groups[typename] }));
  };

  // Validate the URI.
  const uri = Uri.parse<t.INsUri>(ns);
  if (uri.error) {
    const message = `Invalid namespace URI (${args.ns}). ${uri.error.message}`;
    errors.add(ns, message);
  }
  if (uri.parts.type !== 'NS') {
    const message = `Invalid namespace URI. Must be "ns", given: [${args.ns}]`;
    errors.add(ns, message);
  }

  if (!errors.ok) {
    return done();
  }

  try {
    // Retrieve namespace.
    const fetchedType = await fetch.getType({ ns }); // TEMP 🐷

    if (!fetchedType.exists) {
      const message = `The namespace "${ns}" does not exist.`;
      errors.add(ns, message, { errorType: ERROR.TYPE.NOT_FOUND });
      return done();
    }
    if (fetchedType.error) {
      errors.add(ns, fetchedType.error.message);
      return done();
    }
    if (fetchedType.type.implements === ns) {
      const message = `The namespace (${ns}) cannot implement itself (circular-ref).`;
      errors.add(ns, message, { errorType: ERROR.TYPE.REF_CIRCULAR });
      return done();
    }

    // Retrieve columns.
    const fetchedColumns = await fetch.getColumns({ ns });
    const { columns } = fetchedColumns;
    if (fetchedColumns.error) {
      errors.add(ns, fetchedColumns.error.message);
      return done();
    }

    // Check for any self-references.
    const selfRefs = getSelfRefs({ ns, columns });
    if (selfRefs.length > 0) {
      const keys = selfRefs.map(item => item.key);
      const message = `The namespace (${ns}) directly references itself in column [${keys}] (circular-ref).`;
      errors.add(ns, message, { errorType: ERROR.TYPE.REF_CIRCULAR });
      return done();
    }

    visited.push({ ns, level });

    // Read in type details for each column.
    return done({
      columns: await readColumns({ level, ns, columns, ctx }),
    });
  } catch (error) {
    // Failure.
    errors.add(ns, `Failed while loading type for "${ns}". ${error.message}`);
    return done();
  }
}

function isCircularRef(args: { level: number; ns: string; ctx: Context }) {
  const { level, ns, ctx } = args;
  const { visited, errors } = ctx;

  const isCircular = visited.some(visit => visit.ns === ns && visit.level < level);
  if (isCircular) {
    const path = visited.map(visit => `${visit.ns}`).join(' ➔ ');
    const message = `The namespace "${ns}" leads back to itself (circular reference). Sequence: ${path}`;
    errors.add(ns, message, { errorType: ERROR.TYPE.REF_CIRCULAR });
  }
  return isCircular;
}

/**
 * Read and parse type definitions for the given columns.
 */
async function readColumns(args: {
  level: number;
  ns: string;
  columns: t.IColumnMap;
  ctx: Context;
}): Promise<t.IColumnTypeDef[]> {
  const { ns, level, ctx } = args;
  const { errors } = ctx;

  const withProps = (column: string) => {
    const props = args.columns[column]?.props?.def as t.CellTypeDef;
    return { column, props };
  };

  // Short-circuit any circular references.
  if (isCircularRef({ level, ns, ctx })) {
    return [];
  }

  // Read columns in (either parsing simple types, or retrieve REFs from network).
  const wait = Object.keys(args.columns)
    .map(column => withProps(column))
    .filter(({ props }) => Boolean(props))
    .map(({ column, props }) => {
      return readColumn({ level, ns, column, props, ctx });
    });

  const columns = R.sortBy(R.prop('column'), await Promise.all(wait));

  // Finish up.
  valdiate.columns({ ns, columns, errors });
  return columns;
}

async function readColumn(args: {
  level: number;
  ns: string;
  column: string;
  props: t.CellTypeDef;
  ctx: Context;
}): Promise<t.IColumnTypeDef> {
  const { ns, column, level, ctx } = args;
  const target = args.props.target;
  let type = deleteUndefined(TypeValue.parse(args.props.type).type);
  let error: t.ITypeError | undefined;

  let prop = (args.props.prop || '').trim();
  const optional = prop.endsWith('?') ? true : undefined;
  prop = optional ? prop.replace(/\?$/, '') : prop;

  let defaultValue = args.props.default;

  if (type.kind === 'REF') {
    const res = await readRef({ level, ns, column, ref: type, ctx });
    type = res.type;
    error = res.error ? res.error : error;
    defaultValue = defaultValue === undefined ? res.default : defaultValue; // NB: Use the closest default value to the declaration. Import from REF is not declared locally.
  }

  if (type.kind === 'UNION') {
    const union = type;
    await readUnionRefs({ level, ns, column, union, ctx });
  }

  if (type.kind === 'UNION') {
    const union = type;
    union.typename = TypeValue.toTypename(union);
  }

  const def: t.IColumnTypeDef = {
    column,
    prop,
    optional,
    type,
    target,
    default: await toDefaultDef({ default: defaultValue, ctx }),
    error,
  };
  return valueUtil.deleteUndefined(def);
}

async function toDefaultDef(args: {
  default: t.CellTypeDef['default'];
  ctx: Context;
}): Promise<t.ITypeDefault | undefined> {
  const { ctx } = args;

  const done = (result: t.ITypeDefault) => {
    return R.equals(result, { value: undefined }) ? undefined : result;
  };

  if (TypeDefault.isTypeDefaultRef(args.default)) {
    const { fetch } = ctx;
    const def = args.default as t.ITypeDefaultRef;
    const ref = await TypeDefault.toRefValue({ def, fetch });
    const value = ref.value as t.TypeDefaultValue;
    const res: t.ITypeDefaultValue = { value };
    return done(res);
  } else {
    return done(TypeDefault.toTypeDefault(args.default));
  }
}

/**
 * Recursively walk a union, loading any REFs.
 */
async function readUnionRefs(args: {
  level: number;
  ns: string;
  column: string;
  union: t.ITypeUnion;
  ctx: Context;
}) {
  const { level, ns, column, union, ctx } = args;

  let index = 0;
  for (const type of union.types) {
    if (type.kind === 'REF') {
      const res = await readRef({ level, ns, column, ref: type, ctx });
      Object.keys(res.type).forEach(key => (type[key] = res.type[key])); // NB: Copy all values onto the union child.
    }

    if (type.kind === 'UNION') {
      await readUnionRefs({ level: level + 1, ns, column, union: type, ctx }); // <== 🌳RECURSION
    }

    index++;
  }
}

/**
 * Populate a type REF from the network.
 */
async function readRef(args: {
  level: number;
  ns: string;
  column: string;
  ref: t.ITypeRef;
  ctx: Context;
}): Promise<{ type: t.IType; default?: t.ITypeDef['default']; error?: t.ITypeError }> {
  const { ns, column, ref, level, ctx } = args;

  const isColumn = Uri.is.column(ref.uri);
  const columnUri = isColumn ? Uri.parse<t.IColumnUri>(ref.uri) : undefined;
  const nsUri = columnUri ? Uri.create.ns(columnUri.parts.ns) : ref.uri;
  const unknown: t.ITypeUnknown = { kind: 'UNKNOWN', typename: nsUri };

  if (!Uri.is.ns(nsUri)) {
    ctx.errors.add(ns, `The referenced type in column '${column}' is not a namespace.`, { column });
    return { type: unknown };
  }

  // Retrieve the referenced namespace.
  const loadResponse = (
    await loadNamespace({
      level: level + 1,
      ns: nsUri,
      ctx,
    })
  )[0]; // TEMP 🐷 - index[0]
  // <== RECURSION 🌳

  // Check for errors.
  if (loadResponse.errors.length > 0) {
    const msg = `Failed to load the referenced type in column '${column}' (${nsUri}).`;
    const children = loadResponse.errors;
    return {
      type: unknown,
      error: ctx.errors.add(ns, msg, { column, children, errorType: ERROR.TYPE.REF }),
    };
  }

  // Build the REF object.
  if (columnUri) {
    // Column REF.
    const columnDef = loadResponse.columns.find(item => item.column === columnUri.parts.key);
    if (!columnDef) {
      const uri = columnUri.toString();
      const msg = `The referenced column-type in column '${column}' (${uri}) does not exist in the retrieved namespace.`;
      return {
        type: unknown,
        error: ctx.errors.add(ns, msg, { errorType: ERROR.TYPE.REF }),
      };
    }

    return {
      type: columnDef.type,
      default: columnDef.default,
    };
  } else {
    // Namespace REF.
    const { typename } = loadResponse;

    const types: t.ITypeDef[] = loadResponse.columns.map(item => {
      const { prop, type, optional } = item;
      return {
        prop,
        type,
        optional,
        default: item.default,
      };
    });

    const type: t.ITypeRef = { ...ref, typename, types };
    return { type };
  }
}

/**
 * Examine a set of columns looking for any columns that REF themselves.
 *
 *    columns: {
 *      A: { props: { def: { name: 'A', type: 'ns:foo' } } },     <== Not OK (self, ns)
 *      B: { props: { def: { name: 'B', type: 'cell:foo!A' } } }, <== Not OK (self, different column)
 *      C: { props: { def: { name: 'C', type: 'cell:foo!C' } } }, <== Not OK (self, column)
 *    },
 *
 */
const getSelfRefs = (args: { ns: string; columns: t.IColumnMap }) => {
  const { columns } = args;
  const ns = Uri.parse<t.INsUri>(args.ns);
  return Object.keys(columns)
    .map(key => ({ key, column: columns[key] }))
    .map(e => ({ ...e, type: e.column?.props?.def?.type as string }))
    .filter(e => Boolean(e.type))
    .filter(e => Uri.is.uri(e.type))
    .map(e => ({ ...e, uri: Uri.parse(e.type) }))
    .map(e => ({ ...e, kind: e.uri.parts.type }))
    .filter(({ key, type, uri }) => {
      if (type === ns.uri) {
        return true; // Self referencing NAMESPACE.
      }
      if (uri.parts.type === 'COLUMN' && uri.parts.ns === ns.parts.id) {
        return true; // Self referencing COLUMN.
      }
      return false;
    });
};