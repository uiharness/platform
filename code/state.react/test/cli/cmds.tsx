import { Command, t, value } from '../common';

type P = t.ITestCommandProps & { count: number };

export const root = Command.create<P>('root')
  .add('increment', e => {
    const store = e.props.store;
    const by = value.toNumber(e.args.params[0] || 1);
    store.dispatch({ type: 'TEST/increment', payload: { by } });
  })
  .add('decrement', e => {
    const store = e.props.store;
    const by = value.toNumber(e.args.params[0] || 1);
    store.dispatch({ type: 'TEST/decrement', payload: { by } });
  });
