import * as React from 'react';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { color, css, datagrid, MeasureSize, ObjectView, t, time, CssValue } from '../common';

const PADDING = 10;

export type IDebugEditorProps = { style?: CssValue };
export type IDebugEditorState = {
  value?: t.CellValue;
  width?: number;
  textWidth?: number;
};

export class DebugEditor extends React.PureComponent<IDebugEditorProps, IDebugEditorState> {
  public state: IDebugEditorState = {};
  private unmounted$ = new Subject<void>();
  private state$ = new Subject<Partial<IDebugEditorState>>();

  public static contextType = datagrid.EditorContext;
  public context!: datagrid.ReactEditorContext;

  private input!: HTMLInputElement;
  private inputRef = (ref: HTMLInputElement) => (this.input = ref);

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    let isMounted = false;
    const state$ = this.state$.pipe(takeUntil(this.unmounted$));
    state$.subscribe((e) => this.setState(e));

    // Update <input> on keypress.
    const keys$ = this.context.keys$;
    keys$
      .pipe(
        filter(() => isMounted),
        filter((e) => e.isEnter),
        filter((e) => e.metaKey),
      )
      .subscribe((e) => {
        this.context.complete();
      });

    // Keep the editor context up-to-date with the latest value.
    state$.subscribe((e) => {
      this.context.set({ value: this.value });
    });

    // Set initial values.
    const value = this.context.cell.data.value;
    this.state$.next({ value });

    // Manage cancelling manually.
    // this.context.autoCancel = false;
    // keys$.pipe(filter(e => e.isEscape)).subscribe(e => this.context.cancel());

    // Delay mounted flag to ensure the ENTER key that may have been used to
    // initiate the editor does not immediately close the editor.
    time.delay(100, () => (isMounted = true));

    // Finish up.
    this.input.focus();
    this.input.select();
    this.updateSize();
  }

  public componentWillUnmount() {
    this.unmounted$.next();
  }

  /**
   * [Properties]
   */
  public get value() {
    return (this.state.value || '').toString();
  }

  /**
   * [Methods]
   */
  public updateSize() {
    const content = <div {...STYLES.inputText}>{this.state.value}</div>;
    const textSize = MeasureSize.measure({ content, style: STYLES.input });
    const textWidth = textSize.width;

    const cell = this.context.cell;
    const rightCell = cell.siblings.right;
    const width = cell.width + (rightCell ? rightCell.width : 0) - PADDING * 2 - 10;

    this.state$.next({ textWidth, width });
  }

  /**
   * [Render]
   */
  public render() {
    const styles = {
      base: css({
        boxSizing: 'border-box',
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
        padding: PADDING,
        borderRadius: 4,
        border: `solid 1px ${color.format(-0.1)}`,
        width: this.state.width,
        Flex: 'vertical-stetch-stretch',
      }),
      input: css({
        outline: 'none',
        marginBottom: 4,
      }),
    };

    const data = {
      textWidth: this.state.textWidth,
      context: this.context,
    };

    return (
      <div {...css(styles.base, this.props.style)}>
        <input
          {...css(STYLES.inputText, styles.input)}
          ref={this.inputRef}
          value={this.value}
          onChange={this.handleChange}
        />
        <ObjectView name={'editor'} data={data} fontSize={9} />
      </div>
    );
  }

  /**
   * [Handlers]
   */
  private handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    this.state$.next({ value });
    time.delay(0, () => this.updateSize());
  };
}

/**
 * [Internal]
 */
const STYLES = {
  inputText: css({
    fontSize: 14,
  }),
  input: css({
    boxSizing: 'border-box',
    outline: 'none',
    marginBottom: 4,
  }),
};
