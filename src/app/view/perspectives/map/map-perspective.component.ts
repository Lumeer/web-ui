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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {map, take, withLatestFrom} from 'rxjs/operators';
import {Collection} from '../../../core/store/collections/collection';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {MapConfig, MapModel} from '../../../core/store/maps/map.model';
import {MapsAction} from '../../../core/store/maps/maps.action';
import {DEFAULT_MAP_ID, selectMapById, selectMapConfig} from '../../../core/store/maps/maps.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query';
import {isAnyCollectionQuery} from '../../../core/store/navigation/query.util';
import {View} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {
  selectCurrentView,
  selectPerspectiveViewConfig,
  selectSidebarOpened,
} from '../../../core/store/views/views.state';
import {MapContentComponent} from './content/map-content.component';

@Component({
  selector: 'map-perspective',
  templateUrl: './map-perspective.component.html',
  styleUrls: ['./map-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPerspectiveComponent implements OnInit, OnDestroy {
  @Input()
  public query: Query;

  @ViewChild(MapContentComponent, {static: false})
  public mapContentComponent: MapContentComponent;

  public collections$: Observable<Collection[]>;
  public documents$: Observable<DocumentModel[]>;
  public map$: Observable<MapModel>;
  public validQuery$: Observable<boolean>;
  public sidebarOpened$ = new BehaviorSubject(false);

  private mapId = DEFAULT_MAP_ID;

  private subscriptions = new Subscription();

  constructor(private store$: Store<{}>) {}

  public ngOnInit() {
    this.bindValidQuery();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.bindMap(this.mapId);

    this.subscriptions.add(this.subscribeToCollections());

    this.setupSidebar();
  }

  private bindMap(mapId: string) {
    this.initMap(mapId);
    this.map$ = this.store$.pipe(select(selectMapById(mapId)));
  }

  private initMap(mapId: string) {
    this.store$
      .pipe(
        select(selectPerspectiveViewConfig),
        take(1)
      )
      .subscribe(config => this.createMap(mapId, config));
  }

  private createMap(mapId: string, initConfig: MapConfig) {
    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectMapConfig),
          take(1)
        )
        .subscribe(config => this.store$.dispatch(new MapsAction.CreateMap({mapId, config: config || initConfig})))
    );
  }

  private subscribeToCollections(): Subscription {
    return this.collections$.subscribe(collections =>
      this.store$.dispatch(
        new MapsAction.UpdateAttributes({
          mapId: this.mapId,
          collections,
        })
      )
    );
  }

  private setupSidebar() {
    this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectSidebarOpened))),
        take(1)
      )
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }

  private bindValidQuery() {
    this.validQuery$ = this.store$.pipe(
      select(selectQuery),
      map(query => isAnyCollectionQuery(query))
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new MapsAction.DestroyMap({mapId: this.mapId}));
  }

  public onSidebarToggle() {
    if (this.mapContentComponent) {
      setTimeout(() => this.mapContentComponent.refreshMapSize());
    }

    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }
}
