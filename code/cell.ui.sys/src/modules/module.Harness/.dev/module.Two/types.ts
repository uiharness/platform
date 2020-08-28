import { t } from '../../common';
export * from '../../../../common/types';

export type TwoView = 'DEFAULT' | '404';
export type TwoTarget = 'ROOT' | 'PANEL';
export type TwoData = { foo?: string | number };
export type TwoProps = t.IViewModuleProps<TwoData, TwoView, TwoTarget>;
export type TwoModule = t.IModule<TwoProps>;

export type TwoModuleDef = {
  init(bus: t.EventBus, parent?: string): TwoModule;
};