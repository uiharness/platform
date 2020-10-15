import '@platform/polyfill';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Subject } from 'rxjs';

console.log('entry', 'hello world.');

(async () => {
  class Foo {
    public static count = 123;
  }
  new Foo();

  // @ts-ignore
  const f = import('foo/Header');
  f.then((e) => console.log('e', e.foo()));

  // @ts-ignore
  const ide = await import('foo/CodeEditor');

  console.log('ide', ide);

  const CodeEditor = ide.CodeEditor;
  console.log('f1', CodeEditor);

  const App = () => {
    const style = { fontFamily: 'sans-serif', WebkitAppRegion: 'drag' };
    return (
      <div style={style}>
        <h1>Hello World!..</h1>
        <div
          style={{
            position: 'absolute',
            top: 100,
            left: 30,
            width: 300,
            height: 200,
            backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
          }}
        >
          <CodeEditor />
        </div>
      </div>
    );
  };

  const within = document.body.appendChild(document.createElement('div'));
  ReactDOM.render(<App />, within);
})();

// type F = { count: number };
// const f: F = {};
// const foo = 123;

/**
 * Insert some UI
 */

const s = new Subject();
s.subscribe((e) => console.log('e > ', e));
Array.from({ length: 10 }).forEach((v, i) => s.next(i));
