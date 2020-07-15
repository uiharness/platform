import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { color, COLORS, css, CssValue, defaultValue } from '../../common';
import { WindowAddress } from '../WindowAddress';

export type IWindowTitleBarProps = {
  address?: React.ReactNode;
  height?: number;
  style?: CssValue;
};
export type IWindowTitleBarState = {
  isWindowFocused?: boolean;
};

export class WindowTitleBar extends React.PureComponent<
  IWindowTitleBarProps,
  IWindowTitleBarState
> {
  public state: IWindowTitleBarState = {};
  private state$ = new Subject<Partial<IWindowTitleBarState>>();
  private unmounted$ = new Subject();

  public static HEIGHT = 38;
  // public static GRADIENT = `linear-gradient(180deg, #E5E5E5 0%, #CDCDCD 100%)`;

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
    return defaultValue(this.props.height, WindowTitleBar.HEIGHT);
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
    const styles = {
      base: css({
        position: 'relative',
        WebkitAppRegion: 'drag',
        height: WindowTitleBar.HEIGHT,
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
          <WindowAddress address={this.props.address} isWindowFocused={isWindowFocused} />
          <div {...styles.right}></div>
        </div>
      </div>
    );
  }

  private renderBackground() {
    const { isWindowFocused } = this.state;
    const styles = {
      base: css({
        Absolute: 0,
        backgroundColor: COLORS.WHITE,
        pointerEvents: 'none',
      }),
      shade: css({
        Absolute: 0,
        background: isWindowFocused ? color.format(-0.04) : color.format(-0.0),
        borderBottom: `solid 1px ${color.format(isWindowFocused ? -0.1 : -0.08)}`,
      }),
    };
    return (
      <div {...styles.base}>
        <div {...styles.shade} />
      </div>
    );
  }
}
