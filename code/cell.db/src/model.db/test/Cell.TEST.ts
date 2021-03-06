import { Cell } from '..';
import { expect, getTestDb, util } from '../../test';

type P = { style?: { bold?: boolean } };

describe('model.Cell', () => {
  it('saves', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const res1 = await Cell.create<P>({ db, uri }).ready;
    expect(res1.props.value).to.eql(undefined);
    expect(res1.props.props).to.eql(undefined);
    expect(res1.props.links).to.eql(undefined);
    expect(res1.props.error).to.eql(undefined);
    expect(res1.props.hash).to.eql(undefined);

    const HASH = {
      before: 'PREVIOUS-HASH',
      after: 'sha256-a5a6ca5d0284779060a46f1610270cf2091761a1472a8c2d9c867511b0842a44',
    };

    const value = '=A2';
    const error = { type: 'FAIL', message: 'Boo' };
    const links = { main: 'ns:foo', image: 'file:foo:kitten' };
    const props = { style: { bold: true } };
    const data = { value, props, links, error, hash: HASH.before };
    await res1.set(data).save();

    const res2 = await Cell.create({ db, uri }).ready;
    expect(res2.props.value).to.eql(value);
    expect(res2.props.props).to.eql(props);
    expect(res2.props.links).to.eql(links);
    expect(res2.props.error).to.eql(error);
    expect(res2.props.hash).to.eql(HASH.after); // NB: Auto-updated on save.
  });

  it('updates DB namespace doc-links before saving', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const model1 = await Cell.create({ db, uri }).ready;
    await model1.set({ value: '=A2' }).save(); // NB: `beforeSave` links routine not triggered.

    // Assign some links:
    model1.set({
      links: (
        util.cellData(model1.toObject()).mergeLinks({
          foo: `ns:foo`,
          bar: `ns:bar`,
          baz: 'data:random', // NB: not recognized, so not stored as namespace link.
        }) || {}
      ).links,
    });
    expect(model1.isChanged).to.eql(true);
    await model1.save();

    expect(model1.doc.nsRefs).to.eql([`NS/bar`, `NS/foo`]); // Added by rule.

    // Assign and remove links.
    model1.set({
      links: (
        util.cellData(model1.toObject()).mergeLinks({
          foo: 'ns:foobar', //  Changed.
          bar: undefined, //    Removed.
          zoo: 'ns:zoo', //     Added.
        }) || {}
      ).links,
    });
    await model1.save();

    // Reload.
    const model2 = await Cell.create({ db, uri }).ready;
    expect(model2.doc.nsRefs).to.eql(['NS/foobar', 'NS/zoo']);

    // Clear all links.
    model2.set({
      links: (
        util.cellData(model2.toObject()).mergeLinks({
          foo: undefined,
          zoo: undefined,
          bazza: undefined, // NB: Random field, does not actually exist (no effect).
        }) || {}
      ).links,
    });
    await model2.save();

    // Reload.
    const model3 = await Cell.create({ db, uri }).ready;
    expect(model3.doc.nsRefs).to.eql(undefined);
  });

  it('updates hash on save (auto)', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const model1 = await Cell.create({ db, uri }).ready;
    expect(model1.props.hash).to.eql(undefined);

    await model1.set({ value: '=A2' }).save();
    expect(model1.props.hash).to.not.eql(undefined);

    const model2 = await Cell.create({ db, uri }).ready;
    expect(model2.toObject().hash).to.eql(model1.props.hash);

    const before = model2.props.hash;
    await model2.set({ value: 123 }).save();
    expect(model2.props.hash).to.not.eql(before);

    const model3 = await Cell.create({ db, uri }).ready;
    expect(model3.toObject().hash).to.eql(model2.props.hash);

    await (async () => {
      const before = model3.props.hash;
      await model3.save({ force: true });
      expect(model3.props.hash).to.eql(before); // NB: No change.
    })();
  });

  it('clears empty links', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const model1 = await Cell.create({ db, uri }).ready;
    await model1.set({ links: { foo: 'one', bar: 'two' } }).save();

    const model2 = await Cell.create({ db, uri }).ready;
    expect(model2.toObject().links).to.eql({ foo: 'one', bar: 'two' });

    await model2.set({ links: { foo: '  ', bar: 'two' } }).save();

    const model3 = await Cell.create({ db, uri }).ready;
    expect(model3.toObject().links).to.eql({ bar: 'two' });

    await model3.set({ links: { foo: '  ', bar: '' } }).save();

    const model4 = await Cell.create({ db, uri }).ready;
    expect(model4.toObject().links).to.eql({});
  });

  it('sets then clears props', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const model = await Cell.create({ db, uri }).ready;
    expect(model.props.props).to.eql(undefined);

    await model.set({ props: { value: 456 } }).save();
    expect(model.props.props).to.eql({ value: 456 });

    await model.set({ props: undefined }).save();
    expect(model.props.props).to.eql(undefined);
  });

  it('sets then clears error', async () => {
    const db = await getTestDb({});
    const uri = 'cell:foo:A1';

    const model = await Cell.create({ db, uri }).ready;
    expect(model.props.error).to.eql(undefined);

    const error = { type: 'FOO', message: 'Boo' };
    await model.set({ error }).save();
    expect(model.props.error).to.eql(error);

    await model.set({ error: undefined }).save();
    expect(model.props.error).to.eql(undefined);
  });
});
