import * as t from '../types';
export * from '../types';

/**
 * Extension point of the context passed down through
 * the React hierarchy.
 */
export type IMyContext = t.ILoaderContext & {
  foo: string;
  bar: number;
};
