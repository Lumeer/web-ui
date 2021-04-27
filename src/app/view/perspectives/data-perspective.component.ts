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

import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {Collection} from '../../core/store/collections/collection';
import {LinkType} from '../../core/store/link-types/link.type';
import {AllowedPermissionsMap} from '../../core/model/allowed-permissions';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {ConstraintData, DocumentsAndLinksData} from '@lumeer/data-filters';
import {Query} from '../../core/store/navigation/query/query';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../core/store/app.state';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectCurrentView, selectSidebarOpened} from '../../core/store/views/views.state';
import {take, withLatestFrom} from 'rxjs/operators';
import {View, ViewSettings} from '../../core/store/views/view';
import {selectConstraintData} from '../../core/store/constraint-data/constraint-data.state';
import {
  selectCanManageViewConfig,
  selectCollectionsByQuery,
  selectDataByQuery,
  selectDocumentsAndLinksByQuerySorted,
  selectLinkTypesInQuery,
} from '../../core/store/common/permissions.selectors';
import {selectCollectionsPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {DataResourcesAction} from '../../core/store/data-resources/data-resources.action';
import {selectViewDataQuery, selectViewSettings} from '../../core/store/view-settings/view-settings.state';
import {selectCurrentQueryDataResourcesLoaded} from '../../core/store/data-resources/data-resources.state';
import {DEFAULT_PERSPECTIVE_ID} from './perspective';
import {ViewConfigPerspectiveComponent} from './view-config-perspective.component';

@Injectable()
export abstract class DataPerspectiveComponent<T>
  extends ViewConfigPerspectiveComponent<T>
  implements OnInit, OnDestroy {
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<AllowedPermissionsMap>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public data$: Observable<DocumentsAndLinksData>;
  public constraintData$: Observable<ConstraintData>;
  public dataLoaded$: Observable<boolean>;
  public viewSettings$: Observable<ViewSettings>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);

  protected constructor(protected store$: Store<AppState>) {
    super(store$);
  }

  protected subscribeDocumentsAndLinks$(): Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}> {
    return this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
  }

  protected subscribeData$(): Observable<DocumentsAndLinksData> {
    return this.store$.pipe(select(selectDataByQuery));
  }

  public ngOnInit() {
    super.ngOnInit();

    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
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
    this.data$ = this.subscribeData$();
    this.dataLoaded$ = this.store$.pipe(select(selectCurrentQueryDataResourcesLoaded));
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.viewSettings$ = this.store$.pipe(select(selectViewSettings));
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
