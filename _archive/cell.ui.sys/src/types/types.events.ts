import { t } from './common';

/**
 * Events
 */
type GlobalEvent = t.IpcEvent | t.UiEvent | t.ModuleEvent;
export type AppEvent =
  | t.TypedSheetEvent
  | GlobalEvent
  | ISysChanged
  | ISysErrorEvent
  | ISysOverlayEvent;

/**
 * Changed
 */
export type ISysChanged = {
  type: 'APP:SYS/changed';
  payload: t.IStateChange<t.IAppState, t.AppEvent>;
};

/**
 * Views
 */

export type ISysOverlayEvent = {
  type: 'APP:SYS/overlay';
  payload: ISysOverlay;
};
export type ISysOverlay = {
  overlay?: t.IAppStateOverlay;
};

/**
 * Error
 */
export type ISysErrorEvent = {
  type: 'APP:SYS/error';
  payload: ISysError;
};
export type ISysError = {
  error: t.IErrorInfo;
  component?: t.IErrorComponent;
};
