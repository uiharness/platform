import { Grid, Cell } from '../../api';
import * as t from '../../types';

/**
 * Properties that are passed to React editor
 * components as `context`.
 */
export type IEditorContext = {
  autoCancel: boolean; // Automatically cancels on Escape key.
  cell: Cell;
  grid: Grid;
  keys$: t.Observable<t.IGridKeypress>;
  end$: t.Observable<IEndEditingEvent>;
  cancel(): void;
  complete(args: { value: any }): void;
};

/**
 * [Events]
 */
export type EditorEvent = IBeginEditingEvent | IEndEditingEvent;

export type IBeginEditingEvent = {
  type: 'GRID/EDITOR/begin';
  payload: {
    cell: Cell;
    cancel(): void;
  };
};

export type IEndEditingEvent = {
  type: 'GRID/EDITOR/end';
  payload: {
    cell: Cell;
    isCancelled: boolean;
    value: { from?: t.CellValue; to?: t.CellValue };
  };
};
