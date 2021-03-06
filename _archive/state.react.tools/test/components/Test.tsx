import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import * as cli from '../cli';
import { color, COLORS, CommandShell, css, t, tools } from '../common';
import { Provider, store } from '../store';
import { Child } from './Test.Child';

export type ITestProps = {};

export class Test extends React.PureComponent<ITestProps> {
  private unmounted$ = new Subject();
  private cli!: t.ICommandState;

  /**
   * [Lifecycle]
   */

  constructor(props: ITestProps) {
    super(props);
    this.cli = cli.init({});
  }

  public componentDidMount() {
    const changed$ = store.changed$.pipe(takeUntil(this.unmounted$));
    changed$.subscribe(e => this.forceUpdate());
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const debug = store.state.debug;
    const isSplit = debug === 'SPLIT';

    const styles = {
      base: css({ flex: 1, Flex: 'horizontal' }),
      left: css({
        flex: 1,
        padding: 30,
      }),
      right: css({
        width: isSplit ? 550 : 300,
        backgroundColor: COLORS.DARK,
        borderBottom: `solid 1px ${color.format(0.15)}`,
        display: 'flex',
      }),
    };

    return (
      <Provider>
        <CommandShell cli={this.cli} tree={{}}>
          <div {...styles.base}>
            <div {...styles.left}>
              <Child>
                <Child />
              </Child>
            </div>
            <div {...styles.right}>
              <tools.Store store={store} layout={debug} />
            </div>
          </div>
        </CommandShell>
      </Provider>
    );
  }
}
