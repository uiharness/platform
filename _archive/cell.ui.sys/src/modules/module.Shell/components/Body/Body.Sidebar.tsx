import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { css, CssValue, t, ui } from '../../common';

export type ISidebarProps = {
  bus: t.EventBus;
  module: t.ShellModule;
  style?: CssValue;
};
export type ISidebarState = t.Object;

export class Sidebar extends React.PureComponent<ISidebarProps, ISidebarState> {
  public state: ISidebarState = {};
  private state$ = new Subject<Partial<ISidebarState>>();
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
   * [Properties]
   */
  public get module() {
    return this.props.module;
  }

  /**
   * [Render]
   */
  public render() {
    const SIDEBAR: t.ShellRegion = 'Sidebar';

    const styles = {
      base: css({
        position: 'relative',
        flex: 1,
        PaddingX: 20,
        PaddingY: 20,
        fontSize: 14,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <ui.ModuleView.Frame bus={this.props.bus} filter={this.viewFilter} region={SIDEBAR} />
      </div>
    );
  }

  /**
   * Handlers
   */
  private viewFilter: t.ModuleFilterView<t.ShellView, t.ShellRegion> = (e) => {
    const module = this.module.id;

    if (e.view === 'Null') {
      // NB: This is the DevHarness clearing the sidebar.
      return e.target === module;
    } else {
      // NB: Ignore the DevHarness module itself.
      //     We are looking for "dev" components hosted within the harness.
      return e.module !== module;
    }
  };
}
