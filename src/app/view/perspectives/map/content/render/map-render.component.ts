/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {LayerGroup, Map, Marker} from 'leaflet';
import {MapConfig, MapModel} from '../../../../../core/store/maps/map.model';
import {createMapTileLayer} from './map-tiles';
import {createLeafletMap} from './map.utils';

@Component({
  selector: 'map-render',
  templateUrl: './map-render.component.html',
  styleUrls: ['./map-render.component.scss', '../../../../../../../node_modules/leaflet/dist/leaflet.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class MapRenderComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input()
  public map: MapModel;

  @Input()
  public markers: Marker[];

  public mapElementId: string;

  private leafletMap: Map;
  private markersLayer: LayerGroup;

  constructor(private ngZone: NgZone) {}

  public ngOnInit() {
    this.mapElementId = `map-${this.map.id}`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.markers && this.markers) {
      this.ngZone.runOutsideAngular(() => setTimeout(() => this.addMarkersToMap(this.markers)));
    }
  }

  public ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => this.initMap(this.map.config));
  }

  private initMap(config: MapConfig) {
    this.leafletMap = createLeafletMap(this.mapElementId, config);
    setTimeout(() => this.leafletMap.invalidateSize(), 100);

    createMapTileLayer(config.tiles).addTo(this.leafletMap);

    this.leafletMap.zoomControl.setPosition('bottomright');
  }

  private addMarkersToMap(markers: Marker[]) {
    if (this.markersLayer) {
      this.leafletMap.removeLayer(this.markersLayer);
    }

    this.markersLayer = new LayerGroup(markers);
    this.markersLayer.addTo(this.leafletMap);
  }

  public ngOnDestroy() {
    if (this.leafletMap) {
      this.leafletMap.remove();
    }
  }
}
