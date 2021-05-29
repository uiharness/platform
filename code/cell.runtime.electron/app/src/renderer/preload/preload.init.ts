import { IpcTransport } from './preload.IpcTransport';
import { contextBridge } from 'electron';

import { IPC, PROCESS, ENV_KEY } from '../common/constants';

/**
 * The preload (sandbox) environment initialization.
 */
export function init() {
  const isDev = Boolean(findArgv(PROCESS.DEV));
  const self = findArgv(PROCESS.URI_SELF);
  const runtime = findArgv(PROCESS.RUNTIME);
  const channel = IPC.CHANNEL;

  /**
   * Setup the network pump.
   * (used by the NetworkBus in the loaded environment)
   */
  const ipc = IpcTransport({ self, channel });

  /**
   * Store the runtime environment.
   */
  const env = { self, runtime, ipc };
  contextBridge.exposeInMainWorld(ENV_KEY, env);

  /**
   * Print environment details.
   */
  if (isDev) {
    console.group('🌳 preload (sandbox)');
    console.log('isDev', isDev);
    process.argv
      .filter((value) => value.startsWith('env:'))
      .forEach((value) => console.log(`process.argv/${value}`));
    console.groupEnd();
    console.log('-------------------------------------------');
  }
}

/**
 * [Helpers]
 */

/**
 * Read out the window-definition passed through
 * the [process.argv] arguments.
 */
function findArgv(key: string) {
  const prefix = `${key}=`;
  const match = (process.argv || []).find((item) => item === key || item.startsWith(prefix));
  return (match || '').replace(new RegExp(`^${prefix}`), '').trim();
}
