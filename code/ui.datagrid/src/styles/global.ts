import './global.cell';
import './global.grid';
import './global.headers';

import { style } from '../common';

/**
 * Ensure required CSS style sheets are in the <head>.
 */
const ROBOTO_URL =
  'https://fonts.googleapis.com/css?family=Roboto:100,100i,300,300i,400,400i,900,900i';
style.head.importStylesheet(ROBOTO_URL);
