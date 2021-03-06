import React, { useEffect, useState } from 'react';

import { css, CssValue, defaultValue, t } from '../common';
import { SwitchThumb } from './Switch.Thumb';
import { SwitchTrack } from './Switch.Track';
import { SwitchTheme } from './SwitchTheme';

export type SwitchProps = {
  id?: string;
  value?: boolean;
  width?: number;
  height?: number;
  isEnabled?: boolean;
  tooltip?: string;
  track?: Partial<t.ISwitchTrack>;
  thumb?: Partial<t.ISwitchThumb>;
  theme?: t.SwitchThemeName | Partial<t.ISwitchTheme>;
  transitionSpeed?: number;
  style?: CssValue;

  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};

export const Switch: React.FC<SwitchProps> = (props) => {
  const [isDown, setIsDown] = useState<boolean>(false);
  const [isOver, setIsOver] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const { track = {}, thumb = {} } = props;
  const theme = toTheme(props.theme);
  const height = defaultValue(props.height, 32);
  const width = defaultValue(props.width, height * 2 - height * 0.4);
  const transitionSpeed = defaultValue(props.transitionSpeed, 200);
  const isEnabled = defaultValue(props.isEnabled, true);
  const value = Boolean(props.value);

  const args = {
    isLoaded,
    isEnabled,
    value,
    theme,
    width,
    height,
    transitionSpeed,
  };

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      display: 'inline-block',
      width,
      height,
      opacity: isEnabled ? 1 : theme.disabledOpacity,
    }),
  };

  const handleOnClick = (e: React.MouseEvent) => {
    if (e.button === 0 && props.onClick) {
      props.onClick(e);
    }
  };

  const overHandler = (isOver: boolean): React.MouseEventHandler => {
    return (e) => {
      setIsOver(isOver);
      if (!isOver && isDown) setIsDown(false);
      if (isEnabled) {
        if (isOver && props.onMouseEnter) props.onMouseEnter(e);
        if (!isOver && props.onMouseLeave) props.onMouseLeave(e);
      }
    };
  };

  const downHandler = (isDown: boolean): React.MouseEventHandler => {
    return (e) => {
      setIsDown(isDown);
      if (isEnabled) {
        if (isDown && props.onMouseDown) props.onMouseDown(e);
        if (!isDown && props.onMouseUp) props.onMouseUp(e);
        if (!isDown && props.onClick) handleOnClick(e);
      }
    };
  };

  return (
    <div
      {...css(styles.base, props.style)}
      title={props.tooltip}
      onMouseEnter={overHandler(true)}
      onMouseLeave={overHandler(false)}
      onMouseDown={downHandler(true)}
      onMouseUp={downHandler(false)}
    >
      <SwitchTrack track={track} switch={args} />
      <SwitchThumb thumb={thumb} switch={args} />
    </div>
  );
};

/**
 * [Helpers]
 */

function toTheme(input?: t.SwitchThemeName | Partial<t.ISwitchTheme>): t.ISwitchTheme {
  let theme = input || 'LIGHT';
  theme =
    typeof theme === 'string' ? SwitchTheme.fromString(theme as t.SwitchThemeName).green : theme;
  return theme as t.ISwitchTheme;
}
