import * as React from 'react';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { t, css, color, CssValue, value, gravatar } from '../../common';
import { Icons, IIcon } from '../Icons';

export type IAvatarProps = {
  src?: string; // URL or email (gravatar).
  size?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: number | string;
  backgroundColor?: number | string;
  block?: boolean;
  placeholderIcon?: IIcon;
  placeholderIconColor?: number | string;
  gravatarDefault?: gravatar.GravatarDefault;
  events$?: Subject<t.AvatarEvent>;
  style?: CssValue;

  onClick?: React.MouseEventHandler;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onMouseEnter?: React.MouseEventHandler;
  onMouseLeave?: React.MouseEventHandler;
};
export type IAvatarState = {
  isLoaded?: boolean | null;
  status?: t.AvatarLoadStatus;
};

/**
 * A picture of a user.
 */
export class Avatar extends React.PureComponent<IAvatarProps, IAvatarState> {
  /**
   * [Static]
   */
  public static isGravatar(src: string) {
    return value.isEmail(src);
  }

  /**
   * [Fields]
   */
  public state: IAvatarState = { isLoaded: false, status: 'LOADING' };
  private unmounted$ = new Subject<void>();
  private state$ = new Subject<Partial<IAvatarState>>();
  private events$ = new Subject<t.AvatarEvent>();

  /**
   * [Lifecycle]
   */
  constructor(props: IAvatarProps) {
    super(props);
  }

  public componentDidMount() {
    this.state$.pipe(takeUntil(this.unmounted$)).subscribe((e) => this.setState(e));
    const events$ = this.events$.pipe(takeUntil(this.unmounted$));

    if (this.props.events$) {
      events$.subscribe(this.props.events$);
    }
    this.fireLoad('LOADING');
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get src() {
    return this.props.src || '';
  }

  public get isPlaceholder() {
    return this.state.isLoaded === null;
  }

  /**
   * [Render]
   */
  public render() {
    const props = this.props;
    const { style, borderColor = 0.4, size = 36, borderRadius = 5, block = false } = props;

    const backgroundColor = props.backgroundColor
      ? props.backgroundColor
      : typeof borderColor === 'string'
      ? borderColor
      : color.format(borderColor);

    const styles = {
      base: css({
        position: 'relative',
        overflow: 'hidden',
        display: block ? 'block' : 'inline-block',
        width: size,
        height: size,
        backgroundColor: backgroundColor as string,
        borderRadius,
      }),
    };

    return (
      <div
        {...css(styles.base, style)}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
        onMouseUp={props.onMouseUp}
        onMouseEnter={props.onMouseEnter}
        onMouseLeave={props.onMouseLeave}
      >
        {this.renderImage()}
        {this.isPlaceholder && this.renderPlaceholder()}
      </div>
    );
  }

  private renderImage() {
    const { borderWidth = 0, size = 36, borderRadius = 5, gravatarDefault = '404' } = this.props;
    const width = size - borderWidth * 2;
    const isLoaded = this.state.isLoaded;
    const src = Avatar.isGravatar(this.src)
      ? gravatar.url(this.src, { size, default: gravatarDefault })
      : this.src;

    const styles = {
      base: css({
        overflow: 'hidden',
        Absolute: [borderWidth, null, null, borderWidth],
        width: width,
        height: width,
        borderRadius: borderRadius - borderWidth * 0.75,
        backgroundImage: `url(${src})`,
        backgroundSize: 'contain',
        display: isLoaded === false ? 'none' : 'block',
      }),
      hiddenImge: css({
        Absolute: [-500, null, null, -500],
        width: 1,
        height: 1,
        visibility: 'hidden',
      }),
    };
    return (
      <div {...styles.base}>
        <img
          {...styles.hiddenImge}
          src={src}
          onLoad={this.handleImageLoaded}
          onError={this.handleImageLoadError}
        />
      </div>
    );
  }

  private renderPlaceholder() {
    const styles = {
      base: css({
        Absolute: 0,
        Flex: 'center-center',
      }),
      icon: css({}),
    };
    const Icon = this.props.placeholderIcon || Icons.Face; // eslint-disable-line
    return (
      <div {...styles.base}>
        <Icon style={styles.icon} color={this.props.placeholderIconColor} />
      </div>
    );
  }

  private handleImageLoaded = () => {
    this.state$.next({ isLoaded: true });
    this.fireLoad('LOADED');
  };
  private handleImageLoadError = () => {
    const src = this.src;
    this.state$.next({ isLoaded: null });
    const status = src ? 'FAILED' : 'LOADED'; // NB: If there is no src URL then it wasn't a actual fail.
    this.fireLoad(status);
  };

  private fire(e: t.AvatarEvent) {
    this.events$.next(e);
  }
  private fireLoad(status: t.AvatarLoadStatus) {
    const src = this.src;
    let type: t.IAvatarLoadEvent['payload']['type'] | undefined;
    if (status === 'LOADED') {
      type = !src ? 'PLACEHOLDER' : 'IMAGE';
    }
    if (status === 'FAILED') {
      type = 'PLACEHOLDER';
    }
    this.state$.next({ status });
    const isLoaded = status === 'LOADED';
    this.fire({
      type: 'AVATAR/load',
      payload: value.deleteUndefined({ isLoaded, status, src, type }),
    });
  }
}
