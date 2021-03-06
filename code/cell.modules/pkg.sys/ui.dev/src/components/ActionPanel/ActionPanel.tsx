import React from 'react';

import { constants, css, defaultValue, t } from '../../common';
import { useActionsRedraw } from '../../components.hooks';
import { useActionPanelController } from '../../components.hooks';

export type ActionPanelProps = t.ActionPanelProps & {
  bus: t.EventBus;
  actions: t.Actions<any>;
};

export const ActionPanel: React.FC<ActionPanelProps> = (props) => {
  const { actions, bus } = props;
  const scrollable = defaultValue(props.scrollable, true);
  const model = actions.toObject();
  const defs = actions.toDefs();
  const { namespace, items } = model;
  const hasItems = items.length > 0;

  useActionPanelController({ bus, actions });
  useActionsRedraw({
    name: '<ActionPanel>',
    bus,
    actions,
    paths: ['ctx/current', 'items', 'initialized'],
  });

  const styles = {
    base: css({
      Scroll: scrollable,
      overflowY: scrollable ? 'scroll' : 'hidden',
      userSelect: 'none',
      boxSizing: 'border-box',
      color: constants.COLORS.DARK,
      fontFamily: constants.FONT.SANS,
      fontSize: 14,
    }),
    spacer: {
      top: css({ height: 5 }),
      bottom: css({ height: 80 }),
    },
  };

  const elItems = items.map((item, i) => {
    const key = `item.${namespace}.${i}`;
    const def = defs.find((def) => def.kind === item.kind);
    if (!def) throw new Error(`A definition for item '${item.kind}' (${i}) not found`);
    return <def.Component key={key} namespace={namespace} item={item} bus={bus} />;
  });

  return (
    <div {...css(styles.base, props.style)} className={constants.CSS.ACTIONS}>
      {hasItems && <div {...styles.spacer.top} />}
      {elItems}
      {hasItems && <div {...styles.spacer.bottom} />}
    </div>
  );
};
