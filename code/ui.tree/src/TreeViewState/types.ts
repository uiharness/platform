import * as t from '../common/types';

type Node = t.ITreeNode;

/**
 * A version of the [TreeState] configured for the base <TreeView> node type.
 */
export type TreeViewState = {
  create<N extends Node = Node>(args: t.ITreeStateArgs<N>): t.ITreeState<N>;

  /**
   * Common [TreeState] helpers.
   */
  id: t.TreeState['id'];
  isInstance: t.TreeState['isInstance'];
  children: t.TreeState['children'];

  /**
   * <TreeView> specific helpers.
   */
  props(of: Node, fn?: (props: t.ITreeNodeProps) => void): t.ITreeNodeProps;
};
