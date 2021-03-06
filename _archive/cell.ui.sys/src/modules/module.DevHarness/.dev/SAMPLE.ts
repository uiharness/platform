import { SampleModule } from '../../../components.dev/module.Sample';
import { t } from '../common';
import { OneModule } from './module.One';
import { ThreeModule } from './module.Three';
import { TwoModule } from './module.Two';

/**
 * Simulate module insertion into DevHarness.
 */
export async function SAMPLE(bus: t.EventBus) {
  const fire = bus.type<t.HarnessEvent>().fire;

  const sample = SampleModule.init(bus);
  const one = OneModule.dev(bus);
  const two = TwoModule.init(bus);
  const three = ThreeModule.init(bus);

  fire({ type: 'Harness/add', payload: { module: one.id } });
  fire({ type: 'Harness/add', payload: { module: one.id } }); // NB: Does not fail (double-entry)
  fire({ type: 'Harness/add', payload: { module: two.id } });
  fire({ type: 'Harness/add', payload: { module: three.id } });

  fire({ type: 'Harness/add', payload: { module: sample.id } });
}
