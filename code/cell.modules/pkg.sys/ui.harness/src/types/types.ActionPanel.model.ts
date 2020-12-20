import { t } from './common';

export type ActionModelState<Ctx> = t.BuilderModel<t.ActionModel<Ctx>>;
export type ActionModel<Ctx> = {
  items: ActionItem[];
  getContext?: ActionGetContext<Ctx>;
  ctx?: Ctx;
};

export type ActionHandler<T> = (ctx: T) => void;

/**
 * Context
 */
export type ActionGetContext<T> = (prev: T | null) => T;

/**
 * Item types.
 */
export type ActionItem = ActionItemGroup | ActionItemInput;
export type ActionItemInput = ActionItemButton;

export type ActionItemGroup = {
  type: 'group';
  name: string;
  items: ActionItemInput[];
};

export type ActionItemButton = {
  type: 'button';
  label: string;
  description?: string;
  onClick?: ActionHandler<any>;
};