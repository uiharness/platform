import React from 'react';
import { ObjectView } from 'sys.ui.dev';

import { usePeerNetworkState } from '../hooks';
import { COLORS, css, CssValue, t } from './common';
import { Network } from './DEV.Network';

export type RootLayoutProps = {
  self: t.PeerId;
  bus: t.EventBus<any>;
  netbus: t.EventBus<any>;
  debugJson?: boolean;
  style?: CssValue;
};

export const RootLayout: React.FC<RootLayoutProps> = (props) => {
  const { netbus } = props;
  const bus = props.bus.type<t.PeerEvent>();

  const state = usePeerNetworkState({ self: props.self, bus });
  const network = state.peer;

  const styles = {
    base: css({
      flex: 1,
      Flex: 'horizontal-stretch-stretch',
      color: COLORS.DARK,
      overflow: 'hidden',
    }),
    left: css({
      flex: 1,
      Flex: 'vertical-stretch-stretch',
    }),
    middle: css({
      width: 80,
      Flex: 'vertical-stretch-center',
    }),
    right: css({
      flex: 1,
      padding: 20,
      maxWidth: 350,
    }),
    verticalRule: css({
      flex: 1,
      width: 1,
      borderLeft: `solid 1px ${COLORS.MAGENTA}`,
      borderRight: `solid 1px ${COLORS.MAGENTA}`,
      opacity: 0.3,
    }),
  };

  const elJson = props.debugJson && (
    <>
      <div {...styles.middle}>
        <div {...styles.verticalRule} />
      </div>
      <div {...styles.right}>
        <ObjectView name={'state'} data={state.peer} expandLevel={5} />
      </div>
    </>
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.left}>
        {network && <Network bus={bus} netbus={netbus} status={network} />}
      </div>
      {elJson}
    </div>
  );
};