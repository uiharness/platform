import { expect, testContext } from './TEST';
import { filter, map } from 'rxjs/operators';

import { refs } from '.';
import { t } from '../common';

describe('refs.table', () => {
  describe('refs', () => {
    it('both incoming/outgoing', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3,Z9)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });
      const res = await table.refs();

      expect(Object.keys(res.in)).to.eql(['A2', 'C3', 'Z9']); // NB: "Z9" included even though does not exist in the grid.
      expect(Object.keys(res.out)).to.eql(['C3', 'A1']);
    });

    it('narrow on range', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
        Z9: { value: 'hello' },
      });
      const table = refs.table({ ...ctx });
      const res1 = await table.refs({});
      const res2 = await table.refs({ range: 'A1' });

      expect(Object.keys(res1.out)).to.eql(['C3', 'A1']);
      expect(Object.keys(res2.out)).to.eql(['A1']);

      expect(res1.in.A2.map((ref) => ref.cell)).to.eql(['C3', 'A1']);
      expect(res1.in.C3.map((ref) => ref.cell)).to.eql(['A1']);
      expect(res1.in).to.eql(res2.in);
    });

    it('contains ranges (incoming intersection)', async () => {
      const ctx = testContext({
        A1: { value: '=B1:B3' },
        A2: { value: '=SUM(B2:D2)' },
      });
      const table = refs.table({ ...ctx });
      const res = await table.refs();

      expect(Object.keys(res.out)).to.eql(['A1', 'A2']);

      expect(Object.keys(res.in)).to.eql(['B1', 'B2', 'B3', 'C2', 'D2']);
      expect(res.in.B1.map((e) => e.cell)).to.eql(['A1']);
      expect(res.in.B2.map((e) => e.cell)).to.eql(['A1', 'A2']);
      expect(res.in.B3.map((e) => e.cell)).to.eql(['A1']);
      expect(res.in.C2.map((e) => e.cell)).to.eql(['A2']);
      expect(res.in.D2.map((e) => e.cell)).to.eql(['A2']);
    });
  });

  describe('refs (errors)', () => {
    it('circular: A1 => A1 (after change)', async () => {
      let A1 = '123';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: '456' },
      });

      const table = refs.table({ ...ctx });
      const res1 = await table.refs();
      expect(res1.out).to.eql({});

      A1 = '=A1';
      const res2 = await table.refs({ range: 'A1', force: true });
      const ref = res2.out.A1[0];
      expect(ref.path).to.eql('A1/A1');
      expect(ref.error && ref.error.type).to.eql('REF/circular');
      expect(ref.error && ref.error.path).to.eql('A1/A1');
    });
  });

  describe('outgoing', () => {
    it('empty', async () => {
      const ctx = testContext({});
      const table = refs.table({ ...ctx });
      const res = await table.outgoing();
      expect(res).to.eql({});
    });

    it('calculate all (default)', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,D5)' },
        A2: { value: '=D5' },
        D5: { value: 456 },
      });
      const table = refs.table({ ...ctx });

      const res = await table.outgoing();
      expect(Object.keys(res)).to.eql(['A2', 'A1']);

      expect(res.A1[0].path).to.eql('A1/A2/D5');
      expect(res.A1[1].path).to.eql('A1/D5');
      expect(res.A2[0].path).to.eql('A2/D5');
    });

    it('calculate subset (range: "A:A")', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,D5)' },
        A2: { value: 123 },
        D5: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.outgoing();
      const res2 = await table.outgoing({ range: 'A1:A99', force: true });
      const res3 = await table.outgoing({ range: 'A:A', force: true }); // NB: Range input variants.
      const res4 = await table.outgoing({ range: 'A', force: true });

      expect(Object.keys(res1)).to.eql(['D5', 'A1']);
      expect(Object.keys(res2)).to.eql(['A1']);
      expect(Object.keys(res3)).to.eql(['A1']);
      expect(Object.keys(res4)).to.eql(['A1']);

      // Everything.
      expect(res1.A1[0].path).to.eql('A1/A2');
      expect(res1.A1[1].path).to.eql('A1/D5/A2');
      expect(res1.D5[0].path).to.eql('D5/A2');

      // Subset range (column "A").
      expect(res2.A1[0].path).to.eql('A1/A2');
      expect(res2.A1[1].path).to.eql('A1/D5/A2');
      expect(res2.D5).to.eql(undefined);
    });

    it('calculate subset (range by key: ["A1", "A2"])', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,D5)' },
        A2: { value: 123 },
        D5: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      // Everything.
      const res1 = await table.outgoing();
      expect(Object.keys(res1)).to.eql(['D5', 'A1']);
      expect(res1.A1[0].path).to.eql('A1/A2');
      expect(res1.A1[1].path).to.eql('A1/D5/A2');
      expect(res1.D5[0].path).to.eql('D5/A2');

      // Subset by key.
      const res2 = await table.outgoing({ range: 'A1', force: true });
      const res3 = await table.outgoing({ range: ['A1', 'A2'], force: true });
      expect(res2).to.eql(res3);
      expect(res3.A1[0].path).to.eql('A1/A2');
      expect(res3.A1[1].path).to.eql('A1/D5/A2');
      expect(res3.D5).to.eql(undefined);

      const res4 = await table.outgoing({ range: ['D5'], force: true });
      expect(res4.A1).to.eql(undefined);
      expect(res4.D5[0].path).to.eql('D5/A2');

      // Everything (by key).
      const res5 = await table.outgoing({ range: ['A1', 'A2', 'D5'], force: true });
      expect(res1).to.eql(res5);
    });

    it('recalculate: error => value => REF', async () => {
      let A2 = '=A1';
      const ctx = testContext({
        A1: { value: '=A2' },
        A2: { value: () => A2 },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      const res2 = await table.refs();

      expect(res1.out.A1[0].error).to.be.an('object');
      expect(res1.out.A2[0].error).to.be.an('object');
      expect(res1).to.eql(res2);

      // Error removed.
      A2 = '=A10';
      await table.refs({ range: ['A2'], force: true }); // NB: force update on subset of cells.
      const res3 = await table.refs(); // NB: Query of all refs pulled from cache.

      expect(res3.out.A2.length).to.eql(1);
      expect(res3.out.A2[0].error).to.eql(undefined);
      expect(res3.out.A2[0].path).to.eql('A2/A10');

      // Value (REF removed).
      A2 = '123';
      await table.refs({ range: ['A2'], force: true }); // NB: force update on subset of cells.
      const res4 = await table.refs(); // NB: Query of all refs pulled from cache.
      expect(res4.out.A2).to.eql(undefined);
    });

    describe('caching', () => {
      it('read', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(A2,C3)' },
          A2: { value: 123 },
          C3: { value: '=A2' },
        });
        const table = refs.table({ ...ctx });

        const res1 = await table.outgoing();
        const res2 = await table.outgoing();

        expect(res1).to.not.equal(res2); //   NB: Different root object.
        expect(res1.A1).to.equal(res2.A1); // NB: Same ref instances (cached)
        expect(res1.C3).to.equal(res2.C3);

        // Force re-calculate.
        const res3 = await table.outgoing({ force: true });
        expect(res3.A1).to.not.equal(res1.A1); // NB: Different ref instances (force reset).
        expect(res3.C3).to.not.equal(res1.C3);

        expect(res1.A1).to.eql(res3.A1); // NB: Equivalent values.
        expect(res1.C3).to.eql(res3.C3);

        // Force re-calculate subset only.
        const res4 = await table.outgoing({ range: 'A1:A1', force: true });
        expect(res4.A1).to.not.equal(res3.A1);
        expect(res4.C3).to.eql(undefined);

        // Requery (pulls from cache).
        const res5 = await table.outgoing();
        expect(res5.A1).to.equal(res4.A1);
        expect(res5.A1).to.not.equal(res3.A1);
      });

      it('removed when cell updated', async () => {
        let A1 = '=SUM(A2,C3)';
        const ctx = testContext({
          A1: { value: () => A1 },
          A2: { value: 123 },
          C3: { value: '=A2' },
        });
        const table = refs.table({ ...ctx });

        const res1 = await table.outgoing();
        expect(res1.A1.length).to.eql(2);

        A1 = '=C3';
        const res2 = await table.outgoing({ range: 'A1:A1', force: true });
        expect(res2.A1.length).to.eql(1);
        expect(res2.A1[0].path).to.eql('A1/C3/A2');

        A1 = 'hello';
        const res3 = await table.outgoing({ range: 'A1:A1', force: true });
        expect(res3).to.eql({});
      });

      it('reset (method)', async () => {
        const ctx = testContext({
          A1: { value: '=SUM(A2,C3)' },
          A2: { value: 123 },
          C3: { value: '=A2' },
        });
        const table = refs.table({ ...ctx });

        const res1 = await table.outgoing();
        const res2 = await table.reset().outgoing();

        expect(res1.A1).to.not.equal(res2.A1);
        expect(res1.A1).to.eql(res2.A1);

        expect(res1.C3).to.not.equal(res2.C3);
        expect(res1.C3).to.eql(res2.C3);
      });
    });
  });

  describe('incoming', () => {
    it('empty', async () => {
      const ctx = testContext({});
      const table = refs.table({ ...ctx });
      const res = await table.incoming();
      expect(res).to.eql({});
    });

    it('calculate all', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });
      const res = await table.incoming();

      expect(Object.keys(res)).to.eql(['A2', 'C3']);

      expect(res.A2[0].cell).to.eql('C3');
      expect(res.A2[1].cell).to.eql('A1');
      expect(res.C3[0].cell).to.eql('A1');
    });

    it('incoming from RANGE', async () => {
      const ctx = testContext({
        A1: { value: '=B1:B9' },
        B1: { value: 1 },
        B5: { value: 5 },
      });

      const table = refs.table({ ...ctx });
      const res = await table.incoming();

      expect(res.B1[0].cell).to.eql('A1');
      expect(res.B5[0].cell).to.eql('A1');
    });

    it('incoming from RANGE(param)', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(B1:B9)' },
        B1: { value: 1 },
        B5: { value: 5 },
      });

      const table = refs.table({ ...ctx });
      const res = await table.incoming();

      expect(res.B1[0].cell).to.eql('A1');
      expect(res.B5[0].cell).to.eql('A1');
    });

    it('calculate subset ("A:A")', async () => {
      const A1 = '=SUM(A2,C3)';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      // Everything.
      const res1 = await table.incoming();
      expect(Object.keys(res1)).to.eql(['A2', 'C3']);
      expect(res1.A2.map((m) => m.cell)).to.eql(['C3', 'A1']);
      expect(res1.C3.map((m) => m.cell)).to.eql(['A1']);

      // Subset range ("A" column only).
      const res2 = await table.incoming({ range: 'A:A', force: true });
      expect(Object.keys(res2)).to.eql(['A2']);
      expect(res2.A2.map((m) => m.cell)).to.eql(['A1']); // NB: Does not contain other "C3" incoming ref.

      // Same range, but declared with single value.
      // NB: Converted to a range internally.
      const res3 = await table.incoming({ range: 'A', force: true });
      expect(Object.keys(res3)).to.eql(['A2']); // NB: Same as above.
      expect(res3.A2.map((m) => m.cell)).to.eql(['A1']);
    });

    it('calculate subset (range by key: ["A1", "A2"])', async () => {
      const A1 = '=SUM(A2,C3)';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      // Everything.
      const res1 = await table.incoming();
      expect(Object.keys(res1)).to.eql(['A2', 'C3']);
      expect(res1.A2.map((m) => m.cell)).to.eql(['C3', 'A1']);
      expect(res1.C3.map((m) => m.cell)).to.eql(['A1']);

      // Subset ranges by single keys.
      const res2 = await table.incoming({ range: 'A1', force: true });
      const res3 = await table.incoming({ range: ['A1', 'A2'], force: true });

      expect(res2).to.eql({});
      expect(Object.keys(res3)).to.eql(['A2']);
      expect(res3.A2.map((m) => m.cell)).to.eql(['A1']); // NB: Does not contain other "C3" incoming ref.

      // Everything (by keys).
      const res4 = await table.incoming({ range: ['A1', 'A2', 'C3'], force: true });
      expect(Object.keys(res4)).to.eql(['A2', 'C3']);
      expect(res4.A2.map((m) => m.cell)).to.eql(['C3', 'A1']);
      expect(res4.C3.map((m) => m.cell)).to.eql(['A1']);
    });

    it('include ref to [undefined] cell (data from passed `outRefs` param)', async () => {
      const ctx = testContext({
        A1: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.incoming();
      expect(res1).to.eql({}); // NB: The undefined cell (A2) was not picked up (because it was not returned by `getKeys`).

      // Pass in a set of `outgoing-refs` to include in key evaluation.
      const outRefs = await table.outgoing();
      const res2 = await table.incoming({ outRefs, force: true });

      expect(Object.keys(res2)).to.eql(['A2']);
      expect(res2.A2.length).to.eql(1);
      expect(res2.A2[0].cell).to.eql('A1');
    });

    it('cache', async () => {
      let A1 = '=SUM(A2,C3)';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });

      const table = refs.table({ ...ctx });
      const res1 = await table.incoming();
      const res2 = await table.incoming();
      const res3 = await table.incoming({ force: true });

      expect(res1.A2).to.not.eql(undefined);

      expect(res1.A2).to.equal(res2.A2);
      expect(res2.A2).to.not.equal(res3.A2); // Different instance - forced from cache.

      const res4 = await table.incoming();
      expect(res3.A2).to.equal(res4.A2);

      // Cache reset.
      table.reset();
      const res5 = await table.incoming();
      expect(res4.A2).to.not.equal(res5.A2);

      // Changed value.
      A1 = '=SUM(123, A2)';
      const res6 = await table.incoming();
      const res7 = await table.incoming({ force: true });

      expect(res6).to.eql(res5); // NB: Cached value (no change).
      expect(res7).to.not.eql(res6);

      expect(Object.keys(res6)).to.eql(['A2', 'C3']);
      expect(Object.keys(res7)).to.eql(['A2']);
    });
  });

  describe('cache', () => {
    it('.reset() - everything', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      const res2 = await table.refs();

      // Cached instances.
      expect(res1.in.A2).to.equal(res2.in.A2);
      expect(res1.out.A1).to.equal(res2.out.A1);

      table.reset();
      const res3 = await table.refs();
      expect(res2.in.A2).to.not.equal(res3.in.A2);
      expect(res2.out.A1).to.not.equal(res3.out.A1);
    });

    it('.reset({ cache:IN/OUT })', async () => {
      const A1 = '=SUM(A2,C3)';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      const res2 = await table.refs();

      // Cached instances.
      expect(res1.in.A2).to.equal(res2.in.A2);
      expect(res1.out.A1).to.equal(res2.out.A1);

      // Reset INCOMING only.
      table.reset({ cache: ['IN'] });
      const res3 = await table.refs();
      expect(res2.in.A2).to.not.equal(res3.in.A2); //   New instance.
      expect(res2.out.A1).to.equal(res3.out.A1); //     No change.

      // Re-query, everything cached again.
      const res4 = await table.refs();
      expect(res3.in.A2).to.equal(res4.in.A2);
      expect(res3.out.A1).to.equal(res4.out.A1);

      // Reset OUTGOING only.
      table.reset({ cache: ['OUT'] });
      const res5 = await table.refs();
      expect(res4.in.A2).to.equal(res5.in.A2); //       No change.
      expect(res4.out.A1).to.not.equal(res5.out.A1); // New instance.

      // Re-query, everything cached again.
      const res6 = await table.refs();
      expect(res5.in.A2).to.equal(res6.in.A2);
      expect(res5.out.A1).to.equal(res6.out.A1);

      // Reset entire cache.
      table.reset({ cache: ['IN', 'OUT'] }); // NB: with params (default).
      const res7 = await table.refs();
      expect(res6.in.A2).to.not.equal(res7.in.A2);
      expect(res6.out.A1).to.not.equal(res7.out.A1);
    });
  });

  describe('events', () => {
    it('REFS/table/getKeys', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const getKeys$ = table.event$.pipe(
        filter((e) => e.type === 'REFS/table/getKeys'),
        map((e) => e.payload as t.IRefsTableGetKeys),
      );

      let count = 0;
      let modify = false;
      getKeys$.subscribe((e) => count++);

      const res1 = await table.refs();
      expect(Object.keys(res1.in)).to.eql(['A2', 'C3']);
      expect(Object.keys(res1.out)).to.eql(['C3', 'A1']);
      expect(count).to.eql(2); // NB: IN/OUT.

      getKeys$.pipe(filter((e) => modify)).subscribe((e) => {
        expect(e.isModified).to.eql(false);
        e.modify([]);
        expect(e.isModified).to.eql(true);
      });

      count = 0;
      modify = true;
      const res2 = await table.refs();
      expect(res2.in).to.eql({});
      expect(res2.out).to.eql({});
      expect(count).to.eql(2);
    });

    it('REFS/table/getValue', async () => {
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const getValue$ = table.event$.pipe(
        filter((e) => e.type === 'REFS/table/getValue'),
        map((e) => e.payload as t.IRefsTableGetValue),
      );

      let count = 0;
      let modify = false;
      getValue$.subscribe((e) => count++);

      getValue$.pipe(filter((e) => modify)).subscribe((e) => {
        if (e.key === 'A1' || e.key === 'C3') {
          e.modify('hello');
          expect(e.isModified).to.eql(true);
          expect(e.value).to.eql('hello');
        }
      });

      const res1 = await table.refs();
      expect(Object.keys(res1.in)).to.eql(['A2', 'C3']);
      expect(Object.keys(res1.out)).to.eql(['C3', 'A1']);
      expect(count).to.greaterThan(2);

      // Recall - everything is cached.
      count = 0;
      await table.refs(); // NB: default {force:false}.
      await table.refs({ force: false });
      expect(count).to.eql(0); // NB: Cached, no more calls to `getValue`.

      // Modify values.
      modify = true;
      const res2 = await table.refs({ force: true });
      expect(res2.in).to.eql({});
      expect(res2.out).to.eql({});
    });
  });

  describe('update', () => {
    it('no change ("from/to" the same, "from/to" not a REF)', async () => {
      let A2 = '123';
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: () => A2 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      expect(Object.keys(res1.in).sort()).to.eql(['A2', 'C3']);
      expect(Object.keys(res1.out).sort()).to.eql(['A1', 'C3']);

      // Same value (no change).
      A2 = '123';
      const res2 = await table.update({ key: 'C3', from: '123', to: '123' });
      expect(res2.ok).to.eql(true);
      expect(res2.changed).to.eql([]);
      expect(res2.keys).to.eql([]);
      expect(res2.errors).to.eql([]);
      expect(res2.refs).to.eql(res1);

      // Different value (no change, because to/from is not a formula).
      A2 = '456';
      const res3 = await table.update({ key: 'C3', from: '123', to: '456' });

      expect(res3.ok).to.eql(true);
      expect(res3.changed).to.eql([]);
      expect(res3.keys).to.eql([]);
      expect(res3.errors).to.eql([]);
      expect(res3.refs).to.eql(res1);
    });

    it('single change: FUNC(args) => VALUE', async () => {
      let A1 = '=SUM(A2,C3)';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      expect(Object.keys(res1.in).sort()).to.eql(['A2', 'C3']);
      expect(Object.keys(res1.out).sort()).to.eql(['A1', 'C3']);

      A1 = 'hello';
      const res2 = await table.update({ key: 'C3', from: '=A2', to: 'hello' });

      expect(res2.ok).to.eql(true);
      expect(res2.errors).to.eql([]);
      expect(res2.changed).to.eql([{ key: 'C3', from: '=A2', to: 'hello' }]);
      expect(res2.keys.sort()).to.eql(['A1', 'A2', 'C3']);

      const res3 = await table.refs();
      expect(res1).to.not.eql(res2.refs);
      expect(res2.refs).to.eql(res3);

      expect(Object.keys(res2.refs.in)).to.eql(['A2']);
      expect(Object.keys(res2.refs.out)).to.eql(['C3']);
    });

    it('single change: VALUE => FUNC(args)', async () => {
      let A1 = 'hello';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      expect(Object.keys(res1.in)).to.eql(['A2']);
      expect(Object.keys(res1.out)).to.eql(['C3']);

      A1 = '=SUM(A2,C3)';
      const res2 = await table.update({ key: 'A1', from: 'hello', to: '=SUM(A2,C3)' });

      expect(res2.ok).to.eql(true);
      expect(res2.errors).to.eql([]);
      expect(res2.changed).to.eql([{ key: 'A1', from: 'hello', to: '=SUM(A2,C3)' }]);
      expect(res2.keys.sort()).to.eql(['A1', 'A2', 'C3']);

      const res3 = await table.refs();
      expect(res1).to.not.eql(res2.refs);
      expect(res2.refs).to.eql(res3);

      expect(Object.keys(res2.refs.in).sort()).to.eql(['A2', 'C3']);
      expect(Object.keys(res2.refs.out).sort()).to.eql(['A1', 'C3']);
    });

    it('single change: VALUE => REF', async () => {
      let A1 = 'hello';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: 123 },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      expect(Object.keys(res1.in)).to.eql([]);
      expect(Object.keys(res1.out)).to.eql([]);

      A1 = '=A2';
      const res2 = await table.update({ key: 'A1', from: 'hello', to: '=A2' });

      expect(res2.ok).to.eql(true);
      expect(res2.errors).to.eql([]);
      expect(res2.changed).to.eql([{ key: 'A1', from: 'hello', to: '=A2' }]);
      expect(res2.keys.sort()).to.eql(['A1', 'A2']);

      const res3 = await table.refs();
      expect(res1).to.not.eql(res2.refs);
      expect(res2.refs).to.eql(res3);

      expect(Object.keys(res2.refs.in).sort()).to.eql(['A2']);
      expect(Object.keys(res2.refs.out).sort()).to.eql(['A1']);
    });

    it('multiple changes', async () => {
      const A1 = '=SUM(A2,A4)';
      let A2 = '123';
      let A3 = '456';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: () => A2 },
        A3: { value: () => A3 },
        A4: { value: '999' },
      });
      const table = refs.table({ ...ctx });

      const res1 = await table.refs();
      expect(Object.keys(res1.in).sort()).to.eql(['A2', 'A4']);
      expect(Object.keys(res1.out).sort()).to.eql(['A1']);

      A2 = '=A3';
      A3 = '=SUM(A4,100)';
      const res2 = await table.update([
        { key: 'A2', from: '123', to: '=A3' },
        { key: 'A3', from: '456', to: '=SUM(A4,100)' },
      ]);

      expect(res2.ok).to.eql(true);
      expect(res2.errors).to.eql([]);
      expect(res2.changed).to.eql([
        { key: 'A2', from: '123', to: '=A3' },
        { key: 'A3', from: '456', to: '=SUM(A4,100)' },
      ]);
      expect(res2.keys.sort()).to.eql(['A1', 'A2', 'A3', 'A4']);

      const res3 = await table.refs();
      expect(res1).to.not.eql(res2.refs);
      expect(res2.refs).to.eql(res3);

      expect(Object.keys(res2.refs.in).sort()).to.eql(['A2', 'A3', 'A4']);
      expect(Object.keys(res2.refs.out).sort()).to.eql(['A1', 'A2', 'A3']);
    });

    it('error', async () => {
      let A2 = '123';
      const ctx = testContext({
        A1: { value: '=SUM(A2,C3)' },
        A2: { value: () => A2 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      A2 = '=D9';
      const res2 = await table.update({ key: 'A2', from: '123', to: '=A1' });
      expect(res2.ok).to.eql(true);
      expect(res2.errors).to.eql([]);

      A2 = '=A1';
      const res3 = await table.update({ key: 'A2', from: '123', to: '=A1' });
      expect(res3.ok).to.eql(false);
      expect(res3.errors.length).to.eql(4);

      expect(res3.errors.map((err) => err.path).sort()).to.eql([
        'A1/A2/A1',
        'A1/C3/A2/A1',
        'A2/A1/A2',
        'C3/A2/A1/A2',
      ]);
    });

    it('events', async () => {
      let A1 = '=SUM(A2,C3)';
      let A2 = '123';
      const ctx = testContext({
        A1: { value: () => A1 },
        A2: { value: () => A2 },
        C3: { value: '=A2' },
      });
      const table = refs.table({ ...ctx });

      const update$ = table.event$.pipe(
        filter((e) => e.type === 'REFS/table/update'),
        map((e) => e.payload as t.RefsTableUpdate),
      );

      const events: t.RefsTableUpdate[] = [];
      update$.subscribe((e) => events.push(e));

      // No change (no event).
      A2 = '456';
      const res2 = await table.update({ key: 'A2', from: '123', to: '456' });
      expect(res2.changed.length).to.eql(0);
      expect(res2.keys.length).to.eql(0);
      expect(events.length).to.eql(0);

      // Change (event fired).
      A1 = '=SUM(C3,D9)';
      A2 = '=D9';
      const res3 = await table.update([
        { key: 'A1', from: '456', to: A1 },
        { key: 'A2', from: '456', to: A2 },
      ]);
      expect(res3.changed.length).to.eql(2);
      expect(res3.keys.length).to.eql(4);
      expect(events.length).to.eql(1);
      expect(events[0]).to.eql(res3);
    });
  });
});
