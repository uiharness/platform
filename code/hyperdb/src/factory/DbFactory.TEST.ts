import { expect } from 'chai';
import { DbFactory } from '.';
import { create } from './create';
import { fs } from '@platform/fs';
import * as t from './types';

const dir = 'tmp/db';
const dir1 = 'tmp/db-1';
const dir2 = 'tmp/db-2';
const dirs = [dir, dir1, dir2];
after(async () => fs.remove('tmp'));

describe('Factory', () => {
  beforeEach(() => dirs.forEach(dir => fs.removeSync(dir)));

  describe('create', () => {
    it('creates (not cached)', async () => {
      const factory = new DbFactory({ create });
      expect(factory.isCached({ dir })).to.eql(false);
      const res = await factory.create({ dir, connect: false, cache: false });
      expect(res.db.dir).to.eql(dir);
      expect(factory.isCached({ dir })).to.eql(false);
      expect(factory.count).to.eql(0);
    });

    it('creates (cached, default)', async () => {
      const factory = new DbFactory({ create });
      expect(factory.isCached({ dir })).to.eql(false);
      const res = await factory.create({ dir, connect: false });
      expect(res.db.dir).to.eql(dir);
      expect(factory.isCached({ dir })).to.eql(true);
      expect(factory.count).to.eql(1);
    });

    it('invoke `afterCreate` callback', async () => {
      const list: t.IAfterCreateArgs[] = [];
      const factory = new DbFactory({
        create,
        afterCreate: async e => list.push(e),
      });

      const args = { dir, connect: false };
      const res = await factory.create(args);

      expect(list.length).to.eql(1);
      expect(list[0].args).to.eql(args);
      expect(list[0].db).to.equal(res.db);
      expect(list[0].network).to.eql(res.network);
    });
  });

  describe('get', () => {
    it('undefined (not created)', () => {
      const factory = new DbFactory({ create });
      const res = factory.get({ dir });
      expect(res).to.eql(undefined);
      expect(factory.count).to.eql(0);
    });

    it('gets a created instance from cache', async () => {
      const factory = new DbFactory({ create });
      const res1 = await factory.create({ dir, connect: false });
      const res2 = factory.get({ dir });
      expect(factory.count).to.eql(1);
      expect(res1).to.not.eql(undefined);
      expect(res2).to.not.eql(undefined);
      expect(res2 && res2.db).to.eql(res1 && res1.db);
      expect(res2 && res2.network).to.eql(res1 && res1.network);
    });
  });

  describe('getOrCreate', () => {
    it('creates on get (caches, default)', async () => {
      const factory = new DbFactory({ create });
      expect(factory.isCached({ dir })).to.eql(false);
      expect(factory.count).to.eql(0);
      const res = await factory.getOrCreate({ dir, connect: false });
      expect(res && res.db.dir).to.eql(dir);
      expect(factory.isCached({ dir })).to.eql(true);
      expect(factory.count).to.eql(1);
    });

    it('creates on get (no cache)', async () => {
      const factory = new DbFactory({ create });
      expect(factory.isCached({ dir })).to.eql(false);
      const res = await factory.getOrCreate({ dir, connect: false, cache: false });
      expect(res && res.db.dir).to.eql(dir);
      expect(factory.isCached({ dir })).to.eql(false);
      expect(factory.count).to.eql(0);
    });
  });

  describe('dispose', () => {
    it('removes from cache on DB disposed', async () => {
      const factory = new DbFactory({ create });
      const res = await factory.getOrCreate({ dir, connect: false });
      expect(factory.isCached({ dir })).to.eql(true);
      expect(factory.count).to.eql(1);
      res.db.dispose();
      expect(factory.isCached({ dir })).to.eql(false);
      expect(factory.count).to.eql(0);
    });

    it('disposes of network on DB disposed', async () => {
      const factory = new DbFactory({ create });
      const res = await factory.getOrCreate({ dir, connect: false });
      const { db, network } = res;
      expect(network.isDisposed).to.eql(false);
      db.dispose();
      expect(network.isDisposed).to.eql(true);
    });
  });

  describe('reset', () => {
    it('disposes of all items', async () => {
      const factory = new DbFactory({ create });
      const res1 = await factory.getOrCreate({ dir: dir1, connect: false });
      const res2 = await factory.getOrCreate({ dir: dir2, connect: false });

      expect(factory.count).to.eql(2);
      expect(res1.db.isDisposed).to.eql(false);
      expect(res2.db.isDisposed).to.eql(false);
      expect(res1.network.isDisposed).to.eql(false);
      expect(res2.network.isDisposed).to.eql(false);

      factory.reset();

      expect(factory.count).to.eql(0);
      expect(res1.db.isDisposed).to.eql(true);
      expect(res2.db.isDisposed).to.eql(true);
      expect(res1.network.isDisposed).to.eql(true);
      expect(res2.network.isDisposed).to.eql(true);
    });
  });

  describe('items', () => {
    it('has no items', () => {
      const factory = new DbFactory({ create });
      expect(factory.items).to.eql([]);
    });

    it('has items', async () => {
      const factory = new DbFactory({ create });
      const res1 = await factory.getOrCreate({ dir: dir1, connect: false });
      const res2 = await factory.getOrCreate({ dir: dir2, connect: false });

      const items = factory.items;
      expect(items.length).to.eql(2);

      expect(items[0].db).to.eql(res1.db);
      expect(items[1].db).to.eql(res2.db);

      expect(items[0].network).to.eql(res1.network);
      expect(items[1].network).to.eql(res2.network);
    });
  });
});
