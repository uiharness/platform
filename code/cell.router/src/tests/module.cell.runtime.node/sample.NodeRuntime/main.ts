import * as t from './types';
import { echo } from './app';

const params = (env.in.value || {}) as t.ISampleNodeInValue;

if (typeof params.repeatDone === 'number') {
  Array.from({ length: params.repeatDone }).forEach((v, i) => env.out.done({ count: i + 1 }));
} else {
  if (params.setContentType) {
    env.out.contentType(params.setContentType);
  }
  if (params.setContentDef) {
    env.out.contentDef(params.setContentDef);
  }

  if (params.delay) {
    console.log('delay start', params.id, params.delay);
    setTimeout(() => {
      console.log(params.id, 'delay complete');
      env.out.done<t.ISampleNodeOutValue>({ echo: echo(), process: process.env });
    }, params.delay);
  } else {
    env.out.done<t.ISampleNodeOutValue>({ echo: echo(), process: process.env });
  }
}
