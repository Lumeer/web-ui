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
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {map} from 'rxjs/operators';
import {ChartConfig} from '../../../core/store/chart/chart.model';
import {selectChartConfig} from '../../../core/store/chart/chart.state';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss']
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {

  public documents$: Observable<DocumentModel[]>;
  public collection$: Observable<CollectionModel>;
  public config$: Observable<ChartConfig>;

  public query: QueryModel;

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery))
      .subscribe(query => {
        this.query = query;
        this.fetchDocuments();
      });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments() {
    this.store$.dispatch(new DocumentsAction.Get({query: this.query}));
  }

  private subscribeData() {
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.collection$ = this.store$.pipe(select(selectCollectionsByQuery),
      map(collections => collections[0]));
    this.config$ = this.store$.pipe(select(selectChartConfig));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

}
