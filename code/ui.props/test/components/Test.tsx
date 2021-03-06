import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import * as cli from '../cli';
import { log, color, css, CommandShell, t, ObjectView, COLORS, Props } from '../common';

export type ITestProps = {};

export class Test extends React.PureComponent<ITestProps, t.ITestState> {
  public state: t.ITestState = { data: { ...cli.SAMPLE } };
  private unmounted$ = new Subject<void>();
  private state$ = new Subject<Partial<t.ITestState>>();
  private events$ = new Subject<t.PropsEvent>();
  private cli: t.ICommandState = cli.init({ state$: this.state$ });

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    state$.subscribe((e) => this.setState(e));
    events$.subscribe((e) => {
      log.info('🌳', e.type, e.payload);
    });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Render]
   */
  public render() {
    const { theme = 'DARK' } = this.state;
    const isDark = theme === 'DARK';
    const styles = {
      base: css({
        Absolute: 0,
        backgroundColor: isDark ? COLORS.DARK : undefined,
        Flex: 'horizontal-stretch-stretch',
        borderBottom: `solid 1px ${color.format(0.15)}`,
      }),
      left: css({
        flex: 1,
        Flex: 'center-center',
      }),
      right: css({
        Scroll: true,
        borderLeft: `solid 1px ${color.format(isDark ? 0.15 : -0.15)}`,
        width: 300,
        padding: 8,
      }),
      propsOuter: css({
        position: 'relative',
        border: `solid 1px ${color.format(isDark ? 0.2 : -0.15)}`,
        height: '85%',
        width: 300,
      }),
      props: css({ Absolute: 0 }),
    };

    return (
      <CommandShell cli={this.cli} tree={{}} localStorage={true}>
        <div {...styles.base}>
          <div {...styles.left}>
            <div {...styles.propsOuter}>
              <Props
                data={this.state.data}
                filter={this.filter}
                style={styles.props}
                theme={theme}
                onChange={this.handleChange}
                renderValue={this.valueFactory}
                events$={this.events$}
                insertable={this.state.isInsertable}
                deletable={this.state.isDeletable}
              />
            </div>
          </div>
          <div {...styles.right}>
            <ObjectView name={'state'} data={this.state} theme={theme} expandLevel={5} />
          </div>
        </div>
      </CommandShell>
    );
  }

  private valueFactory: t.PropValueFactory = (e) => {
    if (e.path === 'custom') {
      const styles = {
        base: css({
          flex: 1,
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          padding: 3,
          border: `dashed 1px ${color.format(0.2)}`,
          borderRadius: 4,
          Flex: 'center-center',
        }),
      };
      const el = (
        <div {...styles.base}>
          <div>Custom</div>
        </div>
      );

      return { el, underline: { color: '#65D9EF', style: 'dashed' } };
    }

    if (e.path === 'custom-props') {
      return { underline: { color: '#F93B7E', style: 'dashed' } };
    }

    return;
  };

  /**
   * [Handlers]
   */

  private filter: t.PropFilter = (e) => {
    if (e.path.includes('foo.hide')) {
      return false;
    }

    if (e.key === 'isFiltered') {
      return false;
    }
    return true;
  };

  private handleChange = (e: t.IPropsChange) => {
    const data = e.data.to;
    this.state$.next({ data });
  };
}
