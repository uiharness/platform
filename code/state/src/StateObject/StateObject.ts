import { slug } from '@platform/util.value';
import { isDraft, original, setAutoFreeze } from 'immer';
import { Subject } from 'rxjs';

import { is, t } from '../common';
import { Patch } from '../Patch';
import * as combine from './StateObject.combine';
import * as events from './StateObject.events';

if (typeof setAutoFreeze === 'function') {
  setAutoFreeze(false);
}

type O = Record<string, unknown>;

/**
 * A lightweight carrier of an immutable object which reports changes
 * via an observable.
 *
 * To change the state use the `change` method on the [IStateObjectWritable]
 * interface of the object.
 *
 * To pass an read-only version of the [StateObject] around an application
 * use the plain [IStateObject] interface which does not expose the `change` method.
 */
export class StateObject<T extends O> implements t.IStateObjectWritable<T> {
  /**
   * Create a new [StateObject] instance.
   */
  public static create<T extends O>(initial: T): t.IStateObjectWritable<T> {
    return new StateObject<T>({ initial });
  }

  /**
   * Convert a writeable [StateObject] to a read-only version.

   * NOTE:
   *    This is useful when wishing to be principled and constrain
   *    updates to the object to centralised behavioral logic 
   *    (analagous to "reducers" say) and not propogate update
   *    logic around an application.
   * 
   */
  public static readonly<T extends O>(obj: t.IStateObjectWritable<T>): t.IStateObject<T> {
    return obj as t.IStateObject<T>;
  }

  /**
   * Combine multiple state-objects together on a single {parent} object
   * to produce a single synchronized object.
   */
  public static combine = combine.create(StateObject.create);

  /**
   * Convert a draft (proxied instance) object into a simple object.
   *
   * See: https://immerjs.github.io/immer/docs/original
   */
  public static toObject<T extends O>(input: T) {
    return isDraft(input) ? (original(input) as T) : input;
  }

  /**
   * Determine if the given value is a [StateObject].
   */
  public static isStateObject(input: any) {
    return is.stateObject(input);
  }

  /**
   * Determines if the given value is a proxy (draft) object.
   */
  public static isProxy(input: any) {
    return isDraft(input);
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: { initial: T }) {
    this._state = { ...args.initial };
    this.original = this.state;
  }

  public dispose() {
    if (!this.isDisposed) {
      this.fire({
        type: 'StateObject/disposed',
        payload: { original: this.original, final: this.state },
      });
      this._dispose$.next();
      this._dispose$.complete();
    }
  }

  /**
   * [Fields]
   */
  private _state: T;

  private _dispose$ = new Subject<void>();
  public readonly dispose$ = this._dispose$.asObservable();

  private readonly _event$ = new Subject<t.StateObjectEvent>();
  public readonly event = events.create<T>(this._event$, this._dispose$);

  public readonly original: T;

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._dispose$.isStopped;
  }

  public get state() {
    return this._state;
  }

  public get readonly() {
    return this as t.IStateObject<T>;
  }

  /**
   * [Methods]
   */
  public change: t.StateObjectChange<T> = (fn) => {
    const cid = slug(); // "change-id"
    const from = this.state;
    const res = Patch.change(from, fn);

    const { patches, op } = res;
    const to = res.to as T;

    if (Patch.isEmpty(patches)) {
      return { op, cid, patches };
    } else {
      return this._changeComplete({ cid, from, to, op, patches });
    }
  };

  public changeAsync: t.StateObjectChangeAsync<T> = async (fn) => {
    const cid = slug(); // "change-id"
    const from = this.state;
    const next = await Patch.changeAsync(from, fn);
    if (Patch.isEmpty(next.patches)) {
      return { op: next.op, cid, patches: next.patches };
    } else {
      return this._changeComplete({
        cid,
        from,
        to: next.to as T,
        op: next.op,
        patches: next.patches,
      });
    }
  };

  private _changeComplete(args: {
    cid: string;
    from: T;
    to: T;
    op: t.StateChangeOperation;
    patches: t.PatchSet;
  }) {
    const { cid, op, patches, from, to } = args;

    // Fire BEFORE event.
    const changing: t.IStateObjectChanging<T> = {
      op,
      cid,
      from,
      to,
      patches,
      cancelled: false,
      cancel: () => (changing.cancelled = true),
    };

    this.fire({ type: 'StateObject/changing', payload: changing });

    // Update state and alert listeners.
    const cancelled = changing.cancelled ? changing : undefined;
    if (cancelled) {
      this.fire({ type: 'StateObject/cancelled', payload: cancelled });
    }

    const changed: t.IStateObjectChanged<T> | undefined = cancelled
      ? undefined
      : { op, cid, from, to, patches };

    if (changed) {
      this._state = to as T;
      this.fire({ type: 'StateObject/changed', payload: changed });
    }

    // Finish up.
    return { op, cid, changed, cancelled, patches };
  }

  /**
   * [Internal]
   */
  private fire = (e: t.StateObjectEvent) => this._event$.next(e);
}
