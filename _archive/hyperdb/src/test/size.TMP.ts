import { Db } from '..';
import { time, fs } from '../common';
import * as filesize from 'filesize';

const dir = '.tmp.test/db-size';
// after(async () => fs.remove('tmp'));
// before(async () => fs.remove(dir));

describe('tmp', function() {
  this.timeout(999999);
  beforeEach(async () => fs.remove(dir));

  it('large', async () => {
    // const db = await Db.create({ dir });
    // const timer = time.timer();
    // const KEY = 'foo';
    // console.log('started...');
    // const wait = Array.from({ length: 1000 }).map(async (v, i) => {
    //   const value = `value-${i + 1}`;
    //   await db.put(KEY, value);
    // });
    // await Promise.all(wait);
    // // await db.put(KEY, 123);
    // const foo = await db.get(KEY);
    // console.log('foo', foo.value);
    // console.log('foo / seq', foo.props.seq);
    // console.log('-------------------------------------------');
    // const stats = await db.stats();
    // const size = filesize(stats.size.bytes);
    // console.log('size', size);
    // // console.log('filesize', filesize);
    // // console.log('stats', stats.size);
    // console.log('elapsed', timer.elapsed('s'), 's');
  });
});
