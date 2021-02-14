import { equals, clone, clamp, uniq } from 'ramda';
export const R = { equals, clone, clamp, uniq };

import { css, color, CssValue, style } from '@platform/css';
export { css, color, CssValue, style };
export const formatColor = color.format;

import { id } from '@platform/util.value';
export { rx, time, defaultValue, dispose, is } from '@platform/util.value';
export const slug = id.shortid;

import { StateObject } from '@platform/state';
export { StateObject };
export const toObject = StateObject.toObject;

export { Markdown } from '@platform/util.markdown';

export { HttpClient, Uri } from '@platform/cell.client';
import { Builder } from '@platform/cell.module';
export { Builder };
export const format = Builder.format;