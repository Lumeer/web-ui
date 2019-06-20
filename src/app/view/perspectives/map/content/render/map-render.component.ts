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
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Map, Marker, NavigationControl} from 'mapbox-gl';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl';
import {BehaviorSubject, Subscription} from 'rxjs';
import {filter, switchMap, take} from 'rxjs/operators';
import {environment} from '../../../../../../environments/environment';
import {MapConfig, MapMarkerProperties, MapModel} from '../../../../../core/store/maps/map.model';
import {createMapboxMap, createMapMarker} from './map.utils';

mapboxgl.accessToken = environment.mapboxKey;
window['mapboxgl'] = mapboxgl; // openmaptiles-language.js needs this

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

  private mapboxMap: Map;
  private drawnMarkers: Marker[] = [];

  private mapLoaded$ = new BehaviorSubject(false);
  private markers$ = new BehaviorSubject<MapMarkerProperties[]>([]);

  private subscriptions = new Subscription();

  constructor(private element: ElementRef, private i18n: I18n, private ngZone: NgZone, private renderer: Renderer2) {}

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
    this.ngZone.runOutsideAngular(() => this.initMap(this.map.config));
  }

  public loadOpenMapTilesLanguage() {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://cdn.klokantech.com/openmaptiles-language/v1.0/openmaptiles-language.js';
    script.onload = () => (this.mapboxMap as any).autodetectLanguage(environment.locale);
    this.renderer.appendChild(this.element.nativeElement, script);
  }

  private initMap(config: MapConfig) {
    this.mapboxMap = createMapboxMap(this.mapElementId, config);

    this.mapboxMap.addControl(new NavigationControl());

    this.mapboxMap.on('load', () => {
      this.mapLoaded$.next(true);

      this.translateNavigationControls();
      this.loadOpenMapTilesLanguage();

      this.mapboxMap.resize();
    });

    setTimeout(() => this.mapboxMap.resize(), 100);
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

  private setControlButtonTitle(className: string, title: string) {
    this.renderer.setAttribute(document.getElementsByClassName(className).item(0), 'title', title);
  }

  private addMarkersToMap(markers: MapMarkerProperties[]) {
    this.drawnMarkers.forEach(marker => marker.remove());

    this.drawnMarkers = markers.map(properties => createMapMarker(properties));
    this.drawnMarkers.forEach(marker => marker.addTo(this.mapboxMap));
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
}
