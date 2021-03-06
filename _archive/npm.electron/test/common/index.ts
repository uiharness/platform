import '../../node_modules/@platform/css/reset.css';
import '@platform/polyfill';

import * as t from '../types';

export * from '@platform/cli.spec';
export { Npm } from '../../src/renderer';
export { renderer } from '@platform/electron/lib/renderer';
export { ObjectView, Button, Hr, CommandShell } from '@uiharness/ui';
export { css, color, CssValue } from '@platform/react';

export { t };

export const COLORS = {
  DARK: '#293042', // Inky blue/black.
};
