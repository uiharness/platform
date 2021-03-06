import { Editors, GridSettings } from 'handsontable';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { filter, map, share, take, takeUntil } from 'rxjs/operators';

import { constants, R, t, time, coord } from '../../common';
import { Handsontable } from '../../common/libs.Handsontable';
import { IGridRefsPrivate } from '../../components/DataGrid/types.private';
import { createProvider } from './provider';

const editors = Handsontable.editors as Editors;
const { CSS } = constants;

/**
 * Extension hook for custom editor UI components.
 *
 * This abstracts any connection to Handsontable providing
 * a clean extensibility mechanism for injecting custom cell editor.s
 *
 * See:
 *  - https://handsontable.com/docs/6.2.2/frameworks-wrapper-for-react-custom-editor-example.html
 *  - https://forum.handsontable.com/t/full-custom-editor/2795
 *  - https://stackblitz.com/edit/angular-dirbuj?file=src/app/hello.component.ts
 *
 */
export class Editor extends editors.TextEditor {
  /**
   * [Lifecycle]
   */
  public prepare(
    row: number,
    column: number,
    prop: string | number,
    td: HTMLElement,
    originalValue: any,
    cellProperties: GridSettings,
  ) {
    super.prepare(row, column, prop, td, originalValue, cellProperties);
  }

  /**
   * [Fields]
   */
  private readonly _ = {
    current: undefined as t.IEditorContext | undefined,
  };

  /**
   * [Properties]
   */
  private get isDisposed() {
    return this.instance.isDestroyed || this.grid.isDisposed;
  }

  private get isEditing() {
    return Boolean(this._.current);
  }

  private get refs(): IGridRefsPrivate {
    return (this.instance as any).__gridRefs;
  }

  private get grid() {
    return this.refs.grid;
  }

  private get cell() {
    return this.grid.cell({ row: this.row, column: this.col });
  }

  private get context() {
    return this._.current;
  }

  /**
   * [Methods]
   */

  /**
   * [Override] Initial construction of elements.
   */
  public createElements() {
    if (this.isDisposed) {
      return;
    }

    super.createElements();
    /**
     * HACK:
     *    Hide the text-editor created in the base-class.
     *    There is a bunch of base-class behavior we want to inherit, so simply
     *    hiding their input and doing our own thing has us maintaining less
     *    code than if we fully implemented from `BaseEditor`.
     */
    this.textareaStyle.display = 'none';
  }

  /**
   * [Override] Called when the editor recieves focus.
   */
  public async focus() {
    // NOTE:  Suppress focus behavior in parent class.
    //        The base-class puts focus on the unused text-area <input>.
  }

  /**
   * [Override] Invoked at the commencement of an editing operation.
   */
  public beginEditing(initialValue?: string) {
    if (this.isDisposed) {
      return;
    }

    super.beginEditing(initialValue);
    if (this.isEditing) {
      return;
    }

    const grid = this.grid;
    const initial = initialValue === null ? this.cell.data.value : '';
    const context = this.createContext({ initial });
    const el = this.render(context);
    if (!el) {
      this.onCancel();
      return;
    }
    const row = this.row;
    const column = this.col;

    // Store state for the current edit operation.
    this._.current = context;

    // Listener for any cancel operations applied to the [GRID/change] event.
    this.grid.events$
      .pipe(
        takeUntil(context.end$),
        filter((e) => e.type === 'GRID/cells/change'),
        map((e) => e.payload as t.IGridCellsChange),
        filter((e) => e.isCancelled),
        filter((e) => e.changes.some(({ cell }) => cell.row === row && cell.column === column)),
      )
      .subscribe((e) => {
        isCancelled = true;
        this.onCancel();
      });

    // Alert listeners.
    let isCancelled = false;
    this.refs.editorEvents$.next({
      type: 'GRID/EDITOR/begin',
      payload: {
        get cell() {
          return grid.cell({ row, column });
        },
        cancel: () => (isCancelled = true),
      },
    });

    // Check if a listener cancelled the operation.
    if (isCancelled) {
      return this.onCancel();
    }

    // Render the editor from the injected factory.
    ReactDOM.render(el, this.TEXTAREA_PARENT);
  }

