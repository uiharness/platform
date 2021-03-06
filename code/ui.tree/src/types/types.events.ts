import { t } from './common';
import { MouseEvent, IKeypressEvent } from '@platform/react';

type N = t.ITreeviewNode;
export type TreeViewMouseTarget = 'NODE' | 'TWISTY' | 'DRILL_IN' | 'PARENT';

/**
 * Mouse Event
 */
export type TreeviewEvent =
  | ITreeviewMouseEvent
  | ITreeviewSelectEvent
  | ITreeviewFocusEvent
  | ITreeviewKeyboardEvent
  | TreeviewBeforeRenderEvent
  | TreeviewRenderEvent;

/**
 * Node selection request.
 * NOTE:
 *    This is used to signal to strategies that a navigation
 *    selection is required.
 */
export type ITreeviewSelectEvent = {
  type: 'TREEVIEW/select';
  payload: ITreeviewSelect;
};
export type ITreeviewSelect = {
  current?: string | null; //  NB: [null] to clear, [undefined] leaves current value.
  selected?: string | null; // NB: [null] to clear, [undefined] leaves current value.
};

/**
 * Mouse events fired as the pointer moves over
 * different parts of the tree.
 */
export type ITreeviewMouseEvent<T extends N = N> = {
  type: 'TREEVIEW/mouse';
  payload: t.ITreeviewMouse<T>;
};
export type ITreeviewMouse<T extends N = N> = TreeNodeMouseEventHandlerArgs<T> & {
  tag: string; // Component instance identifier.
  isHandled: boolean;
  handled(): void;
};

export type TreeNodeMouseEventHandler = (e: TreeNodeMouseEventHandlerArgs) => void;
export type TreeNodeMouseEventHandlerArgs<T extends N = N> = MouseEvent & {
  target: TreeViewMouseTarget;
  id: T['id'];
  node: T;
  props: t.ITreeviewNodeProps;
  children: T[];
};

/**
 * Focus
 */
export type ITreeviewFocusEvent = {
  type: 'TREEVIEW/focus';
  payload: ITreeviewFocus;
};
export type ITreeviewFocus = {
  isFocused: boolean;
  tag: string; // Component instance identifier.
};

/**
 * Keyboard
 */
export type ITreeviewKeyboardEvent<T extends N = N> = {
  type: 'TREEVIEW/keyboard';
  payload: ITreeviewKeyboard<T>;
};
export type ITreeviewKeyboard<T extends N = N> = {
  root?: T;
  current?: string;
  keypress: IKeypressEvent;
  tag: string; // Component instance identifier.
  isHandled: boolean;
  handled(): void;
};

/**
 * BEFORE Render
 *
 * Fired before a node is rendered allowing for final mutations
 * of the node to be made before drawing to screen.
 */
export type TreeviewBeforeRenderEvent =
  | ITreeviewBeforeRenderNodeEvent
  | ITreeviewBeforeRenderHeaderEvent;

export type ITreeviewBeforeRenderNodeEvent<T extends N = N> = {
  type: 'TREEVIEW/beforeRender/node';
  payload: ITreeviewBeforeRenderNode<T>;
};
export type ITreeviewBeforeRenderNode<T extends N = N> = t.ITreeviewBeforeRenderNodeProps<T> & {
  change(fn: (draft: t.ITreeviewNodeProps) => void): void;
};

export type ITreeviewBeforeRenderHeaderEvent<T extends N = N> = {
  type: 'TREEVIEW/beforeRender/header';
  payload: ITreeviewBeforeRenderHeader<T>;
};
export type ITreeviewBeforeRenderHeader<T extends N = N> = ITreeviewBeforeRenderNode<T>;

export type ITreeviewBeforeRenderNodeProps<T extends N = N> = {
  node: T;
  depth: number; // 0-based.
  isInline: boolean;
  isFocused: boolean;
};

/**
 * Render
 *
 * NB: This is a compliment to the 'render' factory functions
 *     passed into the <TreeView> component, providing a way for
 *     render requests to be fulfilled further afield than call-sites
 *     that can hand a factory to <TreeView>.
 *
 *     Following the "closest in the cascade wins" pattern, any explicit
 *     factory methods given to the <TreeView> will be used in preference
 *     to any event based factory/render requests.  Only if an explicitly
 *     passed factory does not yeild a result will the events be fired.
 */

export type TreeviewRenderEvent =
  | ITreeviewRenderIconEvent
  | ITreeviewRenderNodeBodyEvent
  | ITreeviewRenderPanelEvent
  | ITreeviewRenderHeaderEvent;

export type ITreeviewRenderIconEvent<T extends N = N> = {
  type: 'TREEVIEW/render/icon';
  payload: ITreeviewRenderIcon<T>;
};
export type ITreeviewRenderIcon<T extends N = N> = t.RenderTreeIconArgs<T> & {
  isHandled: boolean;
  render(el: t.RenderTreeIconResponse): void;
};

export type ITreeviewRenderNodeBodyEvent<T extends N = N> = {
  type: 'TREEVIEW/render/nodeBody';
  payload: ITreeviewRenderNodeBody<T>;
};
export type ITreeviewRenderNodeBody<T extends N = N> = t.RenderTreeNodeBodyArgs<T> & {
  isHandled: boolean;
  render(el: t.RenderTreeNodeBodyResponse): void;
};

export type ITreeviewRenderPanelEvent<T extends N = N> = {
  type: 'TREEVIEW/render/panel';
  payload: ITreeviewRenderPanel<T>;
};
export type ITreeviewRenderPanel<T extends N = N> = t.RenderTreePanelArgs<T> & {
  isHandled: boolean;
  render(el: t.RenderTreePanelResponse): void;
};

export type ITreeviewRenderHeaderEvent<T extends N = N> = {
  type: 'TREEVIEW/render/header';
  payload: ITreeviewRenderHeader<T>;
};
export type ITreeviewRenderHeader<T extends N = N> = t.RenderTreeHeaderArgs<T> & {
  isHandled: boolean;
  render(el: t.RenderTreeHeaderResponse): void;
};
