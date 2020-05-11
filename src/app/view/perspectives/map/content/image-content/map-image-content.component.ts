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
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  MapImageData,
  MapImageLoadResult,
  MapMarkerData,
  MapMarkerProperties,
  MapModel,
} from '../../../../../core/store/maps/map.model';
import {AppState} from '../../../../../core/store/app.state';
import {MapsAction} from '../../../../../core/store/maps/maps.action';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {
  selectMapImageData,
  selectMapImageDataLoaded,
  selectMapImageDataLoading,
} from '../../../../../core/store/maps/maps.state';
import {MapImageRenderComponent} from './render/map-image-render.component';
import {ConstraintData} from '../../../../../core/model/data/constraint';
import {populateCoordinateProperties} from '../map-content.utils';

@Component({
  selector: 'map-image-content',
  templateUrl: './map-image-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'w-100'},
})
export class MapImageContentComponent implements OnChanges {
  @Input()
  public map: MapModel;

  @Input()
  public markerData: MapMarkerData[];

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public detail = new EventEmitter<MapMarkerProperties>();

  @ViewChild(MapImageRenderComponent)
  public mapImageRenderComponent: MapImageRenderComponent;

  public loading$: Observable<boolean>;
  public loaded$: Observable<MapImageLoadResult>;
  public imageData$: Observable<MapImageData>;

  public markers: MapMarkerProperties[];

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.map && this.map) {
      this.store$.dispatch(new MapsAction.DownloadImageData({url: this.map.config.imageUrl}));
      this.refreshObservables();
    }
    if (changes.markerData || changes.constraintData) {
      this.markers = this.bindMarkers(this.markerData || []);
    }
  }

  private bindMarkers(data: MapMarkerData[]): MapMarkerProperties[] {
    return populateCoordinateProperties(data, this.constraintData).coordinateProperties;
  }

  private refreshObservables() {
    const imageUrl = this.map.config.imageUrl;
    this.loading$ = this.store$.pipe(select(selectMapImageDataLoading(imageUrl)));
    this.loaded$ = this.store$.pipe(select(selectMapImageDataLoaded(imageUrl)));
    this.imageData$ = this.store$.pipe(select(selectMapImageData(imageUrl)));
  }

  public refreshContent() {
    this.mapImageRenderComponent?.refreshMap();
  }
}
