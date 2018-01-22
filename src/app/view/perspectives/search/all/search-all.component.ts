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
import {filter, map, skipWhile, tap} from 'rxjs/operators';
import {Subscription} from 'rxjs/Subscription';
import {isNullOrUndefined} from 'util';
import {SearchService} from '../../../../core/rest';

import {AppState} from '../../../../core/store/app.state';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {selectCollectionsByQuery} from '../../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectDocumentsByQuery} from '../../../../core/store/documents/documents.state';
import {NavigationState, selectNavigation, selectQuery} from '../../../../core/store/navigation/navigation.state';
import {ViewModel} from '../../../../core/store/views/view.model';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {selectViewsByQuery} from '../../../../core/store/views/views.state';

@Component({
  templateUrl: './search-all.component.html',
  styleUrls: ['./search-all.component.scss']
})
export class SearchAllComponent implements OnInit, OnDestroy {

  public collections: CollectionModel[];

  public documents: DocumentModel[];

  public views: ViewModel[];

  private querySubscription: Subscription;

  private collectionsSubscription: Subscription;

  private documentsSubscription: Subscription;

  private viewsSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.querySubscription = this.store.select(selectNavigation)
      .pipe(
        filter((navigation: NavigationState) => Boolean(navigation.workspace.organizationCode && navigation.workspace.projectCode)),
        map(navigation => navigation.query),
        filter(query => !isNullOrUndefined(query)),
        tap(query => this.store.dispatch(new CollectionsAction.Get({query}))),
        tap(query => this.store.dispatch(new DocumentsAction.Get({query}))),
        tap(query => this.store.dispatch(new ViewsAction.Get({query})))
      ).subscribe();

    this.collectionsSubscription = this.store.select(selectCollectionsByQuery).subscribe(collections => {
      this.collections = collections;
    });

    this.documentsSubscription = this.store.select(selectDocumentsByQuery).subscribe(documents => {
      this.documents = documents;
    });

    this.viewsSubscription = this.store.select(selectViewsByQuery).subscribe(views => {
      this.views = views;
    });
  }

  public loading(): boolean {
    return Boolean(!this.collections || !this.documents || !this.views);
  }

  public emptySearch(): boolean {
    return Boolean(
      this.collections.length === 0 &&
      this.documents.length === 0 &&
      this.views.length === 0
    );
  }

  public ngOnDestroy() {
    const subscriptions = [this.querySubscription, this.documentsSubscription, this.collectionsSubscription, this.viewsSubscription];
    this.unsubscribeAllIfPresent(subscriptions);
  }

  private unsubscribeAllIfPresent(subscriptions: Subscription[]) {
    subscriptions.forEach(this.unsubscribeIfPresent);
  }

  private unsubscribeIfPresent(subscription: Subscription) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

}
