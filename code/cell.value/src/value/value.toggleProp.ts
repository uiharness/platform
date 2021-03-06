import { t } from '../common';
import { setProp } from './value.setProp';
import { isEmptyCellProps } from './value.isEmpty.cell';
import { isEmptyColumnProps } from './value.isEmpty.column';
import { isEmptyRowProps } from './value.isEmpty.row';
import { isEmptyNsProps } from './value.isEmpty.ns';

type Props = t.ICellProps | t.IRowProps | t.IColumnProps | t.INsProps;

/**
 * Toggles the given [boolean] property field, removing it from the object
 * if it is the default value.
 */
export function toggleProp<P extends Props, K extends keyof P>(args: {
  props?: Partial<P>;
  defaults: P[K];
  section: K;
  field: keyof P[K];
  isEmpty: (props?: P) => boolean;
}): P | undefined {
  const props = args.props || {};
  const field = args.field as string;
  const section = (props[args.section as string] || {}) as Record<string, unknown>;
  const value = section[field] === undefined ? args.defaults[field] : section[field];

  if (!(value === undefined || typeof value === 'boolean')) {
    return props as P; // NB: non-supported value type for toggling.
  }
  const toggled: any = typeof value === 'boolean' ? !value : true;
  return setProp<P, K>({ ...args, value: toggled });
}

/**
 * Toggles the cell [boolean] property value.
 */
export function toggleCellProp<P extends t.ICellProps, K extends keyof P>(args: {
  props?: Partial<P>;
  defaults: P[K];
  section: K;
  field: keyof P[K];
}): P | undefined {
  return toggleProp<P, K>({ ...args, isEmpty: isEmptyCellProps });
}

/**
 * Toggles the row [boolean] property value.
 */
export function toggleRowProp<P extends t.IRowProps, K extends keyof P>(args: {
  props?: Partial<P>;
  defaults: P[K];
  section: K;
  field: keyof P[K];
}): P | undefined {
  return toggleProp<P, K>({ ...args, isEmpty: isEmptyRowProps });
}

/**
 * Toggles the column [boolean] property value.
 */
export function toggleColumnProp<P extends t.IColumnProps, K extends keyof P>(args: {
  props?: Partial<P>;
  defaults: P[K];
  section: K;
  field: keyof P[K];
}): P | undefined {
  return toggleProp<P, K>({ ...args, isEmpty: isEmptyColumnProps });
}

/**
 * Toggles the namespace [boolean] property value.
 */
export function toggleNsProp<P extends t.INsProps, K extends keyof P>(args: {
  props?: Partial<P>;
  defaults: P[K];
  section: K;
  field: keyof P[K];
}): P | undefined {
  return toggleProp<P, K>({ ...args, isEmpty: isEmptyNsProps });
}
