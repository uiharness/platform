import { slug, t, rx, time, Translate } from '../common';
import { Listeners } from './CodeEditor.Instance.listeners';
import { CodeEditorEvents } from '../api.CodeEditor';
import { Monaco } from '../api.Monaco';
import { ChangeHandlers } from './CodeEditor.Instance.handlers';

/**
 * API helpers for manipulating an [IMonacoStandaloneCodeEditor] instance.
 *
 * Refs:
 *    https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandalonecodeeditor.html
 *
 */
export const CodeEditorInstance = {
  /**
   * Create a new editor instance API.
   */
  create(args: {
    bus: t.CodeEditorEventBus;
    singleton: t.IMonacoSingleton;
    instance: t.IMonacoStandaloneCodeEditor;
    id?: string;
    filename?: string;
  }): t.CodeEditorInstance {
    const { instance, singleton, bus } = args;
    const id = args.id || `editor-${slug()}`;
    const listeners = Listeners({ bus, instance, id });
    const events = CodeEditorEvents.create(bus, { instance: id });

    // TEMP 🐷

    const filename = args.filename ? args.filename?.replace(/^\/*/, '') : 'default.ts';
    const uri = singleton.monaco.Uri.parse(`file:///${args.filename?.replace(/^\/*/, '')}`);
    // console.log('uri.toString()', uri.toString());

    let code = `// ${args.filename}\nconst a:number[] = [1,2,3]\n`;
    code += `import {add} from 'math';\nconst x = add(3, 5);\n`;
    code += `const total = a.reduce((acc, next) =>acc + next, 0);\n`;

    // TEMP 🐷
    if (filename === 'one.ts') {
      // console.group('🌳 one.ts');

      const def = 'export declare function add(a: number, b: number): number';
      singleton.libs.add('node_modules/@types/math/index.d.ts', def);

      // console.groupEnd();
    }

    const model = singleton.monaco.editor.createModel(code, 'typescript', uri);
    instance.setModel(model);

    const editor: t.CodeEditorInstance = {
      id,
      instance,
      events,

      /**
       * Assign focus to the editor.
       */
      focus() {
        instance.focus();
      },

      /**
       * Get/set the value of the code editor.
       */
      get text() {
        return instance.getValue();
      },
      set text(value: string) {
        instance.setValue(value);
      },

      /**
       * Get the current selection state.
       */
      get selection() {
        return Monaco.selection(instance);
      },

      /**
       * Select
       */
      select(input: t.CodeEditorSelection) {
        const selections = [input.primary, ...input.secondary]
          .filter(Boolean)
          .map((s) => Translate.range.toMonaco(s).selection);

        if (selections.length === 1) {
          instance.setSelection(selections[0]);
        }
        if (selections.length > 1) {
          const positionColumn = selections[0].positionColumn;
          const positionLineNumber = selections[0].positionLineNumber;
          instance.setSelections(
            selections.map((item) => ({
              ...item,
              positionLineNumber,
              positionColumn,
              selectionStartColumn: item.startColumn,
              selectionStartLineNumber: item.startLineNumber,
            })),
          );
        }
      },

      /**
       * Clean up.
       */
      dispose() {
        listeners.dispose();
        events.dispose();
      },
    };

    ChangeHandlers({ editor, events });
    return editor;
  },
};