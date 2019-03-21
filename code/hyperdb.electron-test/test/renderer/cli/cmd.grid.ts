import { Command } from '../common';
import * as t from './types';

type P = t.ITestCommandProps;

/**
 * [grid] editor.
 */
export const grid = Command.create<P>('grid').add('history', e => {
  console.log('history', e);
  // let cellKey = e.args.params[0];
  // if (cellKey && typeof cellKey === 'string' && cellKey.trim()) {
  //   cellKey = cellKey.trim();
  //   e.props.events$.next({ type: 'CLI/editor/cell', payload: { cellKey } });
  // }
});
