import { color, css, CssValue } from '@platform/css';
import { Button } from '@platform/ui.button';
import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TreeView } from '../..';
import { t, COLORS } from '../../common';
import { TextInput } from '@platform/ui.text/lib/components/TextInput';
import { TextInputChangeEventHandler } from '@platform/ui.text/lib/types';
import { defaultValue } from '@platform/util.value';
import { Icons } from './Icons';

const S = TreeView.State;
const DEFAULT = {
  CONNECTOR_HEIGHT: 40,
};

export type ITestStateStoreProps = {
  store: t.ITreeViewState;
  isRoot?: boolean;
  connectorHeight?: number;
  style?: CssValue;
};
export type ITestStateStoreState = {
  addLabel?: string;
};

export class TestStateStore extends React.PureComponent<
  ITestStateStoreProps,
  ITestStateStoreState
> {
  public state: ITestStateStoreState = {};
  private state$ = new Subject<Partial<ITestStateStoreState>>();
  private unmounted$ = new Subject();

  /**
   * [Lifecycle]
   */

  public componentDidMount() {
    this.store.event.changed$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.forceUpdate());
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get store() {
    return this.props.store;
  }

  public get isRoot() {
    return this.props.isRoot !== false;
  }

  public get connectorHeight() {
    return defaultValue(this.props.connectorHeight, DEFAULT.CONNECTOR_HEIGHT);
  }

  /**
   * [Render]
   */
  public render() {
    const store = this.store;
    const styles = {
      base: css({
        position: 'relative',
        boxSizing: 'border-box',
        backgroundColor: color.format(-0.02),
        border: `solid 1px ${color.format(-0.04)}`,
        borderRadius: 4,
        padding: 10,
        paddingTop: 8,
        fontSize: 14,
        marginBottom: 10,
        ':last-child': { marginBottom: 0 },
      }),
      children: css({
        marginTop: this.connectorHeight - 1,
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        {this.renderConnector()}
        {this.renderTitle()}
        {this.renderTools()}
        {store.children.length > 0 && <div {...styles.children}>{this.renderChildren()}</div>}
      </div>
    );
  }

  private renderTitle() {
    const store = this.store;
    const styles = {
      base: css({
        Flex: 'horizontal-center-spaceBetween',
        borderBottom: `solid 8px ${color.format(-0.08)}`,
        paddingBottom: 8,
        marginBottom: 20,
        userSelect: 'none',
      }),
      left: css({
        Flex: 'horizontal-center-center',
      }),
      right: css({
        Flex: 'horizontal-center-center',
      }),
      id: css({
        fontFamily: 'menlo, monospace',
        fontSize: 10,
        color: COLORS.PURPLE,
        marginTop: 2,
        userSelect: 'text',
      }),
    };

    return (
      <div {...styles.base}>
        <div {...styles.left}>
          <Icons.Box size={24} style={{ marginRight: 6 }} color={COLORS.PURPLE} />
          <div>
            <strong>TreeState</strong>
            <div {...styles.id}>{store.id}</div>
          </div>
        </div>
        <div {...styles.right}>{!this.isRoot && this.renderCloseButton()}</div>
      </div>
    );
  }

  private renderCloseButton() {
    return (
      <Button onClick={this.onCloseClick}>
        <Icons.Close />
      </Button>
    );
  }

  private renderConnector(props: { style?: CssValue } = {}) {
    if (this.isRoot) {
      return null;
    }
    const height = this.connectorHeight;
    const styles = {
      base: css({
        Absolute: [-height, null, null, 17],
        width: 10,
        height: height - 1,
        backgroundColor: color.format(-0.08),
      }),
    };
    return <div {...css(styles.base, props.style)}></div>;
  }

  private renderTools() {
    const styles = {
      base: css({
        marginTop: 10,
        marginBottom: 10,
        Flex: 'horizontal-stretch-stretch',
      }),
      left: css({ flex: 1 }),
      middle: css({ width: 20 }),
      right: css({
        position: 'relative',
        flex: 1,
      }),
      downArrowOuter: css({
        Absolute: [null, 0, -15, 0],
        Flex: 'center-center',
        pointerEvents: 'none',
      }),
    };
    return (
      <div {...styles.base}>
        <div {...styles.left}>
          {this.renderTextInputButton({
            placeholder: 'label',
            value: this.store.root.props?.label,
            onChange: this.onLabelChange,
          })}
        </div>
        <div {...styles.middle}></div>
        <div {...styles.right}>
          {Boolean(this.state.addLabel) && (
            <div {...css(styles.downArrowOuter)}>
              <Icons.ArrowDown size={18} />
            </div>
          )}
          {this.renderTextInputButton({
            placeholder: 'new child',
            button: 'add',
            value: this.state.addLabel,
            onClick: this.addChild,
            onChange: this.onAddLabelChange,
          })}
        </div>
      </div>
    );
  }

  private renderTextInputButton(props: {
    placeholder?: string;
    value?: string;
    button?: string;
    onClick?: () => void;
    onChange?: TextInputChangeEventHandler;
  }) {
    const styles = {
      base: css({
        boxSizing: 'border-box',
        Flex: 'horizontal',
        borderBottom: `solid 1px ${color.format(-0.1)}`,
        paddingBottom: 2,
      }),
      input: css({ flex: 1 }),
      button: css({ marginLeft: 8 }),
    };

    const value = props.value || '';
    const isEnabled = value.trim().length > 0;

    return (
      <div {...styles.base}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={props.placeholder}
          placeholderStyle={{ color: color.format(-0.3), italic: true }}
          spellCheck={false}
          autoCorrect={false}
          autoCapitalize={false}
          autoComplete={false}
          autoSize={false}
          onEnter={isEnabled ? props.onClick : undefined}
          onChange={props.onChange}
        />
        {props.button && (
          <Button style={styles.button} onClick={props.onClick} isEnabled={isEnabled}>
            {props.button || 'Untitled'}
          </Button>
        )}
      </div>
    );
  }

  private renderChildren() {
    const connectorHeight = this.connectorHeight;
    const styles = {
      base: css({ marginLeft: 12 }),
      child: css({
        marginTop: connectorHeight - 1,
      }),
    };
    const elList = this.store.children.map((store) => {
      return (
        <div key={store.namespace} {...styles.child}>
          <TestStateStore store={store} isRoot={false} connectorHeight={connectorHeight} />
        </div>
      );
    });
    return <div {...styles.base}>{elList}</div>;
  }

  /**
   * [Handlers]
   */

  private addChild = () => {
    const label = this.state.addLabel;
    const root = { id: 'node', props: { label } };
    const child = this.store.add<t.ITreeViewNode>({ root });

    child.change((draft, ctx) => {
      // TreeViewState.props(draft, (p) => p.inline = {});
    });

    this.state$.next({ addLabel: '' });
  };

  private onAddLabelChange: TextInputChangeEventHandler = (e) => {
    this.state$.next({ addLabel: e.to });
  };

  private onLabelChange: TextInputChangeEventHandler = (e) => {
    this.store.change((draft) => {
      S.props(draft, (props) => (props.label = e.to));
    });
  };

  private onCloseClick = () => {
    this.store.dispose();
  };
}