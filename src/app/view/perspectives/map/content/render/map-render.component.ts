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
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import {environment} from '../../../../../../environments/environment';
import {MapConfig, MapMarkerProperties, MapModel} from '../../../../../core/store/maps/map.model';
import {createMapboxMap, createMapMarker} from './map.utils';

mapboxgl.accessToken = environment.mapboxKey;

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

  public mapElementId: string;

  private mapboxMap: any;
  private drawnMarkers: any[] = [];

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
    this.mapboxMap = createMapboxMap(this.mapElementId, config);
    this.mapboxMap.addControl(new mapboxgl.NavigationControl());
    setTimeout(() => this.mapboxMap.resize(), 100);
  }

  private addMarkersToMap(markers: MapMarkerProperties[]) {
    this.drawnMarkers.forEach(marker => marker.remove());

    this.drawnMarkers = markers.map(properties => createMapMarker(properties));
    this.drawnMarkers.forEach(marker => marker.addTo(this.mapboxMap));
  }

  public ngOnDestroy() {
    if (this.mapboxMap) {
      this.mapboxMap.remove();
      this.mapboxMap = null;
    }
  }

  public refreshMapSize() {
    this.mapboxMap.resize();
  }
}
