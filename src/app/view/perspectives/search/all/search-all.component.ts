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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, switchMap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {
  selectAllViews,
  selectViewQuery,
  selectViewsByQuery,
  selectViewsLoaded
} from '../../../../core/store/views/views.state';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {Query} from '../../../../core/store/navigation/query/query';
import {StoreDataService} from '../../../../core/service/store-data.service';

@Component({
  templateUrl: './search-all.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAllComponent implements OnInit, OnDestroy {
  public dataLoaded$: Observable<boolean>;
  public hasCollection$: Observable<boolean>;
  public hasDocument$: Observable<boolean>;
  public hasView$: Observable<boolean>;
  public hasAnyView$: Observable<boolean>;
  public query$ = new BehaviorSubject<Query>(null);

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private storeDataService: StoreDataService) {}

  public ngOnInit() {
    this.subscribeDataInfo();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeDataInfo() {
    this.dataLoaded$ = combineLatest([
      this.store$.pipe(select(selectCollectionsLoaded)),
      this.store$.pipe(select(selectViewsLoaded)),
      this.store$.pipe(select(selectCurrentQueryDocumentsLoaded)),
    ]).pipe(
      map(([collectionsLoaded, viewLoaded, documentsLoaded]) => collectionsLoaded && viewLoaded && documentsLoaded)
    );

    const workspace$ = this.store$.pipe(select(selectWorkspace), distinctUntilChanged());

    const navigationSubscription = workspace$
      .pipe(
        switchMap(() => this.store$.pipe(select(selectViewQuery))),
        filter(query => !!query)
      )
      .subscribe(query => {
        this.query$.next(query);
        this.fetchDocuments(query);
      });
    this.subscriptions.add(navigationSubscription);

    this.hasCollection$ = this.storeDataService.selectCollectionsByQuery$().pipe(
      map(collections => collections?.length > 0)
    );

    this.hasView$ = this.store$.pipe(
      select(selectViewsByQuery),
      map(views => views?.length > 0)
    );

    this.hasAnyView$ = this.store$.pipe(
      select(selectAllViews),
      map(views => views?.length > 0)
    );

    this.hasDocument$ = this.storeDataService.selectDocumentsByQuery$().pipe(
      map(documents => documents?.length > 0)
    );
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }
}
