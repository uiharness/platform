import { ui } from '..';
import { Client, expect, rx, t } from '../test';

describe('Context', () => {
  it('has display name', () => {
    expect(ui.Context.displayName).to.eql('@platform/cell.ui/Context');
  });

  it('creates provider', () => {
    const host = 'localhost:1234';
    const client = Client.typesystem(host);
    const def = 'cell:foo:1';
    const env = { def } as any;
    const bus = rx.bus();
    const ctx: t.IEnvContext = { env, client, bus };

    const res1 = ui.createProvider({ ctx });
    const res2 = ui.createProvider({ ctx, props: { foo: 123 } });

    expect(res1).to.be.an.instanceof(Function);
    expect(res2).to.be.an.instanceof(Function);
  });
});
