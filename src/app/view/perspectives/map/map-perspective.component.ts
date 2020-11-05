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
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  pairwise,
  startWith,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {Collection} from '../../../core/store/collections/collection';
import {
  selectCollectionsByQuery,
  selectCollectionsInQuery,
  selectDocumentsAndLinksByQuerySorted,
  selectLinkTypesInQuery,
} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {DEFAULT_MAP_CONFIG, MapConfig, MapModel, MapPosition} from '../../../core/store/maps/map.model';
import {MapsAction} from '../../../core/store/maps/maps.action';
import {DEFAULT_MAP_ID, selectMap, selectMapById, selectMapConfig} from '../../../core/store/maps/maps.state';
import {selectMapPosition, selectQuery} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query/query';
import {DefaultViewConfig, View, ViewConfig} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {
  selectCurrentView,
  selectDefaultViewConfig,
  selectDefaultViewConfigSnapshot,
  selectSidebarOpened,
} from '../../../core/store/views/views.state';
import {MapContentComponent} from './content/map-content.component';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {Perspective} from '../perspective';
import {checkOrTransformMapConfig} from '../../../core/store/maps/map-config.utils';
import {getBaseCollectionIdsFromQuery, mapPositionPathParams} from '../../../core/store/navigation/query/query.util';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {ConstraintData} from '../../../core/model/data/constraint';
import {ConstraintDataService} from '../../../core/service/constraint-data.service';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {CollectionsPermissionsPipe} from '../../../shared/pipes/permissions/collections-permissions.pipe';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';

