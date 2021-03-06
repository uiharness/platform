import { t } from './common';

type D = t.IDisposable;

/**
 * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html
 */
export type IMonacoStandaloneCodeEditor = {
  // Properties.
  getValue(options?: { lineEnding?: string; preserveBOM?: boolean }): string;
  setValue(newValue: string): void;

  getModel(): t.IMonacoTextModel;
  setModel(model: t.IMonacoTextModel | null): void;

  getPosition(): t.IMonacoPosition;
  setPosition(positon: t.IMonacoPosition): void;

  getSelection(): t.IMonacoSelection;
  setSelection(value: t.IMonacoSelection): void;

  getSelections(): t.IMonacoSelection[];
  setSelections(value: readonly t.IMonacoSelection[]): void;

  // Methods.
  focus(): void;
  executeCommand(source: string | null | undefined, command: t.IMonacoCommand): void;
  getAction(id: string): t.IMonacoEditorAction;
  trigger(source: string | null | undefined, handlerId: string, payload: any): void;

  // Events.
  onDidChangeModelContent(listener: (e: IMonacoModelContentChangedEvent) => void): D;
  onDidChangeCursorPosition(listener: (e: IMonacoCursorPositionChangedEvent) => void): D;
  onDidChangeCursorSelection(listener: (e: IMonacoCursorSelectionChangedEvent) => void): void;
  onDidBlurEditorText(listener: () => void): void;
  onDidBlurEditorWidget(listener: () => void): void;
  onDidFocusEditorText(listener: () => void): void;
  onDidFocusEditorWidget(listener: () => void): void;
};

/**
 * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.imodelcontentchangedevent.html
 */
export type IMonacoModelContentChangedEvent = {
  changes: IMonacoModelContentChange[];
  eol: string;
  isFlush: boolean;
  isRedoing: boolean;
  isUndoing: boolean;
  versionId: number;
};

export type IMonacoModelContentChange = {
  range: t.IMonacoRange;
  rangeLength: number;
  rangeOffset: number;
  text: string;
};

/**
 * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.icursorpositionchangedevent.html
 */
export type IMonacoCursorPositionChangedEvent = {
  position: t.IMonacoPosition;
  reason: t.IMonacoCursorChangeReason;
  secondaryPositions: t.IMonacoPosition[];
  source: string;
};

/**
 * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.icursorselectionchangedevent.html
 */
export type IMonacoCursorSelectionChangedEvent = {
  modelVersionId: number;
  oldModelVersionId: number;
  oldSelections: t.IMonacoSelection[];
  reason: t.IMonacoCursorChangeReason;
  secondarySelections: t.IMonacoSelection[];
  selection: t.IMonacoSelection;
  source: string;
};
