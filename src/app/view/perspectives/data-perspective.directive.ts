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
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {ResourcesPermissions} from '../../core/model/allowed-permissions';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {Query} from '../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectCurrentView, selectSidebarOpened, selectViewAdditionalQueries} from '../../core/store/views/views.state';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {View, ViewSettings} from '../../core/store/views/view';
import {selectConstraintData} from '../../core/store/constraint-data/constraint-data.state';
import {
  selectCanManageViewConfig,
  selectCollectionsByCustomViewAndQuery,
  selectDataByCustomQuery,
  selectDocumentsAndLinksByCustomQuerySorted,
  selectLinkTypesInCustomViewAndQuery,
  selectResourcesPermissionsByView,
} from '../../core/store/common/permissions.selectors';
import {DataResourcesAction} from '../../core/store/data-resources/data-resources.action';
import {selectViewDataQuery, selectViewSettingsByView} from '../../core/store/view-settings/view-settings.state';
import {selectQueryDataResourcesLoaded} from '../../core/store/data-resources/data-resources.state';
import {DEFAULT_PERSPECTIVE_ID} from './perspective';
import {ViewConfigPerspectiveComponent} from './view-config-perspective.component';
import {User} from '../../core/store/users/user';
import {selectCurrentUserForWorkspace} from '../../core/store/users/users.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {selectNavigatingToOtherWorkspace} from '../../core/store/navigation/navigation.state';

@Directive()
export abstract class DataPerspectiveDirective<T>
  extends ViewConfigPerspectiveComponent<T>
  implements OnInit, OnChanges, OnDestroy
{
  @Input()
  public view: View;

  public isEmbedded: boolean;

  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<ResourcesPermissions>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public data$: Observable<DocumentsAndLinksData>;
  public constraintData$: Observable<ConstraintData>;
  public dataLoaded$: Observable<boolean>;
  public viewSettings$: Observable<ViewSettings>;
  public currentUser$: Observable<User>;
  public currentView$: Observable<View>;
  public currentViewId$: Observable<string>;
  public query$: Observable<Query>;
  public workspace$: Observable<Workspace>;
  public navigating$: Observable<boolean>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public overrideView$ = new BehaviorSubject<View>(null);

  protected constructor(protected store$: Store<AppState>) {
    super(store$);
  }

  protected subscribeDocumentsAndLinks$(
    view: View,
    query: Query
  ): Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}> {
    return this.store$.pipe(select(selectDocumentsAndLinksByCustomQuerySorted(view, query)));
  }

  protected subscribeData$(view: View, query: Query): Observable<DocumentsAndLinksData> {
    return this.store$.pipe(select(selectDataByCustomQuery(view, query)));
  }

  protected selectCurrentView$(): Observable<View> {
    return this.currentView$;
  }

  protected selectViewQuery$(): Observable<Query> {
    return this.query$;
  }

  public ngOnInit() {
    this.initSubscriptions();
    super.ngOnInit();

    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
    this.isEmbedded = !!this.view;
  }

  private initSubscriptions() {
    this.navigating$ = this.store$.pipe(select(selectNavigatingToOtherWorkspace), distinctUntilChanged());
    this.currentView$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view);
        }
        return this.store$.pipe(select(selectCurrentView));
      })
    );
    this.currentViewId$ = this.currentView$.pipe(
      map(view => view?.id),
      distinctUntilChanged()
    );

    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewDataQuery));
      })
    );
  }

  private subscribeToQuery() {
    this.subscriptions.add(
      combineLatest([this.currentViewId$, this.query$, this.navigating$])
        .pipe(
          debounceTime(100),
          filter(([, , navigating]) => !navigating)
        )
        .subscribe(([viewId, query]) => this.fetchData(query, viewId))
    );

    const viewAdditionalQueries$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.additionalQueries);
        }
        return this.store$.pipe(select(selectViewAdditionalQueries));
      })
    );
    this.subscriptions.add(
      combineLatest([this.currentViewId$, viewAdditionalQueries$, this.navigating$])
        .pipe(
          debounceTime(100),
          filter(([, , navigating]) => !navigating)
        )
        .subscribe(([viewId, queries]) => queries.forEach(query => this.fetchData(query, viewId)))
    );
  }

  private fetchData(query: Query, viewId: string) {
    this.store$.dispatch(new DataResourcesAction.Get({query, workspace: {viewId}}));
  }

  private subscribeData() {
    this.documentsAndLinks$ = combineLatest([this.currentView$, this.query$]).pipe(
      switchMap(([currentView, query]) => this.subscribeDocumentsAndLinks$(currentView, query))
    );
    this.data$ = combineLatest([this.currentView$, this.query$]).pipe(
      switchMap(([currentView, query]) => this.subscribeData$(currentView, query))
    );
    this.currentUser$ = this.store$.pipe(select(selectCurrentUserForWorkspace));
    this.dataLoaded$ = this.query$.pipe(
      switchMap(query => this.store$.pipe(select(selectQueryDataResourcesLoaded(query))))
    );
    this.collections$ = this.selectCollections$();
    this.linkTypes$ = this.selectLinkTypes$();
    this.permissions$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectResourcesPermissionsByView(view))))
    );
    this.workspace$ = this.currentView$.pipe(map(view => ({viewId: view?.id})));
    this.canManageConfig$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectCanManageViewConfig(view))))
    );
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.viewSettings$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectViewSettingsByView(view))))
    );
  }

  private selectCollections$(): Observable<Collection[]> {
    return combineLatest([this.currentView$, this.query$]).pipe(
      switchMap(([currentView, query]) =>
        this.store$.pipe(select(selectCollectionsByCustomViewAndQuery(currentView, query)))
      )
    );
  }

  private selectLinkTypes$(): Observable<LinkType[]> {
    return combineLatest([this.currentView$, this.query$]).pipe(
      switchMap(([currentView, query]) =>
        this.store$.pipe(select(selectLinkTypesInCustomViewAndQuery(currentView, query)))
      )
    );
  }

  public isDefaultPerspective(id: string): boolean {
    return id === DEFAULT_PERSPECTIVE_ID;
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  private setupSidebar() {
    this.currentView$
      .pipe(withLatestFrom(this.store$.pipe(select(selectSidebarOpened))), take(1))
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }
}
