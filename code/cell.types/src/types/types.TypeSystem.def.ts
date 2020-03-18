import { t } from '../common';

/**
 * Type Payload
 * (NB: can write directly to HTTP client )
 */
export type ITypeDefPayload = {
  ns: t.INsProps;
  columns: t.IColumnMap;
};

/**
 * Tokenizer
 */
export type ITypeToken = {
  input: string;
  kind: 'VALUE' | 'GROUP' | 'GROUP[]';
  text: string;
  next: string;
};

/**
 * Type Definitions.
 */
export type INsTypeDef = {
  ok: boolean;
  uri: string;
  typename: string;
  columns: t.IColumnTypeDef[];
  errors: t.ITypeError[];
};

export type IColumnTypeDef = ITypeDef & {
  column: string;
  target?: t.CellTypeTarget;
  error?: t.ITypeError;
};

export type ITypeDef = {
  prop: string;
  optional?: boolean;
  type: IType;
};

/**
 * Walk
 */

export type TypeVisit = (args: TypeVisitArgs) => void;
export type TypeVisitArgs = {
  level: number;
  path: string;
  root: t.IType;
  type: t.IType;
  prop?: string;
  optional?: boolean;
};

/**
 * Types
 */
export type ITypePrimitives = {
  string: t.ITypeValue;
  number: t.ITypeValue;
  boolean: t.ITypeValue;
  null: t.ITypeValue;
  undefined: t.ITypeValue;
};

export type IType = ITypeValue | ITypeEnum | ITypeUnion | ITypeRef | ITypeUnknown;

export type ITypeUnion = {
  kind: 'UNION';
  typename: string;
  isArray?: boolean;
  types: IType[];
};

export type ITypeRef = {
  kind: 'REF';
  scope: 'NS' | 'COLUMN' | 'UNKNOWN';
  uri: string;
  typename: string;
  isArray?: boolean;
  types: ITypeDef[];
};

export type ITypeValue = {
  kind: 'VALUE';
  typename: keyof ITypePrimitives;
  isArray?: boolean;
};

export type ITypeEnum = {
  kind: 'ENUM';
  typename: string;
  isArray?: boolean;
};

export type ITypeUnknown = {
  kind: 'UNKNOWN';
  typename: string;
  isArray?: boolean;
};