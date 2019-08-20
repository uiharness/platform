import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { css, color, GlamorValue } from './common';

export type ITestProps = { style?: GlamorValue };
export type ITestState = { count?: number; foo?: JSX.Element };

export class Test extends React.PureComponent<ITestProps, ITestState> {
  public state: ITestState = {};
  private state$ = new Subject<Partial<ITestState>>();
  private unmounted$ = new Subject<{}>();

  /**
   * [Lifecycle]
   */
  public componentWillMount() {
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    state$.subscribe(e => this.setState(e));
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get count() {
    return this.state.count || 0;
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        fontSize: 34,
        PaddingX: 50,
        PaddingY: 20,
      }),
      image: css({ borderRadius: 8 }),
    };
    return (
      <div {...css(styles.base, this.props.style)} onClick={this.handleClick}>
        <div>cat: {this.count || 0}</div>
        <img src='/images/cat.jpg' {...styles.image} />
        {this.state.foo}
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private handleClick = async () => {
    this.state$.next({ count: this.count + 1 });

    const foo = import('./Foo');

    // const foo = pages.Foo;
    // console.log('foo', foo);

    const Foo: any = await foo;
    // console.log('foo', foo);
    console.log('Foo', Foo);
    console.log('Foo', Foo.Foo);

    const el = <Foo.Foo />;

    console.log('el', el);
    this.state$.next({ foo: el });
  };
}
