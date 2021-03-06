import * as React from 'react';

import { Module, t } from './common';

type P = t.TmplProps;

export const TmplModule: t.TmplModuleDef = {
  /**
   * ENTRY: Initialize a new module from the definition.
   * To complete registration:
   *
   *    const module = TmplModule.init(bus)
   *    Module.register(bus, module, parent)
   *
   */
  module(bus) {
    const module = Module.create<P>({
      bus,
      root: {
        id: 'tmpl',
        props: { treeview: { label: 'Template' }, view: 'Default' },
      },
    });

    /**
     * Setup event pub/sub.
     */
    const match: t.ModuleFilterEvent = (e) => e.module == module.id || module.contains(e.module);
    const events = Module.events<P>(Module.filter(bus.event$, match), module.dispose$);
    const fire = Module.fire<P>(bus);

    /**
     * STRATEGY: render user-interfaces.
     */
    renderer(events);
    events.selection$.subscribe((e) => {
      const { view, data } = e;
      fire.render({ module, data, view, notFound: '404' });
    });

    return module;
  },
};

/**
 * UI: View factory for the module.
 */
function renderer(events: t.IViewModuleEvents<P>) {
  const render = events.render;

  render('Default').subscribe((e) => {
    const el = <div style={{ padding: 20 }}>Shell</div>;
    e.render(el);
  });

  /**
   * Wildcard.
   */
  render('404').subscribe((e) => {
    const el = <div style={{ padding: 20 }}>Shell (404)</div>;
    e.render(el);
  });
}