@Component({
  selector: 'map-perspective',
  templateUrl: './map-perspective.component.html',
  styleUrls: ['./map-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPerspectiveComponent implements OnInit, OnDestroy {
  @Input()
  public query: Query;

  @ViewChild(MapContentComponent)
  public mapContentComponent: MapContentComponent;

  public collections$: Observable<Collection[]>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public linkTypes$: Observable<LinkType[]>;
  public constraintData$: Observable<ConstraintData>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public map$: Observable<MapModel>;
  public query$: Observable<Query>;
  public currentView$: Observable<View>;
  public sidebarOpened$ = new BehaviorSubject(false);

  private subscriptions = new Subscription();

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private constraintDataService: ConstraintDataService,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe,
    private store$: Store<{}>
  ) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
    this.map$ = this.store$.pipe(select(selectMap));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.permissions$ = this.collections$.pipe(
      mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );

    this.subscriptions.add(this.subscribeToConfig());
    this.subscriptions.add(this.subscribeToMapConfigPosition());
    this.subscriptions.add(this.subscribeToMapConfig());

    this.setupSidebar();
    this.subscribeToQuery();
    this.resetDefaultConfigSnapshot();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.fetchData(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeToConfig(): Subscription {
    return this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({mapId, config}: {mapId?: string; config?: MapConfig}) => {
        if (mapId) {
          this.store$.dispatch(new MapsAction.CreateMap({mapId, config}));
        }
      });
  }

  private subscribeToView(previousView: View, view: View): Observable<{mapId?: string; config?: MapConfig}> {
    const mapId = view.code;
    return this.store$.pipe(
      select(selectMapById(mapId)),
      take(1),
      withLatestFrom(this.store$.pipe(select(selectMapPosition))),
      mergeMap(([mapEntity, position]) => {
        const mapConfig = view.config && view.config.map;
        if (preferViewConfigUpdate(previousView?.config?.map, view?.config?.map, !!mapEntity)) {
          const configToCheck: MapConfig = {
            ...mapConfig,
            position: mapConfig?.positionSaved ? mapConfig.position : position,
          };
          return this.checkMapConfig(configToCheck).pipe(map(config => ({mapId, config})));
        }
        return of({mapId, config: mapEntity?.config || mapConfig || DEFAULT_MAP_CONFIG});
      })
    );
  }

  private checkMapConfig(config: MapConfig): Observable<MapConfig> {
    return combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformMapConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{mapId?: string; config?: MapConfig}> {
    const mapId = DEFAULT_MAP_ID;
    return this.store$.pipe(
      select(selectQuery),
      switchMap(() =>
        this.selectCurrentDefaultViewConfig$().pipe(
          distinctUntilChanged((a, b) => deepObjectsEquals(defaultViewMapPosition(a), defaultViewMapPosition(b))),
          withLatestFrom(this.store$.pipe(select(selectMapById(mapId))), this.store$.pipe(select(selectMapPosition))),
          mergeMap(([defaultConfig, mapEntity, position]) =>
            this.checkMapConfig(mapEntity?.config).pipe(
              map(checkedConfig => {
                const config: MapConfig = {
                  ...checkedConfig,
                  position: defaultConfig?.config?.map?.position || mapEntity?.config?.position || position,
                };
                return {mapId, config};
              })
            )
          ),
          tap(({config}) => this.checkConfigSnapshot(config))
        )
      )
    );
  }

  private checkConfigSnapshot(config: MapConfig) {
    combineLatest([this.selectMapDefaultConfigId$(), this.store$.pipe(select(selectDefaultViewConfigSnapshot))])
      .pipe(take(1))
      .subscribe(([mapId, snapshot]) => {
        if (!snapshot || snapshot.key !== mapId || snapshot.perspective !== Perspective.Map) {
          const defaultConfigSnapshot: DefaultViewConfig = {
            key: mapId,
            perspective: Perspective.Map,
            config: {map: config},
          };
          this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({model: defaultConfigSnapshot}));
        }
      });
  }

  private subscribeToMapConfig(): Subscription {
    return this.store$
      .pipe(
        select(selectMap),
        debounceTime(1000),
        filter(mapEntity => !!mapEntity),
        withLatestFrom(this.store$.pipe(select(selectCollectionsInQuery)), this.selectCurrentDefaultViewConfig$()),
        filter(([, collections]) => collections.length > 0)
      )
      .subscribe(([mapEntity, collections, currentViewConfig]) => {
        if (mapEntity.id === DEFAULT_MAP_ID && mapEntity.config?.position) {
          const savedPosition = defaultViewMapPosition(currentViewConfig);
          if (!deepObjectsEquals(mapEntity.config.position, savedPosition)) {
            this.saveMapDefaultViewConfig(collections, mapEntity.config);
          }
        }

        if (mapEntity.config?.position) {
          this.redirectToMapPosition(mapEntity.config.position);
        }
      });
  }

  private selectCurrentDefaultViewConfig$(): Observable<DefaultViewConfig> {
    return this.selectMapDefaultConfigId$().pipe(
      mergeMap(collectionId => this.store$.pipe(select(selectDefaultViewConfig(Perspective.Map, collectionId))))
    );
  }

  private selectMapDefaultConfigId$(): Observable<string> {
    return this.store$.pipe(
      select(selectQuery),
      map(query => getBaseCollectionIdsFromQuery(query)[0])
    );
  }

  private saveMapDefaultViewConfig(collections: Collection[], mapConfig: MapConfig) {
    const config: ViewConfig = {map: {position: mapConfig.position}};
    collections.forEach(collection => {
      const model: DefaultViewConfig = {key: collection.id, perspective: Perspective.Map, config};
      this.store$.dispatch(new ViewsAction.SetDefaultConfig({model}));
    });
  }

  private subscribeToMapConfigPosition(): Subscription {
    return this.store$
      .pipe(
        select(selectMapConfig),
        filter(config => config && !!config.position)
      )
      .subscribe(config => this.redirectToMapPosition(config.position));
  }

  private redirectToMapPosition(position: MapPosition) {
    this.router.navigate(['../map', mapPositionPathParams(position)], {
      queryParamsHandling: 'preserve',
      relativeTo: this.activatedRoute.parent,
    });
  }

  private setupSidebar() {
    this.store$
      .pipe(select(selectCurrentView), withLatestFrom(this.store$.pipe(select(selectSidebarOpened))), take(1))
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSidebarToggle() {
    if (this.mapContentComponent) {
      setTimeout(() => this.mapContentComponent.refreshMapSize());
    }

    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  private resetDefaultConfigSnapshot() {
    this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({}));
  }
}

function defaultViewMapPosition(defaultViewConfig: DefaultViewConfig): MapPosition {
  return defaultViewConfig?.config?.map?.position;
}
