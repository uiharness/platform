/**
 * Documentation:
 *  - https://docs.mapbox.com/mapbox-gl-js/overview
 *
 * API Explorer:
 *  - https://docs.mapbox.com/api-playground/#/?_k=dmxd1m
 *
 * Manage:
 *  - https://account.mapbox.com/access-tokens
 */
import '../../styles';

import * as React from 'react';
import { Subject } from 'rxjs';

import { css, CssValue, t } from '../../common';

const mapboxgl = require('mapbox-gl/dist/mapbox-gl.js'); // eslint-disable-line

const DEFAULT = {
  MAP_STYLE: 'mapbox://styles/mapbox/streets-v11',
};

export type IMapProps = {
  accessToken: string;
  center?: mapboxgl.LngLatLike;
  mapStyle?: mapboxgl.Style | string; // https://docs.mapbox.com/api/maps/#styles
  zoom?: number;
  style?: CssValue;
};

export class Map extends React.PureComponent<IMapProps> {
  private unmounted$ = new Subject<void>();

  private map: mapboxgl.Map;
  private el!: HTMLDivElement;
  private elRef = (ref: HTMLDivElement) => (this.el = ref);

  /**
   * [Lifecycle]
   */
  public componentDidMount() {
    const { mapStyle = DEFAULT.MAP_STYLE, accessToken, center, zoom = 0 } = this.props;
    mapboxgl.accessToken = accessToken;

    this.map = new mapboxgl.Map({
      container: this.el,
      style: mapStyle,
      center,
      zoom,
    });
  }

  public componentWillUnmount() {
    this.unmounted$.next();
    this.unmounted$.complete();
  }

  /**
   * [Properties]
   */
  public get mapStyle() {
    return this.map.getStyle();
  }

  public get zoom() {
    return this.map.getZoom();
  }
  public set zoom(value: number) {
    if (typeof value === 'number') {
      this.map.setZoom(value);
    }
  }

  public get center(): t.ILngLat {
    return this.map.getCenter();
  }
  public set center(value: t.ILngLat) {
    if (value && typeof value.lat === 'number' && typeof value.lng === 'number') {
      this.map.setCenter(value);
    }
  }

  /**
   * [Render]
   */
  public render() {
    return <div ref={this.elRef} {...css(this.props.style)} />;
  }
}
