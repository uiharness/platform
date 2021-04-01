import React, { useEffect, useRef, useState } from 'react';

import { Button, Card, css, CssValue, Hr, PropList, PropListItem, t } from './common';

export type ConnectionMediaProps = {
  bus: t.EventBus<any>;
  connection: t.PeerConnectionMediaStatus;
  isLast?: boolean;
  style?: CssValue;
  margin?: t.CssEdgesInput;
};

export const ConnectionMedia: React.FC<ConnectionMediaProps> = (props) => {
  const { connection } = props;
  const bus = props.bus.type<t.PeerEvent>();

  const id = connection.id;

  const styles = {
    base: css({ fontSize: 14 }),
    buttons: css({
      Flex: 'horizontal-center-spaceBetween',
    }),
  };

  const items: PropListItem[] = [
    { label: 'id', value: { data: id.remote, clipboard: true } },
    { label: 'kind', value: connection.kind },
    { label: 'open', value: connection.isOpen },
    { label: 'media', value: Boolean(connection.media) },
  ];

  const hr = <Hr thickness={5} opacity={0.1} margin={[10, 0]} />;

  return (
    <div {...css(styles.base, props.style)}>
      <Card key={id.remote} padding={[15, 20]} margin={props.margin} width={280}>
        <PropList items={items} />
        {hr}

        <div {...styles.buttons}>
          <div />
          {/* <Button
            onClick={() => {
              bus.fire({
                type: 'Peer:Network/status:req',
                payload: { ref: id.local },
              });
            }}
          >
            Redraw
          </Button> */}
          <Button
            onClick={() => {
              bus.fire({
                type: 'Peer:Connection/disconnect:req',
                payload: { ref: id.local, remote: id.remote },
              });
            }}
          >
            Close
          </Button>
        </div>

        {/* {hr} */}

        {/* <ObjectView data={connection} /> */}
      </Card>
    </div>
  );
};