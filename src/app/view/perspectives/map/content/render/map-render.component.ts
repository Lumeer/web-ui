/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Platform} from '@angular/cdk/platform';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Point} from 'geojson';
import {
  GeoJSONSource,
  GeolocateControl,
  Map,
  MapboxEvent,
  MapLayerMouseEvent,
  Marker,
  NavigationControl,
  ScaleControl,
} from 'mapbox-gl';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import {DeviceDetectorService, OS} from 'ngx-device-detector';
import {BehaviorSubject, Subscription} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {environment} from '../../../../../../environments/environment';
import {
  MapConfig,
  MapCoordinates,
  MapMarkerProperties,
  MapModel,
  MapPosition,
} from '../../../../../core/store/maps/map.model';
import {
  createMapboxMap,
  createMapClusterCountsLayer,
  createMapClusterMarkersSource,
  createMapClustersLayer,
  createMapMarker,
  createMapMarkersBounds,
} from './map-render.utils';
import {MarkerMoveEvent} from './marker-move.event';

mapboxgl.accessToken = environment.mapboxKey;
window['mapboxgl'] = mapboxgl; // openmaptiles-language.js needs this

const MAP_SOURCE_ID = 'records';

const MAP_CLUSTER_CIRCLE_LAYER = 'cluster-circles';
const MAP_CLUSTER_SYMBOL_LAYER = 'cluster-symbols';

