import { t, defaultValue } from '../common';
import { Builder } from '@platform/cell.module';

type O = Record<string, unknown>;
type M = t.ITreeviewNode;

/**
 * Builder tools for a TreeView.
 * Generics:
 *    <M> model
 *    <P> parent builder
 */
export const tree: t.ViewBuilderTree = {
  node<P extends O>(model: t.BuilderModel<any>, parent?: t.BuilderChain<any>) {
    type A = t.ViewBuilderTreeNode<P>;
    const handlers = treeHandlers<P>();
    return Builder.create<M, A>({ model, handlers, parent });
  },
};

/**
 * Builder handlers for manipulating a treeview node.
 */
export const treeHandlers = <P extends O>() => {
  const node: t.BuilderHandlers<M, t.ViewBuilderTreeNode<P>> = {
    parent: (args) => args.builder.parent,

    label(args) {
      const value = format.string(args.params[0], { trim: true });
      args.model.change((draft) => (treeview(draft).label = value));
    },

    icon(args) {
      const input = args.params[0];
      const value = typeof input === 'string' ? format.string(input, { trim: true }) : input;
      args.model.change((draft) => (treeview(draft).icon = value));
    },

    title(args) {
      const value = format.string(args.params[0], { trim: true });
      args.model.change((draft) => (treeview(draft).title = value));
    },

    description(args) {
      const value = format.string(args.params[0], { trim: true });
      args.model.change((draft) => (treeview(draft).description = value));
    },

    isEnabled(args) {
      const value = format.boolean(args.params[0]);
      args.model.change((draft) => (treeview(draft).isEnabled = value));
    },

    isVisible(args) {
      const value = format.boolean(args.params[0]);
      args.model.change((draft) => (treeview(draft).isVisible = value));
    },

    isBold(args) {
      const value = format.boolean(args.params[0]);
      args.model.change((draft) => (treeview(draft).isBold = value));
    },

    isSpinning(args) {
      const value = format.boolean(args.params[0]);
      args.model.change((draft) => (treeview(draft).isSpinning = value));
    },

    opacity(args) {
      const value = format.number(args.params[0], { default: 1, min: 0, max: 1 });
      args.model.change((draft) => (treeview(draft).opacity = value));
    },

    padding(args) {
      let input = args.params[0];
      if (Array.isArray(input)) {
        if (input.length === 2) {
          // Convert [vertical,horizontal] to [top, right, bottom left].
          input = [input[0], input[1], input[0], input[1]];
        }
        if (input.length > 4) {
          input = input.slice(0, 4);
        }
      }
      const value = !Array.isArray(input)
        ? format.number(input, { min: 0 })
        : input.map((input) => format.number(input, { min: 0 }));
      args.model.change((draft) => (treeview(draft).padding = value));
    },

    marginTop(args) {
      const value = format.number(args.params[0], { min: 0 });
      args.model.change((draft) => (treeview(draft).marginTop = value));
    },

    marginBottom(args) {
      const value = format.number(args.params[0], { min: 0 });
      args.model.change((draft) => (treeview(draft).marginBottom = value));
    },

    chevron: {
      kind: 'object',
      builder: (args) => args.create<M, t.ViewBuilderTreeNodeChevon<P>>(chevron),
    },
  };

  const chevron: t.BuilderHandlers<M, t.ViewBuilderTreeNodeChevon<P>> = {
    parent: (args) => args.builder.parent,

    isVisible(args) {
      args.model.change((draft) => {
        model(draft).chevron.isVisible = format.boolean(args.params[0]);
      });
    },
  };

  return node;
};

/**
 * [Helpers]
 */

const format = {
  string(input: any, options: { default?: string; trim?: boolean } = {}) {
    let value = typeof input === 'string' ? input : options.default;
    value = options.trim && typeof value === 'string' ? value.trim() : value;
    value = !value ? options.default : value;
    return value;
  },

  number(input: any, options: { min?: number; max?: number; default?: number } = {}) {
    let value = typeof input === 'number' ? input : defaultValue(options.default, undefined);
    if (typeof value === 'number') {
      value = options.min === undefined ? value : Math.max(options.min, value);
      value = options.max === undefined ? value : Math.min(options.max, value);
    }
    return value;
  },

  boolean(input: any, options: { default?: boolean } = {}) {
    const value = typeof input === 'boolean' ? input : defaultValue(options.default, undefined);
    return value;
  },
};

function treeview(state: M) {
  return model(state).treeview;
}

function model(state: M) {
  const res = {
    get props() {
      return state.props || (state.props = {});
    },
    get treeview() {
      const props = res.props;
      return props.treeview || (props.treeview = {});
    },
    get chevron() {
      const treeview = res.treeview;
      return treeview.chevron || (treeview.chevron = {});
    },
  };
  return res;
}
