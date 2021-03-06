// tslint:disable
import { expect } from '../test';
import { tmpl } from '.';

describe('tmpl', () => {
  it('replaces single match', () => {
    const res = tmpl.replace('Title ${version}/${bar}.', { version: '0.0.1' });
    expect(res).to.eql('Title 0.0.1/${bar}.');
  });

  it('replaces two matches', () => {
    const res = tmpl.replace('Title ${version}/${bar}.', {
      version: '0.0.1',
      bar: 'hello',
    });
    expect(res).to.eql('Title 0.0.1/hello.');
  });

  it('replaces same match twice', () => {
    const res = tmpl.replace('Version ${version}, v${version}', {
      version: '0.0.1',
    });
    expect(res).to.eql('Version 0.0.1, v0.0.1');
  });

  it('replaces with number', () => {
    const res = tmpl.replace('Version ${version}, v${version}', {
      version: 123,
    });
    expect(res).to.eql('Version 123, v123');
  });

  it('replaces with boolean', () => {
    const res = tmpl.replace('Version ${version}, ${version}', {
      version: true,
    });
    expect(res).to.eql('Version true, true');
  });
});