  /**
   * [Override] Invoked when editing is complete.
   */
  public finishEditing(restoreValue?: boolean, ctrlDown?: boolean, callback?: () => void) {
    if (this.isDisposed) {
      return;
    }
    super.finishEditing(restoreValue, ctrlDown, callback);
    const current = this._.current;
    if (!current) {
      return;
    }

    const grid = this.grid;
    const row = this.row;
    const column = this.col;
    const isCancelled = current.isCancelled ? true : Boolean(restoreValue);
    const from = current.value.from;
    const to = isCancelled ? from : this.getValue();
    const size = current.size;

    // Destroy the editor UI component.
    ReactDOM.unmountComponentAtNode(this.TEXTAREA_PARENT);

    // Update the row-height of the grid.
    if (size) {
      const key = coord.cell.toRowKey(this.row);
      const change: t.IGridData['rows'] = {
        [key]: { ...grid.data.rows[key], props: { grid: { height: size.height } } },
      };
      grid.changeRows(change, { source: 'UPDATE/cellEdited' }).redraw();
    }

    // Alert listeners.
    const value = { from, to };
    const isChanged = !R.equals(value.from, value.to);
    const payload: t.IEndEditingEvent['payload'] = {
      value,
      size,
      isCancelled,
      isChanged,
      get cell() {
        return grid.cell({ row, column });
      },
      cancel() {
        grid.changeCells({ [payload.cell.key]: from }, { silent: true });
        payload.isCancelled = true;
      },
    };
    const e: t.IEndEditingEvent = { type: 'GRID/EDITOR/end', payload };

    // Finish up.
    this._.current = undefined;
    this.refs.editorEvents$.next(e);
  }

  /**
   * [Override] Gets the value of the editor.
   */
  public getValue() {
    const context = this.context;
    return context ? context.value.to : undefined;
  }

  /**
   * [Internal]
   */

  private createContext(args: { initial?: t.CellValue }) {
    const grid = this.grid;
    const cell = this.cell;

    const cancel: t.IEditorContext['cancel'] = () => {
      context.isCancelled = true;
      this.onCancel();
      return context;
    };

    const complete: t.IEditorContext['complete'] = () => {
      this.onComplete();
      return context;
    };

    const end$ = this.refs.editorEvents$.pipe(
      filter((e) => e.type === 'GRID/EDITOR/end'),
      map((e) => e as t.IEndEditingEvent),
      take(1),
      share(),
    );

    const keys$ = grid.events$.pipe(
      takeUntil(end$),
      filter((e) => e.type === 'GRID/keydown'),
      map((e) => e.payload as t.IGridKeydown),
      share(),
    );

    keys$
      .pipe(
        filter((e) => context.autoCancel),
        filter((e) => e.isEscape),
      )
      .subscribe(cancel);

    const from = this.instance.getDataAtCell(this.row, this.col);
    const value = { from, to: from };

    const context: t.IEditorContext = {
      initial: args.initial,
      isCancelled: false,
      autoCancel: true,
      grid,
      cell,
      keys$,
      end$,
      value,
      complete,
      cancel,
      size: undefined,
      set(args: { value?: any; size?: t.ISize }) {
        if (args.value !== undefined) {
          value.to = args.value;
        }
        if (args.size !== undefined) {
          const { width, height } = args.size;
          (context as any).size = { width, height };
        }
        return context;
      },
    };

    return context;
  }

  private onCancel = () => {
    if (this.isDisposed) {
      return;
    }
    if (this._.current) {
      this._.current.isCancelled = true;
    }
    const restoreOriginalValue = true;
    this.cancelChanges();
    this.finishEditing(restoreOriginalValue);
    this.close();
  };

  private onComplete = () => {
    if (this.isDisposed) {
      return;
    }
    // NOTE:
    //    Run the close operation after a tick-delay
    //    to ensure that (if this call was initiated on a ENTER keydown event)
    //    that another handler does not immediately re-open the editor.
    time.delay(0, () => {
      const restoreOriginalValue = false;
      this.finishEditing(restoreOriginalValue);
      this.close();
    });
  };

  /**
   * Renders the popup-editor within a <Provider> context.
   */
  private render(context: t.IEditorContext) {
    const { row, column } = context.cell;
    const { value, props } = context.cell.data;
    const cell: t.IGridCellData = { value, props };
    const el = this.refs.factory.editor({ row, column, cell });
    if (!el) {
      return null;
    }

    const Provider = createProvider(context);
    const className = CSS.CLASS.GRID.EDITOR;

    return (
      <Provider>
        <div className={className}>{el}</div>
      </Provider>
    );
  }
}
