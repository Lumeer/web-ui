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

import {AppState} from '../../../../core/store/app.state';
import {SearchService} from '../../../../core/rest';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {Subscription} from 'rxjs/Subscription';
import {skipWhile, tap} from 'rxjs/operators';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {CollectionsAction} from '../../../../core/store/collections/collections.action';
import {Observable} from 'rxjs/Observable';
import {selectDocumentsByQuery} from '../../../../core/store/documents/documents.state';
import {selectCollectionsByQuery} from '../../../../core/store/collections/collections.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {isNullOrUndefined} from 'util';
import {ViewModel} from '../../../../core/store/views/view.model';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {selectViewsByQuery} from '../../../../core/store/views/views.state';

@Component({
  templateUrl: './search-all.component.html'
})
export class SearchAllComponent implements OnInit, OnDestroy {

  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<CollectionModel[]>;
  public views$: Observable<ViewModel[]>;

  private querySubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.querySubscription = this.store.select(selectQuery)
      .pipe(
        skipWhile(query => isNullOrUndefined(query)),
        tap(query => this.store.dispatch(new DocumentsAction.Get({query}))),
        tap(query => this.store.dispatch(new CollectionsAction.Get({query}))),
        tap(query => this.store.dispatch(new ViewsAction.Get({query})))
      ).subscribe();
    this.documents$ = this.store.select(selectDocumentsByQuery);
    this.collections$ = this.store.select(selectCollectionsByQuery);
    this.views$ = this.store.select(selectViewsByQuery);
  }

  public ngOnDestroy() {
    if (this.querySubscription) {
      this.querySubscription.unsubscribe();
    }
  }

}
