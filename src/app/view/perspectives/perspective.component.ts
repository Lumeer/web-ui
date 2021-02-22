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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {ConstraintData} from '@lumeer/data-filters';
import {Query} from '../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectCurrentView, selectSidebarOpened, selectViewQuery} from '../../core/store/views/views.state';
import {map, mergeMap, pairwise, startWith, switchMap, take, withLatestFrom} from 'rxjs/operators';
import {View, ViewConfig} from '../../core/store/views/view';
import {selectConstraintData} from '../../core/store/constraint-data/constraint-data.state';
import {
  selectCanManageViewConfig,
  selectCollectionsByQuery,
  selectLinkTypesInQuery,
} from '../../core/store/common/permissions.selectors';
import {selectCollectionsPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {DataResourcesAction} from '../../core/store/data-resources/data-resources.action';
import {selectViewDataQuery} from '../../core/store/view-settings/view-settings.state';
import {preferViewConfigUpdate} from '../../core/store/views/view.utils';

const DEFAULT_ID = 'default';

@Component({
  template: '',
})
export abstract class PerspectiveComponent<T> implements OnInit, OnDestroy {
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);

  public perspectiveId: string;

  protected subscriptions = new Subscription();

  protected constructor(protected store$: Store<AppState>) {}

  protected abstract subscribeDocumentsAndLinks$(): Observable<{
    documents: DocumentModel[];
    linkInstances: LinkInstance[];
  }>;

  protected abstract subscribeConfig$(perspectiveId: string): Observable<T>;

  protected abstract configChanged(perspectiveId: string, config: T);

  protected abstract getConfig(viewConfig: ViewConfig): T;

  protected abstract checkOrTransformConfig(
    config: T,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): T;

  public ngOnInit() {
    this.initPerspective();
    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  private initPerspective() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({perspectiveId, config}: {perspectiveId?: string; config?: T}) => {
        if (perspectiveId) {
          this.perspectiveId = perspectiveId;
          this.configChanged(perspectiveId, config);
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{perspectiveId?: string; config?: T}> {
    const perspectiveId = view.code;
    return this.subscribeConfig$(perspectiveId).pipe(
      take(1),
      mergeMap(entityConfig => {
        const perspectiveConfig = this.getConfig(view.config);
        if (
          preferViewConfigUpdate(this.getConfig(previousView?.config), this.getConfig(view?.config), !!entityConfig)
        ) {
          return this.checkPerspectiveConfig(perspectiveConfig).pipe(map(config => ({perspectiveId, config})));
        }
        return of({perspectiveId, config: entityConfig || perspectiveConfig});
      })
    );
  }

  private checkPerspectiveConfig(config: T): Observable<T> {
    return combineLatest([
      this.store$.pipe(select(selectViewQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => this.checkOrTransformConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{perspectiveId?: string; config?: T}> {
    const perspectiveId = DEFAULT_ID;
    return this.store$.pipe(
      select(selectViewQuery),
      withLatestFrom(this.subscribeConfig$(perspectiveId)),
      mergeMap(([, config]) => this.checkPerspectiveConfig(config)),
      map(config => ({perspectiveId, config}))
    );
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectViewDataQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchData(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DataResourcesAction.Get({query}));
  }

  private subscribeData() {
    this.documentsAndLinks$ = this.subscribeDocumentsAndLinks$();
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
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
}
