import { expect } from 'chai';
import { Subject } from 'rxjs';

import { dispose } from '.';

describe('IDisposable', () => {
  it('create', () => {
    const obj = dispose.create();
    expect(obj.isDisposed).to.eql(false);
  });

  it('dispose()', () => {
    const obj = dispose.create();
    obj.dispose();
    expect(obj.isDisposed).to.eql(true);
  });

  it('event: dispose$', () => {
    const obj = dispose.create();

    let count = 0;
    obj.dispose$.subscribe(() => count++);

    obj.dispose();
    obj.dispose();
    obj.dispose();
    expect(count).to.eql(1);
  });

  it('until', () => {
    const obj1 = dispose.create();
    expect(obj1.isDisposed).to.eql(false);

    const $ = new Subject();
    const obj2 = dispose.until(obj1, $);

    let count = 0;
    obj1.dispose$.subscribe(() => count++);

    expect(obj1.isDisposed).to.eql(false);
    expect(obj2.isDisposed).to.eql(false);
    expect(obj1).to.equal(obj2);

    $.next();
    $.next();
    $.next();
    expect(count).to.eql(1);
    expect(obj1.isDisposed).to.eql(true);
  });
});