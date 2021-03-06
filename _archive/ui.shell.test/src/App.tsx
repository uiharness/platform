import * as React from 'react';

import { is, shell } from './common';
import * as splash from './splash';

shell
  // Register application modules.
  .main('main', () => import('./modules/main'))
  .register('Sidebar', () => import('./modules/Sidebar'))
  .register('Doc', () => import('./modules/Doc'))
  .register('Sheet', () => import('./modules/Sheet'))
  .register('Footer', () => import('./modules/Footer'))
  .initial({});

export class App extends React.PureComponent {
  /**
   * [Properties]
   */
  private get loadDelay() {
    const delay = is.dev ? 1500 : 500; // NB: Simulate latency.
    return delay;
  }

  /**
   * [Render]
   */
  public render() {
    return <shell.Loader splash={splash.factory} theme={'DARK'} loadDelay={this.loadDelay} />;
  }
}
