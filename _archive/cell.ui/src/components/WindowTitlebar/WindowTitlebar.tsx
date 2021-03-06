import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { color, COLORS, css, CssValue, defaultValue } from '../../common';
import { WindowTitlebarAddress } from '../WindowTitlebar.Address';

export type IWindowTitlebarProps = {
  address?: React.ReactNode;
  height?: number;
  theme?: 'SILVER' | 'WHITE';
  style?: CssValue;
};
export type IWindowTitlebarState = {
  isWindowFocused?: boolean;
};

export class WindowTitlebar extends React.PureComponent<
  IWindowTitlebarProps,
  IWindowTitlebarState
> {
  public state: IWindowTitlebarState = {};
  private state$ = new Subject<Partial<IWindowTitlebarState>>();
  private unmounted$ = new Subject<void>();

  public static HEIGHT = 38;
  public static GRADIENT = `linear-gradient(180deg, #E5E5E5 0%, #CDCDCD 100%)`;

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
    this.updateState();

    window.addEventListener('focus', this.updateState);
    window.addEventListener('blur', this.updateState);
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();

    window.removeEventListener('focus', this.updateState);
    window.removeEventListener('blur', this.updateState);
  }

  /**
   * [Properties]
   */
  public get height() {
    return defaultValue(this.props.height, WindowTitlebar.HEIGHT);
  }

  public get theme() {
    return this.props.theme || 'SILVER';
  }

  /**
   * [Methods]
   */

  private updateState = () => {
    this.state$.next({ isWindowFocused: document.hasFocus() });
  };

  /**
   * [Render]
   */
  public render() {
    const { isWindowFocused } = this.state;
    const borderColor = this.theme === 'SILVER' ? -0.2 : -0.14;
    const styles = {
      base: css({
        position: 'relative',
        WebkitAppRegion: 'drag',
        height: WindowTitlebar.HEIGHT,
        boxSizing: 'border-box',
        userSelect: 'none',
        color: COLORS.DARK,
        overflow: 'hidden',
      }),
      body: css({
        Absolute: 0,
        Flex: 'horizontal-center-spaceBetween',
      }),
      left: css({ minWidth: 78 }),
      right: css({ minWidth: 78 }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        {this.renderBackground()}
        <div {...styles.body}>
          <div {...styles.left}></div>
          <WindowTitlebarAddress
            address={this.props.address}
            isWindowFocused={isWindowFocused}
            borderColor={borderColor}
          />
          <div {...styles.right}></div>
        </div>
      </div>
    );
  }

  private renderBackground() {
    const theme = this.theme;

    const { isWindowFocused } = this.state;
    const styles = {
      base: css({
        Absolute: 0,
        backgroundColor: COLORS.WHITE,
        pointerEvents: 'none',
      }),
      silver: theme === 'SILVER' && {
        Absolute: 0,
        background: isWindowFocused ? WindowTitlebar.GRADIENT : color.format(-0.0),
        borderBottom: `solid 1px ${color.format(isWindowFocused ? -0.2 : -0.08)}`,
      },
      white: theme === 'WHITE' && {
        Absolute: 0,
        background: isWindowFocused ? color.format(-0.06) : color.format(-0.0),
        borderBottom: `solid 1px ${color.format(isWindowFocused ? -0.1 : -0.08)}`,
      },
    };

    return (
      <div {...styles.base}>
        <div {...css(styles.silver, styles.white)} />
      </div>
    );
  }
}
