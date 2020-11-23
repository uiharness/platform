import { Compiler, Package } from '@platform/cell.compiler';

export default () =>
  Compiler.config()
    .port(Package.compiler.port)
    .namespace('__NAME__')

    .entry('./src/test/entry')
    .entry('service.worker', './src/test/workers/service.worker')

    .static('./static')
    .files((config) => config.redirect(false, '*.worker.js'))

    .shared((config) => config.add(config.dependencies).singleton(['react', 'react-dom']))
    .expose('./Dev', './src/test/components/Dev')

    .variant('prod', (config) => config.mode('prod'))
    .variant('dev', (config) => config.mode('dev'));
