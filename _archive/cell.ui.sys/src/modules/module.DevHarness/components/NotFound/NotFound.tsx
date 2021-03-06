import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { css, CssValue, t } from '../../common';

export type INotFoundProps = { style?: CssValue };
export type INotFoundState = t.Object;

export class NotFound extends React.PureComponent<INotFoundProps, INotFoundState> {
  public state: INotFoundState = {};
  private state$ = new Subject<Partial<INotFoundState>>();
  private unmounted$ = new Subject<void>();

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        flex: 1,
        Flex: 'center-center',
        position: 'relative',
        userSelect: 'none',
      }),
      label: css({ opacity: 0.5 }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <div {...styles.label}>Not Found</div>
      </div>
    );
  }
}
