import { asArray } from '@platform/util.value';
import React from 'react';
import { ActionButtonHandlerArgs, DevActions, toObject } from 'sys.ui.dev';

import { css, rx, StateObject, t, bundle, WebRuntime } from './common';
import { Conversation, ConversationProps } from './Conversation';
import { stateController } from './Conversation.controller';
import { PeerImage } from './PeerImage';
import { Remote } from './Remote';

type O = Record<string, unknown>;
type B = t.EventBus<t.ConversationEvent>;
type Ctx = { fire: B['fire']; props: ConversationProps };
type E = ActionButtonHandlerArgs<Ctx>;

const loadDir = (e: ActionButtonHandlerArgs<Ctx>, dir: string) => {
  const imageDir = `static/images.tmp/${dir}/`;
  e.ctx.fire({ type: 'Conversation/publish', payload: { kind: 'model', data: { imageDir } } });
};

/**
 * Actions
 */
export const actions = DevActions<Ctx>()
  .namespace(`Conversation`)
  .context((prev) => {
    if (prev) return prev;

    const bus = rx.bus<t.ConversationEvent>();
    const model = StateObject.create<t.ConversationState>({ peers: {} });
    stateController({ bus, model });

    return {
      fire: bus.fire,
      props: { bus, model },
      remote: {},
    };
  })

  .items((e) => {
    e.title(`Conversation - v${WebRuntime.module.version || '0.0.0'}`);

    e.button('log: model', (e) => console.log('model', e.ctx.props.model.state));
    e.button('log: peers', (e) => {
      const peers = e.ctx.props.model.state.peers;
      console.group('🌳 peers');
      Object.keys(peers).forEach((key) => {
        const peer = peers[key];
        console.log(peer.isSelf ? 'self' : 'peer', peer);
      });
      console.groupEnd();
    });
    e.hr();
  })

  .items((e) => {
    e.title('Diagrams');
    e.button('load: dir-4', (e) => loadDir(e, 'dir-4'));
    e.button('load: dir-5', (e) => loadDir(e, 'dir-5'));
    e.button('load: dir-6', (e) => loadDir(e, 'dir-6'));
    e.hr();
  })

  .items((e) => {
    e.title('Body Component');

    const remote = 'https://dev.db.team/cell:cklrm37vp000el8et0cw7gaft:A1/fs/sample/remoteEntry.js';
    const local = 'http://localhost:3000/remoteEntry.js';

    e.button('cloud: app', (e) => {
      const namespace = 'tdb.slc';
      const entry = './App';
      const url = remote;
      e.ctx.props.body = (
        <Remote url={url} namespace={namespace} entry={entry} props={{ style: { Absolute: 50 } }} />
      );
    });
    e.button('cloud: canvas', (e) => {
      const namespace = 'tdb.slc';
      const entry = './MiniCanvasMouse';
      const props = { theme: 'light', selected: 'purpose' };
      e.ctx.props.body = <Remote url={remote} namespace={namespace} entry={entry} props={props} />;
    });

    e.button('load: <PeerImage>', (e) => {
      const bus = toObject(e.ctx.props.bus) as t.EventBus<any>;
      console.log('bus', bus);

      e.ctx.props.body = <PeerImage bus={bus} style={{ Absolute: 50 }} />;
    });

    e.hr(1, 0.2);

    e.button('clear', (e) => (e.ctx.props.body = undefined));
    e.hr();
  })

  /**
   * Render
   */
  .subject((e) => {
    const state = e.ctx.props.model.state;

    e.settings({
      layout: {
        border: -0.1,
        cropmarks: -0.2,
        background: 1,
        position: [80, 80, 120, 80],
        label: {
          topLeft: 'Conversation.Layout',
          topRight: `folder: ${asArray(state.imageDir).join(', ') || '<none>'}`,
        },
      },
      host: { background: -0.04 },
    });

    const el = (
      <div {...css({ Absolute: 0, overflow: 'hidden', display: 'flex' })}>
        <Conversation {...e.ctx.props} />
      </div>
    );

    e.render(el);
  });

export default actions;