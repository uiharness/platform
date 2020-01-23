import { css } from '@platform/react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Foo } from './component';

console.log('👋 Hello World from Typescript');

// const f = import('./m');
// f.then(e => {
//   console.log('e', e);
// });

// Setup global styles.
css.global({
  body: {
    fontFamily: 'Sans-Serif',
  },
});

// Render root react element.
const el = document.getElementById('root');
const app = <Foo />;
ReactDOM.render(app, el);