@Component({
  selector: 'map-render',
  templateUrl: './map-render.component.html',
  styleUrls: ['./map-render.component.scss', '../../../../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapRenderComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public map: MapModel;

  @Input()
  public markers: MapMarkerProperties[];

  @Output()
  public markerMove = new EventEmitter<MarkerMoveEvent>();

  @Output()
  public mapMove = new EventEmitter<MapPosition>();

  public mapElementId: string;

  private mapboxMap: Map;

  private allMarkers: Record<string, Marker>;
  private drawnMarkers: Marker[] = [];

  private mapLoaded$ = new BehaviorSubject(false);
  private markers$ = new BehaviorSubject<MapMarkerProperties[]>([]);

  private subscriptions = new Subscription();

  constructor(
    private deviceDetectorService: DeviceDetectorService,
    private element: ElementRef,
    private i18n: I18n,
    private ngZone: NgZone,
    private platform: Platform,
    private renderer: Renderer2
  ) {}

  public ngOnInit() {
    this.mapElementId = `map-${this.map.id}`;

    this.subscriptions.add(this.subscribeToMapMarkers());
  }

  private subscribeToMapMarkers(): Subscription {
    return this.mapLoaded$
      .pipe(
        filter(loaded => loaded),
        take(1),
        switchMap(() => this.markers$)
      )
      .subscribe(markers => {
        this.ngZone.runOutsideAngular(() => this.addMarkersToMap(markers));
      });
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.markers && this.markers) {
      this.markers$.next(this.markers);
    }
  }

  public ngAfterViewInit() {
    // needs to run outside Angular, otherwise change detection in AppComponent gets triggered on every mouse move
    this.ngZone.runOutsideAngular(() => this.initMap(this.map.config));
  }

  private initMap(config: MapConfig) {
    this.mapboxMap = createMapboxMap(this.mapElementId, config);
    this.mapboxMap.addControl(new NavigationControl(), 'top-right');
    this.mapboxMap.addControl(new ScaleControl(), 'bottom-right');
    // GeolocateControl needs to be added after ScaleControl to be shown above it
    this.mapboxMap.addControl(new GeolocateControl(), 'bottom-right');

    this.registerMapEventListeners();
    this.fixDefaultMapZoomRate();
  }

  private fixDefaultMapZoomRate() {
    // zoom is by default very slow in Blink-based browsers (Chrome, Opera, etc.) on Linux
    if (this.deviceDetectorService.os === OS.LINUX && this.platform.BLINK) {
      (this.mapboxMap.scrollZoom as any).setWheelZoomRate(1 / 200);
    }
  }

  private registerMapEventListeners() {
    this.mapboxMap.on('load', () => this.onMapLoad());
    this.mapboxMap.on('moveend', (event: MapboxEvent) => this.onMapMoveEnd(event));
    this.mapboxMap.on('click', MAP_CLUSTER_CIRCLE_LAYER, event => this.onMapClusterClick(event));
    this.mapboxMap.on('mouseenter', MAP_CLUSTER_CIRCLE_LAYER, event => this.onMapClusterMouseEnter(event));
    this.mapboxMap.on('mouseleave', MAP_CLUSTER_CIRCLE_LAYER, event => this.onMapClusterMouseLeave(event));
  }

  private onMapLoad() {
    this.mapLoaded$.next(true);

    this.translateNavigationControls();
    this.loadOpenMapTilesLanguage();

    this.mapboxMap.resize();
  }

  private onMapMoveEnd(event: MapboxEvent) {
    const map = event.target;

    if (!map.getSource(MAP_SOURCE_ID) || !map.isSourceLoaded(MAP_SOURCE_ID)) {
      return;
    }

    this.ngZone.run(() => {
      const {lat, lng} = map.getCenter();
      this.mapMove.emit({
        bearing: map.getBearing(),
        center: {lat, lng},
        pitch: map.getPitch(),
        zoom: map.getZoom(),
      });
    });

    this.redrawMarkers();
    this.mapboxMap.once('idle', () => this.redrawMarkers());
  }

  private onMapClusterClick(event: MapLayerMouseEvent) {
    const features = this.mapboxMap.queryRenderedFeatures(event.point, {layers: [MAP_CLUSTER_CIRCLE_LAYER]});
    const clusterId = features[0].properties.cluster_id;
    (this.mapboxMap.getSource(MAP_SOURCE_ID) as GeoJSONSource).getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error) {
        return;
      }

      this.mapboxMap.easeTo({
        center: (features[0].geometry as Point).coordinates as [number, number],
        zoom: zoom,
      });
    });
  }

  private onMapClusterMouseEnter(event: MapLayerMouseEvent) {
    this.mapboxMap.getCanvas().style.cursor = 'pointer';
  }

  private onMapClusterMouseLeave(event: MapLayerMouseEvent) {
    this.mapboxMap.getCanvas().style.cursor = '';
  }

  private redrawMarkers() {
    const unclusteredMarkers = this.getUnclusteredMarkers();

    const addedMarkers = unclusteredMarkers.filter(marker => !this.drawnMarkers.includes(marker));
    addedMarkers.forEach(marker => marker.addTo(this.mapboxMap));

    const removedMarkers = this.drawnMarkers.filter(marker => !unclusteredMarkers.includes(marker));
    removedMarkers.forEach(marker => marker.remove());

    this.drawnMarkers = unclusteredMarkers;
  }

  private getUnclusteredMarkers(): Marker[] {
    return [
      ...this.mapboxMap.querySourceFeatures(MAP_SOURCE_ID).reduce((documentIds, feature) => {
        const document = JSON.parse(feature.properties.document || null);
        if (document) {
          documentIds.add(document.id);
        }
        return documentIds;
      }, new Set()),
    ].map(documentId => this.allMarkers[documentId]);
  }

  private setControlButtonTitle(className: string, title: string) {
    this.renderer.setAttribute(document.getElementsByClassName(className).item(0), 'title', title);
  }

  private addMarkersToMap(markers: MapMarkerProperties[]) {
    this.allMarkers = markers.reduce((markersMap, properties) => {
      const marker = createMapMarker(properties);
      marker.on('dragend', event => this.onMarkerDragEnd(event, properties));
      markersMap[properties.document.id] = marker;
      return markersMap;
    }, {});

    if (this.mapboxMap.getSource(MAP_SOURCE_ID)) {
      this.mapboxMap.removeLayer(MAP_CLUSTER_SYMBOL_LAYER);
      this.mapboxMap.removeLayer(MAP_CLUSTER_CIRCLE_LAYER);
      this.mapboxMap.removeSource(MAP_SOURCE_ID);
    }

    this.mapboxMap.addSource(MAP_SOURCE_ID, createMapClusterMarkersSource(markers));
    this.mapboxMap.addLayer(createMapClustersLayer(MAP_CLUSTER_CIRCLE_LAYER, MAP_SOURCE_ID));
    this.mapboxMap.addLayer(createMapClusterCountsLayer(MAP_CLUSTER_SYMBOL_LAYER, MAP_SOURCE_ID));

    this.redrawMarkers();
    this.mapboxMap.once('idle', () => {
      this.redrawMarkers();
      this.fitMarkersBounds(markers);
    });
  }

  private fitMarkersBounds(markers: MapMarkerProperties[]) {
    if (!this.map.config.position || !this.map.config.position.center) {
      const bounds = createMapMarkersBounds(markers);
      this.mapboxMap.fitBounds(bounds, {padding: 100});
    }
  }

  private onMarkerDragEnd(event: {target: Marker}, properties: MapMarkerProperties) {
    event.target.setDraggable(false); // disable dragging until map refresh

    const coordinates: MapCoordinates = event.target.getLngLat();
    this.markerMove.emit({coordinates, properties});
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();

    if (this.mapboxMap) {
      this.mapboxMap.remove();
      this.mapboxMap = null;
    }
  }

  public refreshMapSize() {
    this.mapboxMap.resize();
  }

  public loadOpenMapTilesLanguage() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.klokantech.com/openmaptiles-language/v1.0/openmaptiles-language.js';
    script.onload = () => (this.mapboxMap as any).autodetectLanguage(environment.locale);
    this.renderer.appendChild(this.element.nativeElement, script);
  }

  private translateNavigationControls() {
    this.setControlButtonTitle(
      'mapboxgl-ctrl-zoom-in',
      this.i18n({
        id: 'map.control.zoom.in',
        value: 'Zoom in',
      })
    );
    this.setControlButtonTitle(
      'mapboxgl-ctrl-zoom-out',
      this.i18n({
        id: 'map.control.zoom.out',
        value: 'Zoom out',
      })
    );
    this.setControlButtonTitle(
      'mapboxgl-ctrl-icon mapboxgl-ctrl-compass',
      this.i18n({
        id: 'map.control.compass',
        value: 'Reset bearing to north',
      })
    );
  }
}
