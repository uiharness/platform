import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { css, color, CssValue, ObjectView, state, t, Button, Hr, log } from '../common';

export type IChildProps = {
  children?: React.ReactNode;
  style?: CssValue;
};

export class Child extends React.PureComponent<IChildProps> {
  private unmounted$ = new Subject();

  public static contextType = state.Context;
  // public context!: state.ReactContext;
  public context!: t.IMyContext;
  public store = this.context.getStore<t.IMyModel, t.MyEvent>();

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const changed$ = this.store.changed$.pipe(takeUntil(this.unmounted$));
    changed$.subscribe(e => this.forceUpdate());

    const context = this.context;
    log.group('Context');
    log.info('- context:', context);
    log.info('- context.foo:', context.foo);
    log.info('- context.getAsync:', context.getAsync());
    log.groupEnd();
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
        backgroundColor: color.format(-0.01),
        border: `dashed 2px ${color.format(-0.1)}`,
        borderRadius: 8,
        margin: 20,
        padding: 15,
        color: color.format(-0.6),
      }),
    };

    const data = { state: this.store.state };

    return (
      <div {...css(styles.base, this.props.style)}>
        <div>
          <Button label={'increment'} onClick={this.increment} />
          <Button label={'decrement'} onClick={this.decrement} />
        </div>
        <Hr margin={8} />
        <ObjectView name={'store'} data={data} expandLevel={2} />
        {this.props.children}
      </div>
    );
  }

  private increment = () => {
    this.store.dispatch({ type: 'TEST/increment', payload: {} });
  };

  private decrement = () => {
    this.store.dispatch({ type: 'TEST/decrement', payload: {} });
  };
}
