import * as React from 'react';

export * from './theme/types';
import { IPropsTheme } from './theme/types';

export type PropsData = Record<string, unknown> | PropArray;
export type PropScalar = string | boolean | number | null | undefined;
export type PropArray = Array<PropScalar | Record<string, unknown>>;
export type PropValue = PropScalar | PropArray | Record<string, unknown> | Function; // eslint-disable-line

export type PropDataObjectType = 'object' | 'array';
export type PropObjectType = PropDataObjectType | 'function';
export type PropTypeScalar = 'string' | 'boolean' | 'number';
export type PropEmptyType = 'null' | 'undefined';
export type PropType = PropTypeScalar | PropEmptyType | PropObjectType;

export type PropValueFactory = (
  e: PropValueFactoryArgs,
) => PropValueFactoryResponse | undefined | void;

export type PropValueFactoryResponse = {
  el?: React.ReactNode;
  underline?: {
    color: string | number;
    style: 'solid' | 'dashed';
  };
};

export type PropValueFactoryArgs = {
  path: string;
  key: string | number;
  value: PropValue;
  type: PropType;
  theme: IPropsTheme;
  change(args: { to: string }): void;
  onFocus(isFocused: boolean): void;
};

export type PropFilter = (e: PropFilterArgs) => boolean;
export type PropFilterArgs = {
  path: string;
  key: string | number;
  value: PropValue;
  type: PropType;
};

/**
 * [Events]
 */
export type PropsEvent = IPropsChangedEvent | IPropsFocusEvent;

export type IPropsChangedEvent<D extends PropsData = any> = {
  type: 'PROPS/changed';
  payload: IPropsChange<D>;
};
export type IPropsChange<D extends PropsData = any> = {
  action: PropChangeAction;
  path: string;
  key: string | number;
  value: { from: PropValue; to: PropValue };
  data: { from: D; to: D };
};
export type PropChangeAction = 'CHANGE' | 'INSERT' | 'DELETE';

export type IPropsFocusEvent = {
  type: 'PROPS/focus';
  payload: IPropsFocus;
};
export type IPropsFocus = {
  isFocused: boolean;
  path: string;
};
