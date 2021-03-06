import { Observable, IDisposable } from './common';
import * as t from '.';

export type MotionDraggableEvent =
  | MotionDraggableSizeReqEvent
  | MotionDraggableSizeResEvent
  | MotionDraggableStatusReqEvent
  | MotionDraggableStatusResEvent
  | MotionDraggableItemStatusReqEvent
  | MotionDraggableItemStatusResEvent
  | MotionDraggableItemChangeReqEvent
  | MotionDraggableItemChangeResEvent
  | MotionDraggableItemMoveEvent
  | MotionDraggableItemScaleEvent
  | MotionDraggableItemDragEvent
  | MotionDraggableItemMouseEvent;

/**
 * [Events] helper API.
 */
export type MotionDraggableEvents = IDisposable & {
  $: Observable<t.MotionDraggableEvent>;
  size: {
    req$: Observable<t.MotionDraggableSizeReq>;
    res$: Observable<t.MotionDraggableSizeRes>;
    get(): Promise<{ width: number; height: number }>;
  };
  status: {
    req$: Observable<t.MotionDraggableStatusReq>;
    res$: Observable<t.MotionDraggableStatusRes>;
    get(): Promise<t.MotionDraggableStatus>;
  };

  item: {
    move$: Observable<t.MotionDraggableItemMove>;
    scale$: Observable<t.MotionDraggableItemScale>;
    status: {
      req$: Observable<t.MotionDraggableItemStatusReq>;
      res$: Observable<t.MotionDraggableItemStatusRes>;
      get(id: string): Promise<t.MotionDraggableItemStatus | undefined>;
    };
    change: {
      req$: Observable<t.MotionDraggableItemChangeReq>;
      res$: Observable<t.MotionDraggableItemChangeRes>;
      start(args: {
        id: string;
        x?: number;
        y?: number;
        scale?: number;
        spring?: t.MotionSpring;
      }): Promise<{
        status: t.MotionDraggableItemStatus;
        target: { x?: number; y?: number; scale?: number };
        interrupted: boolean; // true if the user grabbed the moving item during the animation and positioned it elsewhere.
      }>;
    };
  };
};

/**
 * Events
 */

/**
 * Retrieve the current size of the container.
 */
export type MotionDraggableSizeReqEvent = {
  type: 'ui/MotionDraggable/size:req';
  payload: MotionDraggableSizeReq;
};
export type MotionDraggableSizeReq = { tx: string };

export type MotionDraggableSizeResEvent = {
  type: 'ui/MotionDraggable/size:res';
  payload: MotionDraggableSizeRes;
};
export type MotionDraggableSizeRes = { tx: string; width: number; height: number };

/**
 * Retieve the overall status.
 */
export type MotionDraggableStatusReqEvent = {
  type: 'ui/MotionDraggable/status:req';
  payload: MotionDraggableStatusReq;
};
export type MotionDraggableStatusReq = { tx: string };

export type MotionDraggableStatusResEvent = {
  type: 'ui/MotionDraggable/status:res';
  payload: MotionDraggableStatusRes;
};
export type MotionDraggableStatusRes = {
  tx: string;
  status: t.MotionDraggableStatus;
};

/**
 * Retieve the status of an individual item.
 */
export type MotionDraggableItemStatusReqEvent = {
  type: 'ui/MotionDraggable/item/status:req';
  payload: MotionDraggableItemStatusReq;
};
export type MotionDraggableItemStatusReq = { tx: string; id: string };

export type MotionDraggableItemStatusResEvent = {
  type: 'ui/MotionDraggable/item/status:res';
  payload: MotionDraggableItemStatusRes;
};
export type MotionDraggableItemStatusRes = {
  tx: string;
  status: t.MotionDraggableItemStatus;
};

/**
 * Cause one of more items to move.
 */
export type MotionDraggableItemChangeReqEvent = {
  type: 'ui/MotionDraggable/item/change:req';
  payload: MotionDraggableItemChangeReq;
};
export type MotionDraggableItemChangeReq = {
  tx: string;
  id: string;
  x?: number;
  y?: number;
  scale?: number;
  spring?: t.MotionSpring;
};

export type MotionDraggableItemChangeResEvent = {
  type: 'ui/MotionDraggable/item/change:res';
  payload: MotionDraggableItemChangeRes;
};
export type MotionDraggableItemChangeRes = {
  tx: string;
  id: string;
  status: t.MotionDraggableItemStatus;
  target: { x?: number; y?: number; scale?: number };
  interrupted: boolean; // true if the user grabbed the moving item during the animation and positioned it elsewhere.
};

/**
 * Fires when an item starts/stops moving.
 */
export type MotionDraggableItemMoveEvent = {
  type: 'ui/MotionDraggable/item/move';
  payload: MotionDraggableItemMove;
};
export type MotionDraggableItemMove = {
  id: string;
  lifecycle: 'start' | 'complete';
  via: 'code/req' | 'drag';
  status: t.MotionDraggableItemStatus;
};

/**
 * Fires when an item starts/stops moving.
 */
export type MotionDraggableItemScaleEvent = {
  type: 'ui/MotionDraggable/item/scale';
  payload: MotionDraggableItemScale;
};
export type MotionDraggableItemScale = {
  id: string;
  lifecycle: 'start' | 'complete';
  via: 'code/req' | 'wheel';
  status: t.MotionDraggableItemStatus;
};

/**
 * Fires when an item starts/stops being dragged.
 */
export type MotionDraggableItemDragEvent = {
  type: 'ui/MotionDraggable/item/drag';
  payload: MotionDraggableItemDrag;
};
export type MotionDraggableItemDrag = {
  id: string;
  lifecycle: 'start' | 'complete';
};

/**
 * Fires for item mouse events.
 */
export type MotionDraggableItemMouseEvent = {
  type: 'ui/MotionDraggable/item/mouse';
  payload: MotionDraggableItemMouse;
};
export type MotionDraggableItemMouse = {
  id: string;
  mouse: 'down' | 'up' | 'enter' | 'leave';
  button: number;
};
