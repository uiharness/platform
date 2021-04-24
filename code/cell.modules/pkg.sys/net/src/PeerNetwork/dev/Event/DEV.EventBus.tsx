import { color } from '@platform/css';
import React, { useEffect, useState } from 'react';

import {
  COLORS,
  css,
  CssValue,
  EventBusHistory,
  EventPipe,
  EventStack,
  Icons,
  t,
  Textbox,
} from '../common';

export type DevEventbusOnBroadcastEvent = { bus: t.EventBus<any>; message: string };
export type DevEventBusOnBroadcastEventHandler = (e: DevEventbusOnBroadcastEvent) => void;

export type DevEventBusProps = {
  bus: t.EventBus<any>;
  history: EventBusHistory;
  canBroadcast?: boolean;
  style?: CssValue;
  onBroadcast?: DevEventBusOnBroadcastEventHandler;
};

export const DevEventBus: React.FC<DevEventBusProps> = (props) => {
  const { canBroadcast, history } = props;
  const bus = props.bus;

  const styles = {
    base: css({ position: 'relative' }),
    textbox: css({ MarginX: 20, fontSize: 12 }),
    stack: css({ marginTop: 20 }),
    pipe: css({ marginTop: 15, MarginX: 15 }),
  };

  const [eventMessage, setEventMessage] = useState<string>('');

  const broadcastEvent = () => {
    if (props.onBroadcast) {
      const message = eventMessage.trim() ? eventMessage : `<empty>`;
      props.onBroadcast({ bus, message });
    }
  };

  const elTextbox = canBroadcast && (
    <Textbox
      value={eventMessage}
      placeholder={'broadcast sample event'}
      onChange={(e) => setEventMessage(e.to)}
      style={styles.textbox}
      enter={{
        handler: broadcastEvent,
        icon: (e) => {
          const msg = eventMessage.trim();
          const col = msg || e.isFocused ? COLORS.BLUE : color.alpha(COLORS.DARK, 0.3);
          const el = <Icons.Send size={16} color={col} />;
          return el;
        },
      }}
    />
  );

  const body = history.total > 0 && (
    <>
      <EventStack
        events={history.events}
        card={{ duration: 150, title: 'Event' }}
        style={styles.stack}
      />
      <EventPipe
        events={history.events}
        style={styles.pipe}
        onEventClick={(e) => {
          console.group('🌳 event');
          console.log('count', e.count);
          console.log('type', e.event.type);
          console.log('payload', e.event.payload);
          console.groupEnd();
        }}
      />
    </>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elTextbox}
      {body}
    </div>
  );
};
