import { Subject } from 'rxjs';

import { CommandState, t } from '../common';
import { root, OBJECT } from './cmds';

export { OBJECT as SAMPLE };

export function init(args: { state$: Subject<Partial<t.ITestState>> }) {
  const { state$ } = args;

  return CommandState.create({
    root,
    beforeInvoke: async e => {
      const props: t.ICommandProps = {
        ...e.props,
        state$,
        next: state => state$.next(state),
      };
      return { props };
    },
  });
}
