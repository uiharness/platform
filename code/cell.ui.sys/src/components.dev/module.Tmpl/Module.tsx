import * as React from 'react';

import { Module, t } from './common';

type P = t.TmplProps;

export const TmplModule: t.TmplModuleDef = {
  /**
   * ENTRY: Initialize a new module from the definition.
   */
  init(bus, parent) {
    const module = Module.create<P>({
      bus,
      root: { id: 'tmpl', props: { treeview: { label: 'Template' }, view: 'DEFAULT' } },
    });
    Module.register(bus, module, parent);

    /**
     * Setup event pub/sub.
     */
    const match: t.ModuleFilterEvent = (e) => e.module == module.id || module.contains(e.module);
    const events = Module.events<P>(Module.filter(bus.event$, match), module.dispose$);
    const fire = Module.fire<P>(bus);

    /**
     * STRATEGY: render user-interface.
     */
    renderer(events);
    events.selection$.subscribe((e) => {
      const { view, data } = e;
      const selected = e.selection?.id;
      fire.render({ selected, module, data, view, notFound: '404' });
    });

    return module;
  },
};

/**
 * UI: View factory for the module.
 */
function renderer(events: t.IViewModuleEvents<P>) {
  const render = events.render;

  render('DEFAULT').subscribe((e) => {
    const el = <div style={{ padding: 20 }}>Template</div>;
    e.render(el);
  });

  /**
   * Wildcard.
   */
  render('404').subscribe((e) => {
    const el = <div style={{ padding: 20 }}>Template (404)</div>;
    e.render(el);
  });
}