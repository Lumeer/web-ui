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

import {Store, select} from '@ngrx/store';

import {Observable, Subscription, combineLatest, of} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';

import {deepObjectsEquals} from '@lumeer/utils';

import {LoadDataService, LoadDataServiceProvider} from '../../../core/service/load-data.service';
import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectCollectionsInCustomQuery} from '../../../core/store/common/permissions.selectors';
import {LinkType} from '../../../core/store/link-types/link.type';
import {checkOrTransformMapConfig, mapPositionChanged} from '../../../core/store/maps/map-config.utils';
import {DEFAULT_MAP_CONFIG, MapConfig, MapPosition} from '../../../core/store/maps/map.model';
import {MapsAction} from '../../../core/store/maps/maps.action';
import {selectMapById, selectMapConfig} from '../../../core/store/maps/maps.state';
import {selectMap} from '../../../core/store/maps/maps.state';
import {selectMapPosition, selectNavigatingToOtherWorkspace} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query/query';
import {getBaseCollectionIdsFromQuery, mapPositionPathParams} from '../../../core/store/navigation/query/query.util';
import {DefaultViewConfig, ViewConfig} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {
  selectDefaultViewConfig,
  selectDefaultViewConfigSnapshot,
  selectViewQuery,
} from '../../../core/store/views/views.state';
import {DataPerspectiveDirective} from '../data-perspective.directive';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../perspective';
import {MapPerspectiveConfiguration, defaultMapPerspectiveConfiguration} from '../perspective-configuration';
import {MapContentComponent} from './content/map-content.component';

@Component({
  selector: 'map-perspective',
  templateUrl: './map-perspective.component.html',
  styleUrls: ['./map-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LoadDataServiceProvider],
})
export class MapPerspectiveComponent extends DataPerspectiveDirective<MapConfig> implements OnInit, OnDestroy {
  @Input()
  public perspectiveConfiguration: MapPerspectiveConfiguration = defaultMapPerspectiveConfiguration;

  @ViewChild(MapContentComponent)
  public mapContentComponent: MapContentComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    protected store$: Store<AppState>,
    protected loadService: LoadDataService
  ) {
    super(store$, loadService);
  }

  public ngOnInit() {
    super.ngOnInit();
    this.subscribeAdditionalData();
    this.resetDefaultConfigSnapshot();
  }

  private subscribeAdditionalData() {
    this.subscriptions.add(this.subscribeToMapConfigPosition());
    this.subscriptions.add(this.subscribeToMapConfig());
  }

  public configChanged(perspectiveId: string, config: MapConfig) {
    this.store$.dispatch(new MapsAction.CreateMap({mapId: perspectiveId, config}));
    if (this.isDefaultPerspective(perspectiveId)) {
      this.checkConfigSnapshot(config);
    }
  }

  public getDefaultConfig(): MapConfig {
    return DEFAULT_MAP_CONFIG;
  }

  public getConfig(viewConfig: ViewConfig): MapConfig {
    return viewConfig?.map;
  }

  public checkOrTransformConfig(
    config: MapConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): MapConfig {
    return checkOrTransformMapConfig(config, query, collections, linkTypes);
  }

  public subscribeConfig$(perspectiveId: string): Observable<MapConfig> {
    return this.store$.pipe(
      select(selectMapById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public checkConfigWithDefaultView(config: MapConfig, defaultConfig?: DefaultViewConfig): Observable<MapConfig> {
    // when map is embedded, position parameters are not in url query thus cannot be obtained
    if (this.isEmbedded) {
      return of(config);
    }
    return this.store$.pipe(
      select(selectMapPosition),
      take(1),
      map(position => {
        const defaultPosition = defaultConfig?.config?.map?.position;
        if (defaultPosition) {
          return {...config, position: defaultPosition};
        }
        return {
          ...config,
          position: (config?.positionSaved ? config?.position : position) || position,
        };
      })
    );
  }

  public selectDefaultViewConfig$(): Observable<DefaultViewConfig> {
    return this.selectMapDefaultConfigId$().pipe(
      mergeMap(collectionId => this.store$.pipe(select(selectDefaultViewConfig(Perspective.Map, collectionId))))
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
        withLatestFrom(this.selectCollectionsInQuery$(), this.selectDefaultViewConfig$()),
        filter(([, collections]) => collections.length > 0)
      )
      .subscribe(([mapEntity, collections, currentViewConfig]) => {
        if (mapEntity.id === DEFAULT_PERSPECTIVE_ID && mapEntity.config?.position) {
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

  private selectCollectionsInQuery$(): Observable<Collection[]> {
    return this.query$.pipe(switchMap(query => this.store$.pipe(select(selectCollectionsInCustomQuery(query)))));
  }

  private selectMapDefaultConfigId$(): Observable<string> {
    return this.store$.pipe(
      select(selectViewQuery),
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
        withLatestFrom(this.store$.pipe(select(selectNavigatingToOtherWorkspace))),
        filter(([config, navigating]) => !navigating && !!config?.position),
        map(([config]) => config?.position),
        distinctUntilChanged((a, b) => !mapPositionChanged(a, b))
      )
      .subscribe(position => this.redirectToMapPosition(position));
  }

  private redirectToMapPosition(position: MapPosition) {
    this.router.navigate(['../map', mapPositionPathParams(position)], {
      queryParamsHandling: 'preserve',
      relativeTo: this.activatedRoute.parent,
    });
  }

  public onSidebarToggle() {
    super.onSidebarToggle();
    if (this.mapContentComponent) {
      setTimeout(() => this.mapContentComponent.refreshMapSize());
    }
  }

  private resetDefaultConfigSnapshot() {
    this.store$.dispatch(new ViewsAction.SetDefaultConfigSnapshot({}));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();

    this.loadService.destroy();
  }
}

function defaultViewMapPosition(defaultViewConfig: DefaultViewConfig): MapPosition {
  return defaultViewConfig?.config?.map?.position;
}
