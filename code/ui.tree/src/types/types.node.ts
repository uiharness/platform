import { t } from './common';

type O = Record<string, unknown>;

/**
 * An identifiable "node" object.
 */
export type INode = { id: string };
export type NodeIdentifier<T extends INode = INode> = T | T['id'];

/**
 * An "node" with [props] and [children]
 */
export type ITreeNode<T extends string = string, P extends O = O> = INode & {
  children?: ITreeNode<T>[];
  props?: P;
};

/**
 * A single node within a <TreeView>
 * (which is itself the root of a further branching tree).
 */
export type ITreeViewNode<T extends string = string, D extends O = any> = ITreeNode<
  T,
  t.ITreeNodeProps
> & {
  children?: ITreeViewNode<T, D>[];
  data?: D; // Data attached to the node (NB: not used by the <TreeView> itself).
};
