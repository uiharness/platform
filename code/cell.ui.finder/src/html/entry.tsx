console.log("hello", 123)

import '../config';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

// import { t } from '../common';
// import { Root } from '../components/Finder.Root';
import { behavior } from './entry.behavior';

// const win = (window as unknown) as t.ITopWindow;
// const env = win.env;

/**
 * Render root React element.
 */


const uri = 'cell:cka0c7a0i00004369o5ttdbt3:A1'; // TEMP 🐷
const event$ = behavior({ uri }).event$;
console.log("event$", event$)

// const el = <Root env={env} uri={uri} event$={event$} />;
// ReactDOM.render(el, document.getElementById('root'));
