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
import {Store} from '@ngrx/store';

import {Observable, Subscription, combineLatest as observableCombineLatest} from 'rxjs';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionsByQuery, selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {selectViewsByQuery, selectViewsLoaded} from '../../../../core/store/views/views.state';
import {selectCurrentQueryLoaded, selectDocumentsByQuery} from '../../../../core/store/documents/documents.state';
import {filter, map, tap} from 'rxjs/operators';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../../core/store/navigation/query.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';

@Component({
  templateUrl: './search-all.component.html'
})
export class SearchAllComponent implements OnInit, OnDestroy {

  public dataLoaded$: Observable<boolean>;
  public hasCollection: boolean;
  public hasDocument: boolean;
  public hasView: boolean;
  public query: QueryModel;

  private subscriptions = new Subscription();

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeDataInfo();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public hasData(): boolean {
    return this.hasCollection || this.hasView || this.hasDocument;
  }

  private subscribeDataInfo() {
    this.dataLoaded$ = observableCombineLatest(this.store.select(selectCollectionsLoaded),
      this.store.select(selectViewsLoaded),
      this.store.select(selectCurrentQueryLoaded)
    ).pipe(
      map(([collectionsLoaded, viewLoaded, documentsLoaded]) => collectionsLoaded && viewLoaded && documentsLoaded)
    );

    const querySubscription = this.store.select(selectQuery).pipe(
      filter(query => !!query),
      tap(query => this.loadDocument(query))
    ).subscribe(query => this.query = query);
    this.subscriptions.add(querySubscription);

    const collectionSubscription = this.store.select(selectCollectionsByQuery).pipe(
      map(collections => collections && collections.length > 0)
    ).subscribe(hasCollection => this.hasCollection = hasCollection);
    this.subscriptions.add(collectionSubscription);

    const viewsSubscription = this.store.select(selectViewsByQuery).pipe(
      map(views => views && views.length > 0)
    ).subscribe(hasView => this.hasView = hasView);
    this.subscriptions.add(viewsSubscription);

    const documentSubscription = this.store.select(selectDocumentsByQuery).pipe(
      map(documents => documents && documents.length > 0)
    ).subscribe(hasDocument => this.hasDocument = hasDocument);
    this.subscriptions.add(documentSubscription);
  }

  private loadDocument(query: QueryModel) {
    const querySingleDocument = {...query, page: 0, pageSize: 1};
    this.store.dispatch(new DocumentsAction.Get({query: querySingleDocument}));
  }

}
