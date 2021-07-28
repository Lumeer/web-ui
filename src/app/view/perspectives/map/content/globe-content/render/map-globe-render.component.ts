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
import {MapCoordinates, MapMarkerProperties, MapPosition} from '../../../../../../core/store/maps/map.model';
import {
  createMapboxMap,
  createMapClusterCountsLayer,
  createMapClusterMarkersSource,
  createMapClustersLayer,
  createMapMarker,
  createMapMarkersBounds,
} from './map-globe-render.utils';
import {MarkerMoveEvent} from './marker-move.event';
import {areMapMarkerListsEqual, createMapMarkersMap} from '../../map-content.utils';
import {generateId} from '../../../../../../shared/utils/resource.utils';
import {objectValues} from '../../../../../../shared/utils/common.utils';
import {ConfigurationService} from '../../../../../../configuration/configuration.service';

const MAP_SOURCE_ID = 'records';

const MAP_CLUSTER_CIRCLE_LAYER = 'cluster-circles';
const MAP_CLUSTER_SYMBOL_LAYER = 'cluster-symbols';

const OPENMAPTILES_LANGUAGE_URL = 'https://cdn.klokantech.com/openmaptiles-language/v1.0/openmaptiles-language.js';

@Component({
  selector: 'map-globe-render',
  templateUrl: './map-globe-render.component.html',
  styleUrls: ['./map-globe-render.component.scss', '../../../../../../../../node_modules/mapbox-gl/dist/mapbox-gl.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapGlobeRenderComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public position: MapPosition;

  @Input()
  public markers: MapMarkerProperties[];

  @Output()
  public markerMove = new EventEmitter<MarkerMoveEvent>();

  @Output()
  public mapMove = new EventEmitter<MapPosition>();

  @Output()
  public detail = new EventEmitter<MapMarkerProperties>();

  public readonly mapElementId = generateId();

  private mapboxMap: Map;

  private allMarkers: Record<string, Marker>;
  private drawnMarkers: Marker[] = [];

  private mapLoaded$ = new BehaviorSubject(false);
  private markers$ = new BehaviorSubject<MapMarkerProperties[]>([]);
  private currentMarkerProperties: Record<string, MapMarkerProperties> = {};

  private subscriptions = new Subscription();

  constructor(
    private deviceDetectorService: DeviceDetectorService,
    private ngZone: NgZone,
    private platform: Platform,
    private renderer: Renderer2,
    private configurationService: ConfigurationService
  ) {
    mapboxgl.accessToken = configurationService.getConfiguration().mapboxKey;
    window['mapboxgl'] = mapboxgl; // openmaptiles-language.js needs this
  }

  public ngOnInit() {
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
    if (changes.position && this.mapPositionChanged()) {
      this.refreshMapPosition();
    }

    if (changes.markers && this.markers) {
      const markersChanged = !areMapMarkerListsEqual(this.markers, objectValues(this.currentMarkerProperties));
      this.currentMarkerProperties = createMapMarkersMap(this.markers);
      if (markersChanged) {
        this.markers$.next(this.markers);
      }
    }
  }

  private mapPositionChanged() {
    return (
      this.mapboxMap &&
      !this.mapIsMoving() &&
      this.position?.center &&
      (this.mapboxMap.getCenter().lat !== this.position.center.lat ||
        this.mapboxMap.getCenter().lng !== this.position.center.lng ||
        this.mapboxMap.getBearing() !== this.position.bearing ||
        this.mapboxMap.getPitch() !== this.position.pitch ||
        this.mapboxMap.getZoom() !== this.position.zoom)
    );
  }

  private mapIsMoving(): boolean {
    return (
      this.mapboxMap &&
      (this.mapboxMap.isMoving() ||
        this.mapboxMap.isEasing() ||
        this.mapboxMap.isZooming() ||
        this.mapboxMap.isRotating())
    );
  }

  private refreshMapPosition() {
    if (this.position?.center && this.mapboxMap) {
      this.mapboxMap.setZoom(this.position.zoom);
      this.mapboxMap.setCenter({...this.position.center});
      this.mapboxMap.setBearing(this.position.bearing);
      this.mapboxMap.setPitch(this.position.pitch);
    }
  }

  public ngAfterViewInit() {
    // needs to run outside Angular, otherwise change detection in AppComponent gets triggered on every mouse move
    this.ngZone.runOutsideAngular(() => this.initMap(this.position));
  }

  private initMap(position: MapPosition) {
    this.mapboxMap = createMapboxMap(
      this.mapElementId,
      position,
      this.configurationService.getConfiguration(),
      this.translateMap()
    );
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
    this.mapboxMap.on('mouseenter', MAP_CLUSTER_CIRCLE_LAYER, () => this.onMapClusterMouseEnter());
    this.mapboxMap.on('mouseleave', MAP_CLUSTER_CIRCLE_LAYER, () => this.onMapClusterMouseLeave());
  }

  private onMapLoad() {
    this.mapLoaded$.next(true);

    this.loadOpenMapTilesLanguage();
    this.refreshMapSize();
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
        duration: Math.max((zoom / this.mapboxMap.getZoom()) * 200, 300),
        center: (features[0].geometry as Point).coordinates as [number, number],
        zoom: zoom,
      });
    });
  }

  private onMapClusterMouseEnter() {
    this.mapboxMap.getCanvas().style.cursor = 'pointer';
  }

  private onMapClusterMouseLeave() {
    this.mapboxMap.getCanvas().style.cursor = '';
  }

  private redrawMarkers() {
    if (this.mapboxMap) {
      const unclusteredMarkers = this.getUnclusteredMarkers();

      const addedMarkers = unclusteredMarkers.filter(marker => !this.drawnMarkers.includes(marker));
      addedMarkers.forEach(marker => marker.addTo(this.mapboxMap));

      const removedMarkers = this.drawnMarkers.filter(marker => !unclusteredMarkers.includes(marker));
      removedMarkers.forEach(marker => marker.remove());

      this.drawnMarkers = unclusteredMarkers;
    }
  }

  private getUnclusteredMarkers(): Marker[] {
    return [
      ...this.mapboxMap.querySourceFeatures(MAP_SOURCE_ID).reduce((markerIds, feature) => {
        const properties = <MapMarkerProperties>{...feature.properties};
        if (properties?.id) {
          markerIds.add(properties.id);
        }
        return markerIds;
      }, new Set<string>()),
    ]
      .map(markerId => this.allMarkers[markerId])
      .filter(marker => !!marker);
  }

  private addMarkersToMap(markers: MapMarkerProperties[]) {
    this.allMarkers = this.createAllMakers(markers);

    if (this.mapboxMap.getSource(MAP_SOURCE_ID)) {
      this.removeSourceAndLayers();
    }
    this.addSourceAndLayers(markers);

    this.redrawMarkers();
    this.mapboxMap.once('idle', () => {
      this.redrawMarkers();
      this.fitMarkersBounds(markers);
    });
  }

  private createAllMakers(markers: MapMarkerProperties[]): Record<string, Marker> {
    return markers.reduce((markersMap, properties) => {
      const marker = createMapMarker(properties, () => this.onMarkerDoubleClick(properties));
      marker.on('dragend', event => this.onMarkerDragEnd(event, properties));
      markersMap[properties.id] = marker;
      return markersMap;
    }, {});
  }

  private onMarkerDoubleClick(marker: MapMarkerProperties) {
    this.detail.emit(marker);
  }

  private addSourceAndLayers(markers: MapMarkerProperties[]) {
    if (this.mapboxMap.areTilesLoaded()) {
      this.mapboxMap.addSource(MAP_SOURCE_ID, createMapClusterMarkersSource(markers));
      this.mapboxMap.addLayer(createMapClustersLayer(MAP_CLUSTER_CIRCLE_LAYER, MAP_SOURCE_ID));
      this.mapboxMap.addLayer(createMapClusterCountsLayer(MAP_CLUSTER_SYMBOL_LAYER, MAP_SOURCE_ID));
    }
  }

  private removeSourceAndLayers() {
    if (this.mapboxMap.areTilesLoaded()) {
      this.mapboxMap.removeLayer(MAP_CLUSTER_SYMBOL_LAYER);
      this.mapboxMap.removeLayer(MAP_CLUSTER_CIRCLE_LAYER);
      this.mapboxMap.removeSource(MAP_SOURCE_ID);
    }
  }

  private fitMarkersBounds(markers: MapMarkerProperties[]) {
    if (!this.position || !this.position.center) {
      const bounds = createMapMarkersBounds(markers);
      this.mapboxMap.fitBounds(bounds, {padding: 100});
      this.mapboxMap.once('idle', () => this.redrawMarkers());
    }
  }

  private onMarkerDragEnd(event: {target: Marker}, properties: MapMarkerProperties) {
    const coordinates: MapCoordinates = event.target.getLngLat();
    const freshProperties = this.currentMarkerProperties[properties.id] || properties;
    freshProperties.coordinates = coordinates;

    this.markerMove.emit({coordinates, properties: freshProperties});
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();

    this.destroyMap();
  }

  private destroyMap() {
    this.mapboxMap?.remove();
    this.mapboxMap = null;
  }

  public refreshMapSize() {
    this.mapboxMap?.resize();
  }

  public loadOpenMapTilesLanguage() {
    const existingScript = document.querySelector(`script[src="${OPENMAPTILES_LANGUAGE_URL}"]`);
    if (existingScript) {
      // do not load the script twice
      this.activateMapTilesLanguageAutoDetection();
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = OPENMAPTILES_LANGUAGE_URL;
    script.onload = () => this.activateMapTilesLanguageAutoDetection();
    this.renderer.appendChild(document.body, script);
  }

  private activateMapTilesLanguageAutoDetection() {
    const mapbox = this.mapboxMap as any;
    if (mapbox) {
      mapbox.autodetectLanguage(this.configurationService.getConfiguration().locale);
    }
  }

  private translateMap(): Record<string, string> {
    // translation ids can be found in node_modules/mapbox-gl/src/ui/default_locale.js
    return {
      'GeolocateControl.FindMyLocation': $localize`:@@map.location.find:Find my location`,
      'GeolocateControl.LocationNotAvailable': $localize`:@@map.location.notAvailable:Location not available`,
      'NavigationControl.ResetBearing': $localize`:@@map.control.compass:Reset bearing to north`,
      'NavigationControl.ZoomIn': $localize`:@@map.control.zoom.in:Zoom in`,
      'NavigationControl.ZoomOut': $localize`:@@map.control.zoom.out:Zoom out`,
      'ScaleControl.Feet': $localize`:@@distance.feat:ft`,
      'ScaleControl.Meters': $localize`:@@distance.meters:m`,
      'ScaleControl.Kilometers': $localize`:@@distance.kilometers:km`,
      'ScaleControl.Miles': $localize`:@@distance.miles:mi`,
      'ScaleControl.NauticalMiles': $localize`:@@distance.nauticalMiles:nm`,
    };
  }
}
