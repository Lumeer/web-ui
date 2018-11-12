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
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {map, take} from 'rxjs/operators';
import {ChartConfig, ChartType, DEFAULT_CHART_ID} from '../../../core/store/charts/chart.model';
import {selectChartConfig} from '../../../core/store/charts/charts.state';
import {ViewModel} from '../../../core/store/views/view.model';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {ChartAction} from '../../../core/store/charts/charts.action';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {
  public documents$: Observable<DocumentModel[]>;
  public collection$: Observable<CollectionModel>;
  public config$: Observable<ChartConfig>;
  public currentView$: Observable<ViewModel>;

  public query$ = new BehaviorSubject<QueryModel>(null);

  private chartId = DEFAULT_CHART_ID;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initChart();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchDocuments(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: QueryModel) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private initChart() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        take(1)
      )
      .subscribe(view => {
        const config = (view && view.config && view.config.chart) || this.createDefaultConfig();
        const chart = {id: this.chartId, config};
        this.store$.dispatch(new ChartAction.AddChart({chart}));
      });
    this.subscriptions.add(subscription);
  }

  private createDefaultConfig(): ChartConfig {
    return {type: ChartType.Line, axes: {}};
  }

  private subscribeData() {
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.collection$ = this.store$.pipe(
      select(selectCollectionsByQuery),
      map(collections => collections[0])
    );
    this.config$ = this.store$.pipe(select(selectChartConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new ChartAction.RemoveChart({chartId: this.chartId}));
  }

  public onConfigChanged(config: ChartConfig) {
    this.store$.dispatch(new ChartAction.SetConfig({chartId: this.chartId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }
}
