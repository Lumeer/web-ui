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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {first, map} from 'rxjs/operators';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {MapConfig, MapModel} from '../../../core/store/maps/map.model';
import {MapsAction} from '../../../core/store/maps/maps.action';
import {DEFAULT_MAP_ID, selectMapById, selectMapConfig} from '../../../core/store/maps/maps.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {selectPerspectiveViewConfig} from '../../../core/store/views/views.state';

@Component({
  selector: 'map-perspective',
  templateUrl: './map-perspective.component.html',
  styleUrls: ['./map-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPerspectiveComponent implements OnInit, OnDestroy {
  @Input()
  public query: QueryModel;

  public collections$: Observable<CollectionModel[]>;
  public documents$: Observable<DocumentModel[]>;
  public map$: Observable<MapModel>;
  public validQuery$: Observable<boolean>;

  private mapId = DEFAULT_MAP_ID;

  private subscriptions = new Subscription();

  constructor(private store$: Store<{}>) {}

  public ngOnInit() {
    this.bindValidQuery();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.bindMap(this.mapId);
  }

  private bindMap(mapId: string) {
    this.initMap(mapId);
    this.map$ = this.store$.pipe(select(selectMapById(mapId)));
  }

  private initMap(mapId: string) {
    this.store$
      .pipe(
        select(selectPerspectiveViewConfig),
        first()
      )
      .subscribe(config => this.createMap(mapId, config));
  }

  private createMap(mapId: string, initConfig: MapConfig) {
    this.subscriptions.add(
      this.store$
        .pipe(select(selectMapConfig))
        .subscribe(config => this.store$.dispatch(new MapsAction.CreateMap({mapId, config: config || initConfig})))
    );
  }

  private bindValidQuery() {
    this.validQuery$ = this.store$.pipe(
      select(selectQuery),
      map(query => query && query.collectionIds && query.collectionIds.length > 0)
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new MapsAction.DestroyMap({mapId: this.mapId}));
  }
}
