import { CssValue } from '@platform/css';
import { Subject } from 'rxjs';

export type ImageResolution = 'x1' | 'x2';
export type ImageLoadStatus = 'LOADING' | 'LOADED' | 'FAILED';

export type ImageLoadedEventHandler = (e: IImageLoad) => void;

export type IImageProps = {
  style?: CssValue;
  opacity?: number;
  scale?: number;
  origin?: string;
  fadeIn?: number; // msecs.
  onLoaded?: ImageLoadedEventHandler;
  events$?: Subject<ImageEvent>;

  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};

export type ImageSrc = {
  x1: string;
  x2: string;
  width: number;
  height: number;
};

/**
 * [Events]
 */
export type ImageEvent = IImageLoadEvent;

export type IImageLoadEvent = {
  type: 'IMAGE/load';
  payload: IImageLoad;
};
export type IImageLoad = {
  ok: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  elapsed: number;
  x1: ImageLoadStatus;
  x2: ImageLoadStatus;
  src: ImageSrc;
};
