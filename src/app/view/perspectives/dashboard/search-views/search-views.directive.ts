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

import {Directive, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {select, Store} from '@ngrx/store';

import {AppState} from '../../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DefaultViewConfig, View, ViewConfig} from '../../../../core/store/views/view';
import {QueryData} from '../../../../shared/top-panel/search-box/util/query-data';
import {map, switchMap, tap} from 'rxjs/operators';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Query} from '../../../../core/store/navigation/query/query';
import {selectViewsByCustomQuery} from '../../../../core/store/common/permissions.selectors';
import {SearchConfig, SearchViewsConfig} from '../../../../core/store/searches/search';
import {selectSearchConfigById} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../perspective';
import {selectCurrentView, selectDefaultViewConfig, selectViewQuery} from '../../../../core/store/views/views.state';
import {AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';
import {selectViewsPermissions} from '../../../../core/store/user-permissions/user-permissions.state';
import {defaultSearchPerspectiveConfiguration, SearchPerspectiveConfiguration} from '../../perspective-configuration';
import {selectAllCollections} from '../../../../core/store/collections/collections.state';
import {selectAllLinkTypes} from '../../../../core/store/link-types/link-types.state';
import {ViewConfigPerspectiveComponent} from '../../view-config-perspective.component';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';

@Directive()
export abstract class SearchViewsDirective
  extends ViewConfigPerspectiveComponent<SearchViewsConfig>
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  public view: View;

  @Input()
  public perspectiveConfiguration: SearchPerspectiveConfiguration = defaultSearchPerspectiveConfiguration;

  public views$: Observable<View[]>;
  public queryData$: Observable<QueryData>;
  public query$: Observable<Query>;
  public currentView$: Observable<View>;
  public workspace$: Observable<Workspace>;
  public permissions$: Observable<AllowedPermissionsMap>;
  public searchId$: Observable<string>;

  private config: SearchConfig;
  private searchId: string;
  private isEmbedded: boolean;
  private overrideView$ = new BehaviorSubject<View>(null);

  constructor(
    protected notificationService: NotificationService,
    protected store$: Store<AppState>
  ) {
    super(store$);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
    this.isEmbedded = !!this.view;
  }

  public ngOnInit() {
    this.initSubscriptions();
    super.ngOnInit();

    this.subscribeSearchId();
  }

  private initSubscriptions() {
    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      })
    );
    this.currentView$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view);
        }
        return this.store$.pipe(select(selectCurrentView));
      })
    );
    this.searchId$ = this.overrideView$.pipe(
      map(view => {
        if (view) {
          return view.code;
        }
        return DEFAULT_PERSPECTIVE_ID;
      })
    );
    this.views$ = this.query$.pipe(switchMap(query => this.store$.pipe(select(selectViewsByCustomQuery(query)))));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.queryData$ = combineLatest([
      this.store$.pipe(select(selectAllCollections)),
      this.store$.pipe(select(selectAllLinkTypes)),
    ]).pipe(map(([collections, linkTypes]) => ({collections, linkTypes})));
    this.permissions$ = this.store$.pipe(select(selectViewsPermissions));
  }

  private subscribeSearchId() {
    this.subscriptions.add(this.searchId$.subscribe(searchId => (this.searchId = searchId)));
  }

  public onConfigChange(viewsConfig: SearchViewsConfig) {
    this.configChanged(this.searchId, viewsConfig);

    if (this.searchId === DEFAULT_PERSPECTIVE_ID) {
      this.store$.dispatch(
        new ViewsAction.SetDefaultConfig({
          model: {
            key: DEFAULT_PERSPECTIVE_ID,
            perspective: Perspective.Search,
            config: {search: {...this.config, views: viewsConfig}},
          },
        })
      );
    }
  }

  protected selectCurrentView$(): Observable<View> {
    return this.currentView$;
  }

  protected selectViewQuery$(): Observable<Query> {
    return this.query$;
  }

  protected selectDefaultViewConfig$(): Observable<DefaultViewConfig> {
    return this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_PERSPECTIVE_ID)));
  }

  protected subscribeConfig$(perspectiveId: string): Observable<SearchViewsConfig> {
    return this.store$.pipe(
      select(selectSearchConfigById(perspectiveId)),
      tap(config => (this.config = config)),
      map(config => config?.views)
    );
  }

  protected configChanged(perspectiveId: string, views: SearchViewsConfig) {
    this.store$.dispatch(new SearchesAction.SetConfig({searchId: perspectiveId, config: {...this.config, views}}));
  }

  protected getConfig(viewConfig: ViewConfig): SearchViewsConfig {
    return viewConfig?.search?.views;
  }

  protected checkOrTransformConfig(
    config: SearchViewsConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): SearchViewsConfig {
    return config;
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
  }
}
