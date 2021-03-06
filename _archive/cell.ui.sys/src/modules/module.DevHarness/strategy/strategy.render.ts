import { filter, map, takeUntil } from 'rxjs/operators';

import { Module, rx, t } from '../common';
import { IHostPropsRenderer } from '../components/Host';
import { renderer } from '../components/render';

type E = t.HarnessEvent;
type P = t.HarnessProps;
type O = Record<string, unknown>;

const MAIN: t.HarnessRegion = 'Main';
const SIDEBAR: t.HarnessRegion = 'Sidebar';

/**
 * Listens for DevHarness render requests.
 */
export function renderStrategy(args: { harness: t.HarnessModule; bus: t.EventBus<E> }) {
  const { harness, bus } = args;
  const fire = Module.fire(bus);
  const $ = bus.event$.pipe(takeUntil(harness.dispose$));

  /**
   * Setup the UI <component> renderer.
   */
  const match: t.ModuleFilterEvent = (e) => e.module == harness.id;
  const events = Module.events<P>(Module.filter(bus.event$, match), harness.dispose$);
  renderer({ harness, bus, events });

  /**
   * Render a harness component
   * (as opposed to content from within a "dev" module using the harness).
   */
  const renderHarness = (region: t.HarnessRegion, view: t.HarnessView, data?: O) => {
    const state = harness.state.props?.data;
    const target = state?.kind === 'harness.root' ? state.shell : undefined;
    if (target) {
      fire.render({
        module: harness.id,
        target,
        region,
        view,
        data,
      });
    }
  };

  /**
   * Render "dev" component content.
   */
  const renderContent = (
    region: t.HarnessRegion,
    module: string,
    view: string,
  ): t.ModuleFireRenderResponse => {
    return fire.render({ module, view, region });
  };
  const renderContentNode = (module: string, node: t.ITreeNode<P>): t.ModuleFireRenderResponse => {
    const view = pluck(node)?.view.component;
    let res: t.ModuleFireRenderResponse;
    if (view) {
      res = renderContent(MAIN, module, view);
    }
    (node.children || []).forEach((child) => {
      renderContentNode(module, child); // <== RECURSION 🌳
    });

    return res;
  };

  /**
   * Listen for Harness render requests.
   */
  const render$ = rx.payload<t.IHarnessRenderEvent>($, 'Harness/render').pipe(
    filter((e) => e.harness === harness.id),
    map(({ module, view, host }) => ({ module, view, host: host as t.IDevHost })),
  );

  /**
   * HANDLE: A host configuration exists. This is a "component under test" rendering.
   */
  render$.pipe(filter((e) => Boolean(e.host))).subscribe((e) => {
    const { host, module } = e;

    if (host.view.component) {
      // Render the root component HOST.
      const view = host.view.component;
      renderHarness(MAIN, 'Host', { view });

      // Render content and any child components.
      const node = harness.find(module)?.query.find((e) => pluck(e.node).view.component === view);
      if (node) {
        renderContentNode(module, node);
      }
    }

    if (host.view.sidebar) {
      const res = renderContent(SIDEBAR, module, host.view.sidebar);
      if (!res) {
        renderHarness(SIDEBAR, 'Null'); // The sidebar did not result in any UI, make sure it is cleared.
      }
    }
  });

  /**
   * HANDLE: No host configuration - this is a "standard" module rendering.
   */
  render$
    .pipe(
      filter((e) => !Boolean(e.host)),
      map(({ module, view }) => ({ module, view: view || '' })),
    )
    .subscribe(({ module, view }) => {
      // There is no specific host information on the node,
      // so construct some defaults to pass over to the renderer.
      const margin = 50;
      const data: IHostPropsRenderer = {
        view,
        layout: {
          background: 1,
          cropmarks: false,
          position: { absolute: { top: margin, right: margin, bottom: margin, left: margin } },
        },
      };

      renderHarness(MAIN, 'Host', data);
      const res = renderContent(MAIN, module, view);

      if (!res) {
        // No renderers fulfilled the request, fallback to "Not Found".
        renderHarness(MAIN, '404');
        renderHarness(SIDEBAR, 'Null');
      }
    });
}

/**
 * [Helpers]
 */

/**
 * Pluck data from a node.
 */
function pluck(node?: t.ITreeNode<P>) {
  const data = node?.props?.data;
  const host = data?.kind === 'harness.component' ? data.host : undefined;
  const view = host?.view || {};
  return { host, view };
}
