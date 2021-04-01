import React from 'react';

import { PropListItem } from '..';
import { COLORS, css } from './common';

export const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.';

const styles = {
  label: css({
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    flex: 1,
    height: 40,
    padding: 3,
    paddingLeft: 30,
    Flex: 'horizontal-end-end',
    color: COLORS.MAGENTA,
  }),
  value: css({
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    height: 40,
    Flex: 'center-center',
    flex: 1,
  }),
};

export const items: PropListItem[] = [
  { label: 'string', value: 'hello' },
  { label: 'number', value: { data: 123456, clipboard: 'Value: 123456', monospace: true } },
  { label: 'boolean', value: true },
  { label: 'boolean (switch)', value: { data: true, kind: 'Switch' } },
  { label: 'thing monospace', value: { data: 'thing', clipboard: true, monospace: true } },
  { label: 'long (ellipsis)', value: LOREM },
  {
    label: 'click handler',
    value: {
      data: 'click me',
      onClick: (e) => e.message(<div style={{ color: COLORS.MAGENTA }}>foobar</div>, 3000),
    },
  },
  {
    label: 'label',
    value: <div {...styles.value}>value</div>,
  },
  {
    label: <div {...styles.label}>label</div>,
    value: 'value',
  },
];