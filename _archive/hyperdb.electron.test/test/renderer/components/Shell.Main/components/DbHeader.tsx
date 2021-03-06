import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { color, COLORS, css, CssValue, IMAGES, t, constants } from '../../../common';
import { TextInput, TextInputChangeEvent } from '../../primitives';

const { MONOSPACE } = constants.FONT;

export type IDbHeaderProps = {
  db: t.ITestRendererDb;
  style?: CssValue;
};
export type IDbHeaderState = {
  name?: string;
};

export class DbHeader extends React.PureComponent<IDbHeaderProps, IDbHeaderState> {
  public state: IDbHeaderState = {};
  private unmounted$ = new Subject();
  private state$ = new Subject<IDbHeaderState>();

  /**
   * [Lifecycle]
   */
  constructor(props: IDbHeaderProps) {
    super(props);
    const { db } = this.props;
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.setState(e));
    db.watch$.pipe(takeUntil(this.unmounted$)).subscribe(e => this.updateState());
    db.watch<t.ITestDbData>('.sys/dbname');
    this.updateState();
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  public get isPrimary() {
    const { db } = this.props;
    return db.key === db.localKey;
  }

  /**
   * [Methods]
   */
  public async updateState() {
    const { db } = this.props;
    const name = (await db.get('.sys/dbname')).value;
    this.state$.next({ name });
  }

  /**
   * [Render]
   */
  public render() {
    const { db } = this.props;
    const isPrimary = this.isPrimary;

    const styles = {
      base: css({
        boxSizing: 'border-box',
        Flex: 'horizontal-start-center',
      }),
      iconOuter: css({
        position: 'relative',
        marginRight: 10,
      }),
      icon: css({
        position: 'relative',
        Image: [IMAGES.DB, IMAGES.DB2x, 38, 38],
      }),
      typeBadge: css({
        Absolute: [null, 0, -18, 0],
        backgroundColor: color.format(-0.1),
        color: color.format(-0.4),
        border: `solid 1px ${color.format(-0.06)}`,
        borderRadius: 2,
        padding: 2,
        paddingBottom: 1,
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
        userSelect: 'none',
      }),
      body: css({
        flex: 1,
        borderBottom: `solid 8px ${color.format(-0.08)}`,
        paddingBottom: 6,
      }),
      textbox: css({
        // borderBottom: `solid 1px ${color.format(-0.1)}`,
      }),
    };
    const elPublicKey = this.renderKey({
      key: db.key,
      suffix: 'public-key',
      color: isPrimary ? COLORS.CLI.PURPLE : COLORS.CLI.CYAN,
    });
    const elPrivateKey = this.renderKey({ key: db.localKey, suffix: 'local-key' });
    return (
      <div {...css(styles.base, this.props.style)}>
        <div {...styles.iconOuter}>
          <div {...styles.icon} />
          <div {...styles.typeBadge}>{isPrimary ? 'PRIMARY' : 'PEER'}</div>
        </div>
        <div {...styles.body}>
          <TextInput
            style={styles.textbox}
            onChange={this.handleNameChange}
            value={this.state.name}
            valueStyle={{ fontSize: 22, color: color.format(-0.7) }}
            placeholder={'Unnamed'}
            placeholderStyle={{ color: color.format(-0.2) }}
          />
          {elPublicKey}
          {elPrivateKey}
        </div>
      </div>
    );
  }

  private renderKey(props: { key: string; suffix?: string; color?: string }) {
    const styles = {
      base: css({
        fontFamily: MONOSPACE.FAMILY,
        fontSize: 11,
        fontWeight: 'bold',
        color: color.format(-0.2),
        marginTop: 3,
        userSelect: 'none',
      }),
      key: css({
        color: props.color,
        userSelect: 'text',
      }),
    };
    const elKey = <span {...styles.key}>{props.key}</span>;
    const elSuffix = props.suffix && <span>({props.suffix})</span>;
    return (
      <div {...styles.base}>
        {elKey} {elSuffix}
      </div>
    );
  }

  /**
   * [Handlers]
   */

  private handleNameChange = async (e: TextInputChangeEvent) => {
    const { db } = this.props;
    await db.put('.sys/dbname', e.to);
  };
}
