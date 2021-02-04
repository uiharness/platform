import { useEffect } from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

import { Context, Handler, Select } from '../../api/Actions';
import { R, rx, t, time } from '../../common';

type O = Record<string, unknown>;

/**
 * Controller for handling actions.
 */
export function useActionPanelController(args: { bus: t.DevEventBus; actions: t.DevActions<O> }) {
  const { bus, actions } = args;
  const ns = actions.toObject().ns;

  useEffect(() => {
    const model = actions.toModel();
    const dispose$ = new Subject<void>();
    const $ = bus.event$.pipe(
      takeUntil(dispose$),
      filter((e) => e.payload.ns === ns),
    );

    /**
     * Helpers that operate on the model within the context of this closure.
     */
    const Model = {
      change(action: t.DevActionsChangeType, fn: (draft: t.DevActionsModel<any>) => void) {
        Context.getAndStore(model, { throw: true }); // NB: This will also assign the [ctx.current] value.
        return model.change(fn, { action });
      },
      payload<T extends t.DevActionItemInput>(itemId: string, draft: t.DevActionsModel<any>) {
        const ctx = draft.ctx.current;
        const env = draft.env.viaAction;
        const { host, layout } = Handler.action({ ctx, env });
        const item = draft.items.find((item) => item.id === itemId) as T;
        return { ctx, host, item, layout, env };
      },
      find(id: string | number) {
        const items = model.state.items;
        const index = typeof id === 'number' ? id : items.findIndex((item) => item.id === id);
        const item = items[index];
        return { index, item };
      },
    };

    /**
     * INITIALIZE
     *    Setup the initial model state by invoking
     *    each value producing handler.
     */
    rx.payload<t.IDevActionsInitEvent>($, 'dev:actions/init')
      .pipe()
      .subscribe((e) => {
        // Assign initial value as current.
        model.state.items.forEach((model) => {
          if (model.kind === 'select') {
            const index = Model.find(model.id).index;
            const res = Model.change('via:init', (d) => Select.assignInitial(d.items[index]));
            if (res.changed) model = Model.find(model.id).item;
          }
        });

        // Fire event that load initial value.
        model.state.items.forEach((model) => {
          if (model.kind === 'boolean' && model.handlers.length > 0) {
            bus.fire({ type: 'dev:action/Boolean', payload: { ns, model } });
          }
          if (model.kind === 'select' && model.handlers.length > 0) {
            bus.fire({ type: 'dev:action/Select', payload: { ns, model } });
          }
        });

        // Finish up.
        model.change((draft) => (draft.initialized = true));
      });

    /**
     * Monitor for changes to individual item models and alert listeners.
     * This looks for patch changes to the path:
     *
     *    "item/<index>"
     *
     */
    model.event.changed$
      .pipe(
        filter((e) => e.op === 'update'),
        map((e) => e.patches.next.filter((p) => p.path.match(/^items\/\d+\//))),
        filter((patches) => patches.length > 0),
        map((patches) => patches.map((patch) => patch.path)),
        map((paths) => paths.map((path) => path.replace(/^items\//, ''))),
        map((paths) => paths.map((path) => parseInt(path.substring(0, path.indexOf('/'))))),
        map((indexes) => R.uniq(indexes)),
      )
      .subscribe((indexes) => {
        indexes.forEach((index) => {
          const model = Model.find(index).item;
          if (model) {
            bus.fire({
              type: 'dev:action/model/changed',
              payload: { ns, index, model },
            });
          }
        });
      });

    /**
     * Button
     */
    rx.payload<t.IDevActionButtonEvent>($, 'dev:action/Button')
      .pipe()
      .subscribe((e) => {
        const { id, handlers } = e.model;
        if (handlers.length > 0) {
          type T = t.DevActionButton;
          type P = t.DevActionButtonHandlerArgs<any>;
          type S = t.DevActionHandlerSettings<P>;
          type A = t.DevActionHandlerSettingsButtonArgs;

          Model.change('via:button', (draft) => {
            const { ctx, item, host, layout, env } = Model.payload<T>(id, draft);
            if (ctx && item) {
              const settings: S = (args) =>
                Handler.settings<P, A>({ env, payload }, (settings) => {
                  const obj = settings.button;
                  if (obj) Object.keys(obj).forEach((key) => (item[key] = obj[key]));
                })(args);
              const button = item as t.DevActionButtonProps;
              const payload: P = { ctx, host, layout, settings, button };

              /**
               * TODO 🐷
               * - put within [runtime.web] piped execution, like [runtime.node]
               * - handle async
               */

              console.log('TODO: piped [Button] handlers');

              for (const fn of handlers) {
                fn(payload);
              }
            }
          });
        }
      });

    /**
     * Boolean (Switch)
     */
    rx.payload<t.IDevActionBooleanEvent>($, 'dev:action/Boolean')
      .pipe()
      .subscribe((e) => {
        const { id, handlers } = e.model;
        if (handlers.length > 0) {
          type T = t.DevActionBoolean;
          type P = t.DevActionBooleanHandlerArgs<any>;
          type S = t.DevActionHandlerSettings<P>;
          type A = t.DevActionHandlerSettingsBooleanArgs;

          Model.change('via:boolean', (draft) => {
            const { ctx, item, host, layout, env } = Model.payload<T>(id, draft);
            if (ctx && item) {
              const settings: S = (args) =>
                Handler.settings<P, A>({ env, payload }, (settings) => {
                  const obj = settings.boolean;
                  if (obj) Object.keys(obj).forEach((key) => (item[key] = obj[key]));
                })(args);
              const changing = e.changing;
              const boolean = item as t.DevActionBooleanProps;
              const payload: P = { ctx, changing, host, layout, settings, boolean };
              if (changing) item.current = changing.next;

              /**
               * TODO 🐷
               * - put within [runtime.web] piped execution, like [runtime.node]
               * - handle async
               */

              console.log('TODO: piped [Boolean] handlers');

              for (const fn of handlers) {
                fn(payload);
              }
            }
          });
        }
      });

    /**
     * Select (dropdown)
     */
    rx.payload<t.IDevActionSelectEvent>($, 'dev:action/Select')
      .pipe()
      .subscribe((e) => {
        const { id, handlers } = e.model;
        if (handlers.length > 0) {
          type T = t.DevActionSelect;
          type P = t.DevActionSelectHandlerArgs<any>;
          type S = t.DevActionHandlerSettings<P>;
          type A = t.DevActionHandlerSettingsSelectArgs;

          Model.change('via:select', (draft) => {
            const { ctx, item, host, layout, env } = Model.payload<T>(id, draft);
            if (ctx && item) {
              const settings: S = (args) =>
                Handler.settings<P, A>({ env, payload }, (settings) => {
                  const obj = settings.select;
                  if (obj) Object.keys(obj).forEach((key) => (item[key] = obj[key]));
                })(args);
              const changing = e.changing;
              const select = item as t.DevActionSelectProps;
              const payload: P = { ctx, changing, host, layout, settings, select };
              if (changing) item.current = changing.next; // Update the item to the latest selection.

              /**
               * TODO 🐷
               * - put within [runtime.web] piped execution, like [runtime.node]
               * - handle async
               */

              console.log('TODO: piped [Select] handlers');

              for (const fn of handlers) {
                fn(payload);
              }
            }
          });
        }
      });

    /**
     * INITIALIZE: Setup initial state.
     * NOTE:
     *    The delayed tick allows all components to setup their hooks
     *    before the initial state configuration is established.
     */
    time.delay(0, () => bus.fire({ type: 'dev:actions/init', payload: { ns } }));

    return () => dispose$.next();
  }, [bus, actions, ns]);
}
