import '../config';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { t } from '../common';
import { Root } from '../components/Root';
import { context } from '../context';

export function render() {
  const win = (window as unknown) as t.ITopWindow;
  const env = win.env;
  const { Provider } = context.create({ env });

  /**
   * Render root React element.
   */
  const el = (
    <Provider>
      <Root />
    </Provider>
  );
  ReactDOM.render(el, document.getElementById('root'));

  /**
   * Initialize SAMPLE content.
   */
  const sample = import('../_SAMPLE/init');
  sample.then((e) => e.init());
}
