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

import {Collection, Document, View, Query} from '../../../../core/dto';
import {AppState} from '../../../../core/store/app.state';
import {SearchService} from '../../../../core/rest/search.service';
import {selectNavigation} from '../../../../core/store/navigation/navigation.state';
import {Subscription} from 'rxjs/Subscription';
import {map} from 'rxjs/operators';
import {DeprecatedQueryConverter} from '../../../../shared/utils/query-converter';

@Component({
  templateUrl: './search-all.component.html'
})
export class SearchAllComponent implements OnInit, OnDestroy {

  public documents: Document[];
  public collections: Collection[];
  public views: View[];

  private routerSubscription: Subscription;

  constructor(private searchService: SearchService,
              private store: Store<AppState>) {
  }

  public ngOnInit() {
    this.routerSubscription = this.store.select(selectNavigation).pipe(
      map(navigation => navigation.query),
      map(query => DeprecatedQueryConverter.removeLinksFromQuery(query))
    ).subscribe(query => {
      this.loadCollections(query);
      this.loadDocuments(query);
      this.loadViews(query);
    });
  }

  public ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  public isEmptySearch(): boolean {
    return this.documents && this.documents.length === 0
      && this.collections && this.collections.length === 0
      && this.views && this.views.length === 0;
  }

  private loadCollections(query: Query) {
    this.searchService.searchCollections(query)
      .subscribe(collections => this.collections = collections);
  }

  private loadDocuments(query: Query) {
    this.searchService.searchDocuments(query)
      .subscribe(documents => this.documents = documents);
  }

  private loadViews(query: Query) {
    this.searchService.searchViews(query)
      .subscribe(views => this.views = views);
  }

}
