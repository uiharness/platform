import { t } from '../common';

/**
 * Reference to the type of a [column] or individual [cell].
 * Either:
 *
 *  - a simple primitive type: [string], [number], [boolean].
 *
 *  - or a reference to a complex type defined in another sheet via:
 *
 *      "=ref:<ns:uri>", or
 *      "=inline:<ns:uri>"
 *
 *    the prefix "ref" or "inline" dictate whether the corresponding
 *    complex object is stored in a seperate/linked sheet ("ref"), or
 *    is stored locally within the cell ("inline").
 *
 */
export type CellType = string;
export type CellTypeProp = { name: string; type: CellType; target?: CellTypeTarget };
export type CellTypeTarget = string;

export type CellTypeTargetInfo = {
  target: string;
  isValid: boolean;
  isInline: boolean;
  isRef: boolean;
  errors: t.IError[];
  kind: 'inline' | 'ref' | 'UNKNOWN';
  path: string;
  toString(): string;
};

/**
 * Reference to a namespace that contains the type definitions for the sheet.
 */
export type INsType = {
  typename?: string; //     Name of the complex type/object this namespace defines.
  implements?: string; //   URI of another namespace containing the type definition to conform to.
};