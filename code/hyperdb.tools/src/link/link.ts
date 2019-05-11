import { t } from '../common';

const getValue = async <T>(db: t.IDb, key: string) => (await db.get(key)).value as T;

/**
 * Setup a helper for performing a `[1..n]` link between models.
 */
export function oneToMany<O extends { id: string }, M extends { id: string }>(args: {
  db: t.IDb;
  one: { dbKey: string; field: keyof O };
  many: { dbKey: string; field: keyof M };
}) {
  const { db, one, many } = args;

  const prepare = async () => {
    const oneModel = await getValue<O>(db, one.dbKey);
    const manyModel = await getValue<M>(db, many.dbKey);
    if (!oneModel) {
      throw new Error(`The [singular] target '${one.dbKey}' does not exist in the DB.`);
    }
    if (!manyModel) {
      throw new Error(`The [many] target '${many.dbKey}' does not exist in the DB.`);
    }

    const oneRef = oneModel[one.field];
    const manyRefs = (manyModel[many.field] || []) as string[];
    if (!Array.isArray(manyRefs)) {
      throw new Error(
        `The target field '${many.field}' for the 'many' relationship on '${
          many.dbKey
        }' must be an array.`,
      );
    }

    // Finish up.
    return { oneModel, manyModel, oneRef, manyRefs };
  };

  return {
    /**
     * Assign the link.
     */
    async link() {
      const res = await prepare();
      const { manyRefs } = res;
      let { oneModel, manyModel } = res;

      const manyId = manyModel.id as any;
      const singularId = oneModel.id as any;
      let batch: any = {};

      // Assign reference to the "singular" target.
      if (oneModel[one.field] !== manyId) {
        oneModel = { ...oneModel, [one.field]: manyId };
        batch = { ...batch, [one.dbKey]: oneModel };
      }

      // Assign reference to the "many" target.
      if (!manyRefs.includes(singularId)) {
        manyModel = { ...manyModel, [many.field]: [...manyRefs, singularId] };
        batch = { ...batch, [many.dbKey]: manyModel };
      }

      // Finish up.
      await db.putMany(batch);
      return { one: oneModel, many: manyModel };
    },

    /**
     * Remove the link.
     */
    async unlink() {
      const res = await prepare();
      const { manyRefs } = res;
      let { oneModel, manyModel } = res;

      const manyId = manyModel.id as any;
      const singularId = oneModel.id as any;
      let batch: any = {};

      // Remove reference from the "singular" target.
      if (oneModel[one.field] === manyId) {
        oneModel = { ...oneModel };
        delete oneModel[one.field];
        batch = { ...batch, [one.dbKey]: oneModel };
      }

      // Remove reference from the "many" target.
      if (manyRefs.includes(singularId)) {
        const refs = manyRefs.filter(item => item !== singularId) as any;
        manyModel = { ...manyModel, [many.field]: refs };
        batch = { ...batch, [many.dbKey]: manyModel };
      }

      // Finish up.
      await db.putMany(batch);
      return { one: oneModel, many: manyModel };
    },

    /**
     * Retrieve the `many` referenced models
     */
    async refs(toDbKey: (ref: string) => string) {
      const { manyRefs } = await prepare();
      const keys = manyRefs.map(ref => toDbKey(ref));
      const values = keys.length > 0 ? await db.getMany(keys) : {};
      return Object.keys(values).reduce((acc: M[], key) => {
        const model = values[key].value;
        return [...acc, model];
      }, []) as M[];
    },
  };
}

/**
 * Setup a helper for performing `[n..n]` links between models.
 */
export function manyToMany<A extends { id: string }, B extends { id: string }>(args: {
  db: t.IDb;
  a: { dbKey: string; field: keyof A };
  b: { dbKey: string; field: keyof B };
}) {
  const { db, a, b } = args;

  const prepare = async () => {
    const oneModel = await getValue<A>(db, a.dbKey);
    const manyModel = await getValue<B>(db, b.dbKey);
    if (!oneModel) {
      throw new Error(`The [singular] target '${a.dbKey}' does not exist in the DB.`);
    }
    if (!manyModel) {
      throw new Error(`The [many] target '${b.dbKey}' does not exist in the DB.`);
    }

    const oneRef = oneModel[a.field];
    const manyRefs = (manyModel[b.field] || []) as string[];
    if (!Array.isArray(manyRefs)) {
      throw new Error(
        `The target field '${b.field}' for the 'many' relationship on '${
          b.dbKey
        }' must be an array.`,
      );
    }

    // Finish up.
    return { oneModel, manyModel, oneRef, manyRefs };
  };

  return {
    async link() {
      // TEMP 🐷 TODO
      await prepare();
    },
  };
}

/**
 * - A/B
 * - getMany (on hyperdb)
 * - oneToMany
 * - manyToMany
 * - oneToOne
 */
