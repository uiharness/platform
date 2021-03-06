import * as React from 'react';
import { Subject, merge } from 'rxjs';
import { filter, map, share, takeUntil } from 'rxjs/operators';

import { CssValue, t } from '../../common';
import { CommandTreeView, ICommandTreeViewProps } from './CommandTreeView';

export type ICommandTreeProps = {
  cli: t.ICommandState;
  theme?: ICommandTreeViewProps['theme'];
  background?: ICommandTreeViewProps['background'];
  events$?: Subject<t.CommandTreeEvent>;
  style?: CssValue;
};

export class CommandTree extends React.PureComponent<ICommandTreeProps> {
  private unmounted$ = new Subject<void>();
  private _events$ = new Subject<t.CommandTreeEvent>();
  public events$ = this._events$.pipe(takeUntil(this.unmounted$), share());

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    // Setup observables.
    const cliChanged$ = this.cli.changed$.pipe(takeUntil(this.unmounted$));
    const cliInvoked$ = this.cli.invoked$.pipe(takeUntil(this.unmounted$));
    const tree$ = this.events$;

    // Bubble events.
    if (this.props.events$) {
      this.events$.subscribe(this.props.events$);
    }

    // Redraw on CLI changed.
    merge(cliChanged$, cliInvoked$).subscribe((e) => this.forceUpdate());

    tree$
      // Invoke command on click.
      .pipe(
        filter((e) => e.type === 'COMMAND_TREE/click'),
        map((e) => e.payload as t.ICommandTreeClick),
      )
      .subscribe((e) => {
        this.cli.change({ text: e.command.name });
        this.cli.invoke({ stepIntoNamespace: false });
      });

    tree$
      // Invoke command when the command changes.
      .pipe(
        filter((e) => e.type === 'COMMAND_TREE/current'),
        map((e) => e.payload as t.ICommandTreeCurrent),
      )
      .subscribe((e) => {
        const command = e.command;
        const text = command ? command.name : '';
        if (e.direction === 'CHILD') {
          this.cli.change({ text });
          this.cli.invoke({ stepIntoNamespace: true });
        } else {
          const namespace = e.direction === 'PARENT' ? 'PARENT' : true;
          this.cli.change({ text, namespace, invoke: true });
        }
      });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get cli() {
    return this.props.cli;
  }

  public get nsCommand() {
    return this.cli.namespace ? this.cli.namespace.command : undefined;
  }

  /**
   * [Render]
   */
  public render() {
    return (
      <CommandTreeView
        rootCommand={this.cli.root}
        nsCommand={this.nsCommand}
        currentCommand={this.cli.command}
        fuzzyMatches={this.cli.fuzzy.matches}
        isAutocompleted={Boolean(this.cli.autoCompleted)}
        theme={this.props.theme}
        background={this.props.background}
        events$={this._events$}
        style={this.props.style}
      />
    );
  }
}
