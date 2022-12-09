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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Collection} from '../../../../core/store/collections/collection';
import {
  selectCollectionsPermissionsByView,
  selectTasksCollectionsByViewAndCustomQuery,
  selectTasksDocumentsByCustomQuery,
} from '../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../core/store/navigation/query/query';
import {SearchConfig, SearchTasksConfig} from '../../../../core/store/searches/search';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectSearchConfigById, selectSearchId} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../../perspective';
import {
  selectAllViews,
  selectCurrentView,
  selectDefaultViewConfig,
  selectViewQuery,
} from '../../../../core/store/views/views.state';
import {ConstraintData} from '@lumeer/data-filters';
import {DataResourcesAction} from '../../../../core/store/data-resources/data-resources.action';
import {selectQueryTasksLoaded} from '../../../../core/store/data-resources/data-resources.state';
import {selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {DefaultViewConfig, View, ViewConfig} from '../../../../core/store/views/view';
import {User} from '../../../../core/store/users/user';
import {defaultSearchPerspectiveConfiguration, SearchPerspectiveConfiguration} from '../../perspective-configuration';
import {AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';
import {selectCurrentUser} from '../../../../core/store/users/users.state';
import {ViewConfigPerspectiveComponent} from '../../view-config-perspective.component';
import {LinkType} from 'src/app/core/store/link-types/link.type';

const PAGE_SIZE = 50;

@Component({
  selector: 'search-tasks',
  templateUrl: './search-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchTasksComponent
  extends ViewConfigPerspectiveComponent<SearchTasksConfig>
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  public view: View;

  @Input()
  public maxLines: number = -1;

  @Input()
  public perspectiveConfiguration: SearchPerspectiveConfiguration = defaultSearchPerspectiveConfiguration;

  @Input()
  public compactEmptyPages: boolean;

  @Input()
  public scrollContainer: string;

  public constraintData$: Observable<ConstraintData>;
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public loaded$: Observable<boolean>;
  public searchId$: Observable<string>;
  public query$: Observable<Query>;
  public views$: Observable<View[]>;
  public currentView$: Observable<View>;
  public workspace$: Observable<Workspace>;
  public currentUser$: Observable<User>;
  public permissions$: Observable<AllowedPermissionsMap>;

  private isEmbedded: boolean;
  private searchId: string;
  private config: SearchConfig;
  private page$ = new BehaviorSubject<number>(0);
  private overrideView$ = new BehaviorSubject<View>(null);

  constructor(protected store$: Store<AppState>) {
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

    this.documents$ = this.subscribeDocuments$();

    this.subscribeSearchId();
    this.subscribeQueryChange();
  }

  private initSubscriptions() {
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
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
      mergeMap(view => {
        if (view) {
          return of(view.code);
        }
        return this.store$.pipe(select(selectSearchId));
      })
    );

    this.collections$ = combineLatest([this.currentView$, this.query$]).pipe(
      switchMap(([view, query]) => this.store$.pipe(select(selectTasksCollectionsByViewAndCustomQuery(view, query))))
    );
    this.permissions$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectCollectionsPermissionsByView(view))))
    );
    this.loaded$ = this.query$.pipe(switchMap(query => this.store$.pipe(select(selectQueryTasksLoaded(query)))));

    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.views$ = this.store$.pipe(select(selectAllViews));
  }

  private subscribeSearchId() {
    this.subscriptions.add(this.searchId$.subscribe(searchId => (this.searchId = searchId)));
  }

  private subscribeDocuments$(): Observable<DocumentModel[]> {
    const pageObservable = this.page$.asObservable();
    return combineLatest([this.currentView$, this.query$, this.config$]).pipe(
      switchMap(([view, query, documentsConfig]) =>
        this.store$.pipe(
          select(selectTasksDocumentsByCustomQuery(view, query, documentsConfig)),
          switchMap(documents => pageObservable.pipe(map(page => (documents || []).slice(0, PAGE_SIZE * (page + 1)))))
        )
      )
    );
  }

  public configChange(documentsConfig: SearchTasksConfig) {
    this.configChanged(this.searchId, documentsConfig);

    if (this.searchId === DEFAULT_PERSPECTIVE_ID) {
      this.store$.dispatch(
        new ViewsAction.SetDefaultConfig({
          model: {
            key: DEFAULT_PERSPECTIVE_ID,
            perspective: Perspective.Search,
            config: {search: {...this.config, documents: documentsConfig}},
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

  protected subscribeConfig$(perspectiveId: string): Observable<SearchTasksConfig> {
    return this.store$.pipe(
      select(selectSearchConfigById(perspectiveId)),
      tap(config => (this.config = config)),
      map(config => config?.documents)
    );
  }

  protected configChanged(perspectiveId: string, documents: SearchTasksConfig) {
    this.store$.dispatch(new SearchesAction.SetConfig({searchId: perspectiveId, config: {...this.config, documents}}));
  }

  protected getConfig(viewConfig: ViewConfig): SearchTasksConfig {
    return viewConfig?.search?.documents;
  }

  protected checkOrTransformConfig(
    config: SearchTasksConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): SearchTasksConfig {
    return config;
  }

  public onFetchNextPage() {
    this.page$.next(this.page$.value + 1);
    this.selectFetchPayload$()
      .pipe(take(1))
      .subscribe(([viewId, query]) => {
        this.fetchTasks(query, viewId);
      });
  }

  private selectFetchPayload$(): Observable<[string, Query]> {
    return combineLatest([
      this.currentView$.pipe(
        map(view => view?.id),
        distinctUntilChanged()
      ),
      this.query$,
    ]);
  }

  private fetchTasks(query: Query, viewId: string) {
    this.store$.dispatch(new DataResourcesAction.GetTasks({query, workspace: {viewId}}));
  }

  private subscribeQueryChange() {
    const workspace$ = this.store$.pipe(select(selectWorkspace), distinctUntilChanged());

    const navigationSubscription = workspace$
      .pipe(
        switchMap(() => this.selectFetchPayload$()),
        filter(([, query]) => !!query)
      )
      .subscribe(([viewId, query]) => {
        this.resetPage();
        this.fetchTasks(query, viewId);
      });
    this.subscriptions.add(navigationSubscription);
  }

  private resetPage() {
    this.page$.next(0);
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
  }
}
