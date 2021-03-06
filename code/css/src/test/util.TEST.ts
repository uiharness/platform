import { expect } from 'chai';
import { style } from '..';

describe('css.toEdges', () => {
  it('undefined => undefined', () => {
    expect(style.toEdges(undefined)).to.eql({});
  });

  it('null => undefined', () => {
    expect(style.toEdges(null)).to.eql({});
  });

  it('[] => undefined', () => {
    expect(style.toEdges([])).to.eql({});
  });

  it('"" => undefined', () => {
    expect(style.toEdges('')).to.eql({});
    expect(style.toEdges('  ')).to.eql({});
  });

  it('[null, null, null, null] => undefined', () => {
    expect(style.toEdges([null, null, null, null])).to.eql({});
  });

  it('[null, null] => undefined', () => {
    expect(style.toEdges([null, null])).to.eql({});
  });

  it('defaultValue', () => {
    const expected = { top: 10, right: 10, bottom: 10, left: 10 };
    expect(style.toEdges(undefined, { defaultValue: 10 })).to.eql(expected);
    expect(style.toEdges([], { defaultValue: 10 })).to.eql(expected);
    expect(style.toEdges([null], { defaultValue: 10 })).to.eql(expected);
    expect(style.toEdges([null, null], { defaultValue: 10 })).to.eql(expected);
  });

  it('"0 10px 6em 9%"', () => {
    expect(style.toEdges('0 10px 6em 9%')).to.eql({
      top: 0,
      right: 10,
      bottom: '6em',
      left: '9%',
    });
  });

  it('"20px 5em"', () => {
    expect(style.toEdges('20px 5em')).to.eql({
      top: 20,
      right: '5em',
      bottom: 20,
      left: '5em',
    });
  });

  it('0', () => {
    expect(style.toEdges(0)).to.eql({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });

  it('10', () => {
    expect(style.toEdges(10)).to.eql({
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    });
  });

  it('"10px"', () => {
    expect(style.toEdges('10px')).to.eql({
      top: 10,
      right: 10,
      bottom: 10,
      left: 10,
    });
  });

  it('"5em"', () => {
    expect(style.toEdges('5em')).to.eql({
      top: '5em',
      right: '5em',
      bottom: '5em',
      left: '5em',
    });
  });

  it('[10, 20, 30, 40]', () => {
    expect(style.toEdges([10, 20, 30, 40])).to.eql({
      top: 10,
      right: 20,
      bottom: 30,
      left: 40,
    });
  });

  it('[10, null, "30%", "40px"]', () => {
    expect(style.toEdges([10, null, '30%', '40px'])).to.eql({
      top: 10,
      right: undefined,
      bottom: '30%',
      left: 40,
    });
  });

  it('[10, 20]', () => {
    expect(style.toEdges([10, 20])).to.eql({
      top: 10,
      right: 20,
      bottom: 10,
      left: 20,
    });
  });

  it('[null, 20]', () => {
    expect(style.toEdges([null, 20])).to.eql({
      top: undefined,
      right: 20,
      bottom: undefined,
      left: 20,
    });
  });

  it('[10, null]', () => {
    expect(style.toEdges([10, null])).to.eql({
      top: 10,
      right: undefined,
      bottom: 10,
      left: undefined,
    });
  });
});

describe('toMargins', () => {
  it('none', () => {
    expect(style.toMargins()).to.eql({});
    expect(style.toMargins(null)).to.eql({});
  });

  it('all edges', () => {
    expect(style.toMargins(10)).to.eql({
      marginTop: 10,
      marginRight: 10,
      marginBottom: 10,
      marginLeft: 10,
    });
    expect(style.toMargins([10, 20, 30, 40])).to.eql({
      marginTop: 10,
      marginRight: 20,
      marginBottom: 30,
      marginLeft: 40,
    });
  });

  it('Y/X', () => {
    const res = style.toMargins([10, 20]);
    expect(res).to.eql({ marginTop: 10, marginRight: 20, marginBottom: 10, marginLeft: 20 });
  });

  it('defaultValue', () => {
    const expected = { marginTop: 10, marginRight: 10, marginBottom: 10, marginLeft: 10 };
    expect(style.toMargins(undefined, { defaultValue: 10 })).to.eql(expected);
    expect(style.toMargins([], { defaultValue: 10 })).to.eql(expected);
    expect(style.toMargins([null], { defaultValue: 10 })).to.eql(expected);
  });
});

describe('toPadding', () => {
  it('none', () => {
    expect(style.toPadding()).to.eql({});
    expect(style.toPadding(null)).to.eql({});
  });

  it('all edges', () => {
    expect(style.toPadding(10)).to.eql({
      paddingTop: 10,
      paddingRight: 10,
      paddingBottom: 10,
      paddingLeft: 10,
    });
    expect(style.toPadding([10, 20, 30, 40])).to.eql({
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 30,
      paddingLeft: 40,
    });
  });

  it('Y/X', () => {
    const res = style.toPadding([10, 20]);
    expect(res).to.eql({ paddingTop: 10, paddingRight: 20, paddingBottom: 10, paddingLeft: 20 });
  });

  it('defaultValue', () => {
    const expected = { paddingTop: 10, paddingRight: 10, paddingBottom: 10, paddingLeft: 10 };
    expect(style.toPadding(undefined, { defaultValue: 10 })).to.eql(expected);
    expect(style.toPadding([], { defaultValue: 10 })).to.eql(expected);
    expect(style.toPadding([null], { defaultValue: 10 })).to.eql(expected);
  });
});

describe('toShadow', () => {
  it('undefined', () => {
    expect(style.toShadow()).to.eql(undefined);
  });

  it('defaults (x, y)', () => {
    const res = style.toShadow({ color: 0.1, blur: 3 });
    expect(res).to.eql('0 0 3px 0 rgba(255, 255, 255, 0.1)');
  });

  it('x, y', () => {
    const res = style.toShadow({ x: 123, y: 456, color: 0.3, blur: 10 });
    expect(res).to.eql('123px 456px 10px 0 rgba(255, 255, 255, 0.3)');
  });

  it('inset', () => {
    const res = style.toShadow({ color: 0.1, blur: 3, inner: true });
    expect(res).to.eql('inset 0 0 3px 0 rgba(255, 255, 255, 0.1)');
  });
});

describe('toPosition', () => {
  it('0 (single number)', () => {
    const res = style.toPosition('absolute', 0);
    expect(res.position).to.eql('absolute');
    expect(res.top).to.eql(0);
    expect(res.right).to.eql(0);
    expect(res.bottom).to.eql(0);
    expect(res.left).to.eql(0);
  });

  it('array [y, x]', () => {
    const res = style.toPosition('fixed', [10, 30]);
    expect(res.position).to.eql('fixed');
    expect(res.top).to.eql(10);
    expect(res.right).to.eql(30);
    expect(res.bottom).to.eql(10);
    expect(res.left).to.eql(30);
  });

  it('[top, right, bottom, left]', () => {
    const res = style.toPosition('sticky', [10, 20, 30, 40]);
    expect(res.position).to.eql('sticky');
    expect(res.top).to.eql(10);
    expect(res.right).to.eql(20);
    expect(res.bottom).to.eql(30);
    expect(res.left).to.eql(40);
  });

  it('toAbsolute', () => {
    const res1 = style.toAbsolute(0);
    expect(res1.position).to.eql('absolute');
    expect(res1.top).to.eql(0);
    expect(res1.right).to.eql(0);
    expect(res1.bottom).to.eql(0);
    expect(res1.left).to.eql(0);

    const res2 = style.toAbsolute([10, 20, 30, 40]);
    expect(res2.position).to.eql('absolute');
    expect(res2.top).to.eql(10);
    expect(res2.right).to.eql(20);
    expect(res2.bottom).to.eql(30);
    expect(res2.left).to.eql(40);
  });
});
