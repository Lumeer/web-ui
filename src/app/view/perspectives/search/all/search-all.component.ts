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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';
import {QueryAction} from '../../../../core/model/query-action';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../../core/store/common/permissions.selectors';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../../core/store/navigation/workspace.model';
import {selectViewsByQuery, selectViewsLoaded} from '../../../../core/store/views/views.state';
import {Perspective} from '../../perspective';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {Query} from '../../../../core/store/navigation/query';

@Component({
  templateUrl: './search-all.component.html',
})
export class SearchAllComponent implements OnInit, OnDestroy {
  public dataLoaded$: Observable<boolean>;
  public hasCollection: boolean;
  public hasDocument: boolean;
  public hasView: boolean;
  public workspace: Workspace;
  public query: Query;

  private documentsLoaded: boolean;
  private subscriptions = new Subscription();

  constructor(private store: Store<AppState>, private router: Router) {}

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
    this.dataLoaded$ = combineLatest(
      this.store.select(selectCollectionsLoaded),
      this.store.select(selectViewsLoaded),
      this.store.select(selectCurrentQueryDocumentsLoaded)
    ).pipe(
      tap(([collectionsLoaded, viewLoaded, documentsLoaded]) => (this.documentsLoaded = documentsLoaded)),
      map(([collectionsLoaded, viewLoaded, documentsLoaded]) => collectionsLoaded && viewLoaded && documentsLoaded)
    );

    const navigationSubscription = this.store
      .select(selectNavigation)
      .pipe(filter(navigation => !!navigation.workspace && !!navigation.query))
      .subscribe(navigation => {
        this.workspace = navigation.workspace;
        this.query = navigation.query;
        this.fetchDocuments();
      });
    this.subscriptions.add(navigationSubscription);

    const collectionSubscription = this.store
      .select(selectCollectionsByQuery)
      .pipe(map(collections => collections && collections.length > 0))
      .subscribe(hasCollection => (this.hasCollection = hasCollection));
    this.subscriptions.add(collectionSubscription);

    const viewsSubscription = this.store
      .select(selectViewsByQuery)
      .pipe(map(views => views && views.length > 0))
      .subscribe(hasView => (this.hasView = hasView));
    this.subscriptions.add(viewsSubscription);

    const documentSubscription = this.store
      .select(selectDocumentsByQuery)
      .pipe(map(documents => documents && documents.length > 0))
      .subscribe(hasDocument => (this.hasDocument = hasDocument));
    this.subscriptions.add(documentSubscription);
  }

  private fetchDocuments() {
    const query = {...this.query, page: 0, pageSize: 5};
    this.store.dispatch(new DocumentsAction.Get({query}));
  }

  private workspacePath(): string {
    return `/w/${this.workspace.organizationCode}/${this.workspace.projectCode}`;
  }
}
