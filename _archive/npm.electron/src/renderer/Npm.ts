import { Subject } from 'rxjs';
import { share } from 'rxjs/operators';

import { t } from './common';

export class Npm {
  /**
   * [Static]
   */
  public static create(args: { ipc: t.IpcClient }) {
    return new Npm(args);
  }

  /**
   * [Lifecycle]
   */
  private constructor(args: { ipc: t.IpcClient }) {
    this._.ipc = args.ipc;
  }

  public dispose() {
    this._.dispose$.next();
    this._.dispose$.complete();
  }

  /**
   * [Fields]
   */
  private readonly _ = {
    dispose$: new Subject(),
    ipc: (undefined as unknown) as t.NpmIpc,
  };
  public readonly dispose$ = this._.dispose$.pipe(share());

  /**
   * [Properties]
   */
  public get isDisposed() {
    return this._.dispose$.isStopped;
  }

  /**
   * [Methods]
   */

  public install(args: { name: string; version?: string }) {
    const { name, version } = args;
    this.send(
      {
        type: 'NPM/install',
        payload: { name, version },
      },
      { timeout: 50000 },
    );
  }

  private send(e: t.NpmMessage, options?: t.IpcClientSendOptions) {
    this._.ipc.send(e.type, e.payload, options);
  }
}
