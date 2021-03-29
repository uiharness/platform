import { CssValue } from '@platform/css';

export * from './components/TextInput/types';

export type TextStyle = {
  color?: number | string;
  fontSize?: number;
  fontWeight?: 'LIGHT' | 'NORMAL' | 'BOLD';
  fontFamily?: string;
  align?: 'LEFT' | 'CENTER' | 'RIGHT';
  italic?: boolean;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  opacity?: number;
  textShadow?: string | Array<number | string>; // [0:offset-y, 1:color.format()]
  uppercase?: boolean;
};

export type TextProps = TextStyle & {
  className?: string;
  children?: React.ReactNode;
  block?: boolean;
  tooltip?: string;
  cursor?: string;
  isSelectable?: boolean;
  style?: CssValue;
  onClick?: React.MouseEventHandler;
  onDoubleClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};
