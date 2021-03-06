import { t } from '../common';
import { TreeIdentity } from '../TreeIdentity';
import { TreeQuery } from '../TreeQuery';

const query = TreeQuery.create;

type Node = t.INode;
type TreeNode = t.ITreeNode;
const id = TreeIdentity;

export const helpers = {
  id,

  /**
   * Determine if the given input is a [TreeState] instance.
   */
  isInstance(input: any): boolean {
    return input === null || typeof input !== 'object' ? false : input._kind === 'TreeState';
  },

  /**
   * Props helper.
   */
  props<P>(of: Node, fn?: (props: P) => void): P {
    of.props = of.props || {};
    if (typeof fn === 'function') {
      fn(of.props as P);
    }
    return of.props as P;
  },

  /**
   * Children helper.
   */
  children<T extends TreeNode>(of: T, fn?: (children: T[]) => void): T[] {
    const children = (of.children = of.children || []) as T[];
    if (typeof fn === 'function') {
      fn(children);
    }
    return of.children as T[];
  },

  /**
   * Ensures all nodes within the given tree are prefixed with
   * the specified namespace.
   */
  ensureNamespace(root: TreeNode, namespace: string) {
    query<TreeNode>(root).walkDown((e) => {
      if (!id.hasNamespace(e.node.id)) {
        e.node.id = id.format(namespace, e.node.id);
      } else {
        // Namespace prefix already exists.
        // Ensure it is within the given namespace, and if not skip adjusting any children.
        const res = id.parse(e.node.id);
        if (res.namespace !== namespace) {
          e.skip();
        }
      }
    });
  },
};
