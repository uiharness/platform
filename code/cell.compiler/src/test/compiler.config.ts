import { Compiler } from '..';
export { Compiler };

export function configure() {
  return Compiler.config
    .create('home')
    .url(1234)
    .entry('./src/test/entry')
    .remote('foo', 'foo@http://localhost:3001/remoteEntry.js')
    .shared((e) => {
      // e.add(e.dependencies);
      // e.singleton(['react', 'react-dom']);
    })
    .clone();
}

export default configure;
