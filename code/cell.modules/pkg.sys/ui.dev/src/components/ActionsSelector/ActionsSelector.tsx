import React, { useState, useRef } from 'react';
import Select, { MenuPlacement } from 'react-select';
import { css, CssValue, t, DEFAULT, COLORS, color, useClickOutside } from '../../common';
import { useEventBus } from './useEventBus';

import { Icons } from '../Icons';
import { ActionsSelectOnChangeEventHandler } from './types';
import { Button } from '../Primitives';

type M = t.Actions;

export type ActionsSelectorProps = {
  selected?: t.Actions;
  actions?: t.Actions[];
  menuPlacement?: MenuPlacement;
  buttonColor?: string | number;
  buttonOverColor?: string | number;
  bus?: t.EventBus;
  style?: CssValue;
  onChange?: ActionsSelectOnChangeEventHandler;
};

export const ActionsSelector: React.FC<ActionsSelectorProps> = (props) => {
  const { actions = [], bus, onChange } = props;

  const busController = useEventBus({ bus, onChange });
  const [showSelector, setShowSelector] = useState<boolean>(false);

  const selectRef = useRef<HTMLDivElement>(null);
  useClickOutside('down', selectRef, (e) => {
    if (showSelector) setShowSelector(false);
  });

  const options: t.ActionSelectItem<M>[] = actions.map((value) => {
    const model = value.toObject();
    const label = model.namespace || DEFAULT.UNNAMED;
    return { label, value };
  });

  const selectedNamespace = props.selected?.toObject().namespace;
  const index = options.findIndex((opt) => opt.value.toObject().namespace === selectedNamespace);
  const value = index < 0 ? undefined : options[index];
  const isSelectable = actions.length > 1;

  const styles = {
    base: css({
      position: 'relative',
      color: COLORS.DARK,
    }),
    button: {
      base: css({ fontSize: 12 }),
      body: css({ Flex: 'horizontal-center-center' }),
      label: css({ position: 'relative', top: 1 }),
    },
    selector: css({
      fontSize: 14,
      Absolute: [null, null, 0, 0],
      minWidth: 250,
    }),
  };

  const label = value?.label;
  const labelColor = color.format(props.buttonColor || -0.5) as string;

  const elButton = label && (
    <Button
      style={styles.button.base}
      isEnabled={isSelectable}
      theme={{
        color: { enabled: labelColor, disabled: labelColor },
        disabledOpacity: 1,
      }}
      overTheme={{ color: { enabled: props.buttonOverColor || COLORS.BLUE } }}
      onClick={() => setShowSelector(true)}
    >
      <div {...styles.button.body}>
        <Icons.Tree size={20} style={{ marginRight: 4 }} color={labelColor} />
        <div {...styles.button.label}>{label}</div>
      </div>
    </Button>
  );

  const elSelector = showSelector && (
    <div {...styles.selector} ref={selectRef}>
      <Select
        options={options}
        value={value}
        defaultValue={options[0]}
        menuPlacement={props.menuPlacement}
        menuIsOpen={true}
        autoFocus={true}
        onChange={(e) => {
          const item = e as t.ActionSelectItem;
          busController.onChange({
            actions,
            selected: item.value,
          });
          setShowSelector(false);
        }}
      />
    </div>
  );

  return (
    <div {...css(styles.base, props.style)}>
      {elButton}
      {elSelector}
    </div>
  );
};
