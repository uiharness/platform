export * from '../common/types';

export type DevModalTarget = 'fullscreen' | 'body';

/**
 * EVENTS
 */
export type DevEvent = DevModalEvent | DevMediaModalEvent;

/**
 * A modal to display.
 */
export type DevModalEvent = {
  type: 'DEV/modal';
  payload: DevModal;
};
export type DevModal = {
  el?: JSX.Element;
  target?: DevModalTarget;
};

/**
 * Tragets a MediaStream into a fullscreen modal
 */
export type DevMediaModalEvent = {
  type: 'DEV/media/modal';
  payload: DevMediaModal;
};
export type DevMediaModal = {
  stream?: MediaStream;
  target?: DevModalTarget;
};