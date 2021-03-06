import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';

import { css, CssValue, Icons, t, Treeview, util } from '../common';
import { PropEditor } from '../PropEditor';

const ROOT = 'ROOT';
const BODY = {
  PROD_EDITOR: 'PROP_EDITOR',
};

export type ChangedEventHandler = (e: t.IPropsChange) => void;

export type IPropsProps = {
  data?: t.PropsData;
  filter?: t.PropFilter;
  renderValue?: t.PropValueFactory;
  insertable?: boolean | t.PropDataObjectType | t.PropDataObjectType[];
  deletable?: boolean | t.PropDataObjectType | t.PropDataObjectType[];
  theme?: t.PropsTheme;
  style?: CssValue;
  events$?: Subject<t.PropsEvent>;
  onChange?: ChangedEventHandler;
};
export type IPropsState = {
  current?: string;
};

export class Props extends React.PureComponent<IPropsProps, IPropsState> {
  public state: IPropsState = { current: ROOT };
  private state$ = new Subject<Partial<IPropsState>>();
  private unmounted$ = new Subject<void>();
  private events$ = new Subject<t.PropsEvent>();
  private tree$ = new Subject<t.TreeviewEvent>();

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const tree$ = this.tree$.pipe(takeUntil(this.unmounted$));
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));

    // Update state.
    state$.subscribe((e) => this.setState(e));

    // Bubble events.
    if (this.props.events$) {
      this.events$.subscribe(this.props.events$);
    }

    /**
     * Bubble events.
     */
    events$
      .pipe(
        filter((e) => Boolean(this.props.onChange)),
        filter((e) => e.type === 'PROPS/changed'),
        map((e) => e.payload as t.IPropsChange),
      )
      .subscribe((e) => {
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      });

    /**
     * Mouse events on tree.
     */
    const treeMouse$ = tree$.pipe(
      filter((e) => e.type === 'TREEVIEW/mouse'),
      map((e) => e.payload as t.ITreeviewMouse),
    );
    const treeClick$ = treeMouse$.pipe(
      filter((e) => e.type === 'CLICK'),
      filter((e) => e.button === 'LEFT'),
    );
    const treeDblClick$ = treeMouse$.pipe(
      filter((e) => e.type === 'DOUBLE_CLICK'),
      filter((e) => e.button === 'LEFT'),
    );

    treeClick$.pipe(filter((e) => e.target === 'DRILL_IN')).subscribe((e) => {
      const current = e.node.id;
      this.state$.next({ current });
    });

    treeClick$.pipe(filter((e) => e.target === 'PARENT')).subscribe((e) => {
      const id = e.node.id;
      const current = id.substring(0, id.lastIndexOf('.'));
      this.state$.next({ current });
    });

    treeDblClick$
      .pipe(
        filter((e) => e.target === 'NODE'),
        filter((e) => Boolean(e.node && e.node.children && e.node.children.length > 0)),
        filter((e) =>
          ['object', 'array'].includes(
            util.toType(((e.node as t.IPropNode).props?.data as t.IPropNodeData).value),
          ),
        ),
      )
      .subscribe((e) => {
        const current = e.node.id;
        this.state$.next({ current });
      });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get theme() {
    const { theme = 'DARK' } = this.props;
    return theme;
  }

  public get insertableTypes(): t.PropDataObjectType[] {
    return util.toEditableTypes(this.props.insertable);
  }

  public get deletableTypes(): t.PropDataObjectType[] {
    return util.toEditableTypes(this.props.deletable);
  }

  private get root() {
    const { filter, data } = this.props;
    const root: t.IPropNode = {
      id: ROOT,
      props: {
        treeview: { header: { isVisible: false } },
        data: { path: ROOT, key: '', value: data, type: util.toType(data), action: 'CHANGE' },
      },
    };

    const body = BODY.PROD_EDITOR;
    return util.buildTree({
      root,
      parent: root,
      data,
      filter,
      insertable: this.insertableTypes,
      deletable: this.deletableTypes,
      formatNode: (node) => ({
        ...node,
        props: {
          ...node.props,
          treeview: { ...node.props?.treeview, body },
        },
      }),
    });
  }

  /**
   * [Render]
   */
  public render() {
    const theme = this.theme;
    const styles = {
      base: css({
        position: 'relative',
        display: 'flex',
      }),
    };
    return (
      <div {...css(styles.base, this.props.style)}>
        <Treeview
          root={this.root}
          current={this.state.current}
          background={'NONE'}
          theme={theme}
          renderIcon={this.iconFactory}
          renderNodeBody={this.nodeFactory}
          event$={this.tree$}
        />
      </div>
    );
  }

  private iconFactory: t.RenderTreeIcon = (e) => Icons[e.icon];

  private nodeFactory: t.RenderTreeNodeBody = (e) => {
    if (e.body === BODY.PROD_EDITOR) {
      const node = e.node as t.IPropNode;
      const parentNode = Treeview.query(this.root).parent(node) as t.IPropNode;
      const isDeletable = node.props?.data?.isDeletable || false;
      return (
        <PropEditor
          rootData={this.props.data}
          parentNode={parentNode}
          node={node}
          theme={this.theme}
          renderValue={this.props.renderValue}
          isDeletable={isDeletable}
          events$={this.events$}
        />
      );
    }
    return null;
  };
}
