import * as React from 'react';
import { Subject } from 'rxjs';

import { css, CssValue, t, ui } from '../../common';
import { TreeShell } from '../Finder.TreeShell';
import { WindowTitleBar } from '../primitives';

export type IRootProps = {
  env: t.IEnv;
  ctx: t.IFinderContext;
  style?: CssValue;
};

export class Root extends React.PureComponent<IRootProps> {
  private unmounted$ = new Subject<{}>();
  private Provider!: React.FunctionComponent;

  /**
   * [Lifecycle]
   */
  constructor(props: IRootProps) {
    super(props);
    this.Provider = ui.createProvider({ ctx: props.ctx });
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
      base: css({ Absolute: 0 }),
      titlebar: css({ Absolute: [0, 0, null, 0] }),
      shell: css({ Absolute: [WindowTitleBar.HEIGHT, 0, 0, 0] }),
    };

    const uri = this.props.ctx.env.def;

    return (
      <this.Provider>
        <div {...css(styles.base, this.props.style)}>
          <WindowTitleBar style={styles.titlebar} address={uri} />
          <TreeShell style={styles.shell} />
        </div>
      </this.Provider>
    );
  }
}