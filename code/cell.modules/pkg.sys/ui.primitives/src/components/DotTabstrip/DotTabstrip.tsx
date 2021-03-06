import React from 'react';

import { css, CssValue, t } from '../../common';
import { DotTabstripItem } from './DotTabstrip.Item';
import { toItems } from './util';

export type DotTabstripProps = {
  selected?: number; // index.
  items?: (t.DotTabstripItem | string)[];
  defaultColor?: string | number;
  highlightColor?: string | number;
  selectedColor?: string | number;
  errorColor?: string | number;
  style?: CssValue;
  onClick?: t.DotTabstripClickEventHandler;
};

/**
 * A row of dots that are selectable
 */
export const DotTabstrip: React.FC<DotTabstripProps> = (props) => {
  const items = toItems(props.items);

  const styles = {
    base: css({ Flex: 'horizontal-center-center' }),
    dot: {
      marginRight: 10,
      ':last-child': { marginRight: 0 },
    },
  };

  const elItems = items.map((item, index) => {
    const isSelected = index === props.selected;
    return (
      <DotTabstripItem
        key={index}
        index={index}
        item={item}
        isSelected={isSelected}
        style={styles.dot}
        onClick={props.onClick}
        defaultColor={props.defaultColor}
        highlightColor={props.highlightColor}
        selectedColor={props.selectedColor}
        errorColor={props.errorColor}
      />
    );
  });

  return <div {...css(styles.base, props.style)}>{elItems}</div>;
};

export default DotTabstrip;
