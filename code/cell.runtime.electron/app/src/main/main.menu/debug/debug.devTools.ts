import { app, MenuItemConstructorOptions as M, shell } from 'electron';
import { t, fs, log } from '../../common';

/**
 * Menu for developer tools.
 */
export function devToolsMenu(args: {
  bus: t.ElectronMainBus;
  paths: t.ElectronDataPaths;
  port: number;
}): M {
  const { paths } = args;

  const item: M = {
    label: 'Tools',
    submenu: [{ role: 'reload' }, { role: 'forceReload' }, { role: 'toggleDevTools' }],
  };

  return item;
}
