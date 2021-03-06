import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { css, color, CssValue, COLORS, util, t } from '../../common';
import { WindowAddressContent } from './WindowAddressContent';

export type IWindowTitlebarAddressProps = {
  address?: React.ReactNode;
  borderColor?: string | number;
  isWindowFocused?: boolean;
  style?: CssValue;
};
export type IWindowTitlebarAddressState = { isFocused?: boolean };

export class WindowTitlebarAddress extends React.PureComponent<
  IWindowTitlebarAddressProps,
  IWindowTitlebarAddressState
> {
  public state: IWindowTitlebarAddressState = {};
  private state$ = new Subject<Partial<IWindowTitlebarAddressState>>();
  private unmounted$ = new Subject<void>();

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
    document.addEventListener('paste', this.paste);
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
    document.removeEventListener('paste', this.paste);
  }

  /**
   * [Properties]
   */
  public get isFocused() {
    return this.state.isFocused;
  }

  /**
   * [Methods]
   */
  private paste = (event: ClipboardEvent) => {
    if (this.isFocused) {
      const event$ = util.getEventBus<t.UiEvent>();
      event$.next({
        type: 'UI:WindowAddress/paste',
        payload: {
          event,
          get text() {
            return event.clipboardData?.getData('text') || '';
          },
        },
      });
    }
  };

  /**
   * [Render]
   */
  public render() {
    const { isWindowFocused, borderColor = -0.2 } = this.props;
    const isFocused = this.isFocused;
    const styles = {
      base: css({
        position: 'relative',
        backgroundColor: color.format(1),
        border: `solid 1px ${color.format(borderColor)}`,
        borderRadius: 5,
        fontSize: 12,
        height: 26,
        minWidth: 360,
        boxSizing: 'border-box',
        opacity: isWindowFocused ? 1 : 0.35,
        color: color.format(-0.7),
        outline: 'none',
      }),
      focusBorder: css({
        borderRadius: 4,
        Absolute: -2,
        border: `solid 2px ${color.format(COLORS.BLUE)}`,
      }),
    };

    return (
      <div
        {...styles.base}
        tabIndex={0}
        onFocus={this.focusHandler(true)}
        onBlur={this.focusHandler(false)}
      >
        <WindowAddressContent address={this.props.address} />
        {isFocused && <div {...styles.focusBorder} />}
      </div>
    );
  }

  /**
   * [Handlers]
   */

  private focusHandler = (isFocused: boolean) => {
    return () => this.state$.next({ isFocused });
  };
}
