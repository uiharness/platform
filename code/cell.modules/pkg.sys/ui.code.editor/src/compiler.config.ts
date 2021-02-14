import { Compiler, Package } from '@platform/cell.compiler';
import { copy } from './node/fs.copy';

export default () =>
  Compiler.config()
    .namespace('sys.ui.code.editor')
    .variant('web', (config) =>
      config
        .target('web')
        .port(Package.compiler.port)

        .entry('./src/test/entry')
        .entry('service.worker', './src/workers/service.worker')
        .declarations('./src/types/env.ts', 'inner/env')

        .static('./static')
        .files((config) => config.redirect(false, 'static/**').redirect(false, '*.worker.js'))

        .shared((config) => config.add(config.dependencies).singleton(['react', 'react-dom']))
        .expose('./Dev', './src/test/Dev')
        .expose('./CodeEditor', './src/components/CodeEditor'),
    )

    .beforeCompile((e) => {
      copy.defs();
      copy.vs();
    });