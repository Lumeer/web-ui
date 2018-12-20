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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {QueryAction} from '../../../../core/model/query-action';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {
  selectCollectionsByQuery,
  selectDocumentsByQuery,
  selectViewsByQuery,
} from '../../../../core/store/common/permissions.selectors';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectViewsLoaded} from '../../../../core/store/views/views.state';
import {Perspective} from '../../perspective';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {Query} from '../../../../core/store/navigation/query';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {Project} from '../../../../core/store/projects/project';

@Component({
  templateUrl: './search-all.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAllComponent implements OnInit, OnDestroy {
  public dataLoaded$: Observable<boolean>;
  public project$: Observable<Project>;
  public hasCollection$: Observable<boolean>;
  public hasDocument$: Observable<boolean>;
  public hasView$: Observable<boolean>;
  public query$ = new BehaviorSubject<Query>(null);

  private workspace: Workspace;
  private documentsLoaded: boolean;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private router: Router) {}

  public ngOnInit() {
    this.subscribeDataInfo();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public switchToCollectionsTab() {
    this.router.navigate([this.workspacePath(), 'view', Perspective.Search, 'collections'], {
      queryParams: {action: QueryAction.CreateCollection},
    });
  }

  private subscribeDataInfo() {
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));

    this.dataLoaded$ = combineLatest(
      this.store$.pipe(select(selectCollectionsLoaded)),
      this.store$.pipe(select(selectViewsLoaded)),
      this.store$.pipe(select(selectCurrentQueryDocumentsLoaded))
    ).pipe(
      tap(([collectionsLoaded, viewLoaded, documentsLoaded]) => (this.documentsLoaded = documentsLoaded)),
      map(([collectionsLoaded, viewLoaded, documentsLoaded]) => collectionsLoaded && viewLoaded && documentsLoaded)
    );

    const navigationSubscription = this.store$
      .pipe(
        select(selectNavigation),
        filter(navigation => !!navigation.workspace && !!navigation.query)
      )
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query$.next(navigation.query);
        this.fetchDocuments();
      });
    this.subscriptions.add(navigationSubscription);

    this.hasCollection$ = this.store$.pipe(
      select(selectCollectionsByQuery),
      map(collections => collections && collections.length > 0)
    );

    this.hasView$ = this.store$.pipe(
      select(selectViewsByQuery),
      map(views => views && views.length > 0)
    );

    this.hasDocument$ = this.store$.pipe(
      select(selectDocumentsByQuery),
      map(documents => documents && documents.length > 0)
    );
  }

  private fetchDocuments() {
    const query = {...this.query$.getValue(), page: 0, pageSize: 5};
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
