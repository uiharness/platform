import { expect } from 'chai';
import { value } from '.';

describe('round', () => {
  it('rounds to 0 decimal places', () => {
    expect(value.round(1.123)).to.equal(1);
    expect(value.round(1.513)).to.equal(2);
  });

  it('rounds to 1 decimal place', () => {
    expect(value.round(1.123, 1)).to.equal(1.1);
    expect(value.round(1.153, 1)).to.equal(1.2);
  });

  it('rounds to 2 decimal places', () => {
    expect(value.round(1.123, 2)).to.equal(1.12);
    expect(value.round(1.156, 2)).to.equal(1.16);
  });

  it('rounds to 3 decimal places', () => {
    expect(value.round(1.123, 3)).to.equal(1.123);
    expect(value.round(1.156, 3)).to.equal(1.156);
  });
});

describe('random', () => {
  it('is random within bounds (5..10)', () => {
    const res = value.random(5, 10);
    expect(res).to.greaterThan(4);
    expect(res).to.lessThan(11);
  });
});
