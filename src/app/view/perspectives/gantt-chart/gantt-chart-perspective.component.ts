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
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {CollectionModel} from '../../../core/store/collections/collection.model';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../core/store/common/permissions.selectors';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {QueryModel} from '../../../core/store/navigation/query.model';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {map, take} from 'rxjs/operators';

import {ViewModel} from "../../../core/store/views/view.model";
import {AppState} from "../../../core/store/app.state";
import {DocumentsAction} from "../../../core/store/documents/documents.action";
import {DEFAULT_GANTT_CHART_ID, GanttChartConfig, GanttChartMode} from "../../../core/store/gantt-charts/gantt-chart.model";
import {selectGanttChartConfig} from "../../../core/store/gantt-charts/gantt-charts.state";
import {GanttChartAction} from "../../../core/store/gantt-charts/gantt-charts.action";

@Component({
  selector: 'gantt-chart-perspective',
  templateUrl: './gantt-chart-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GanttChartPerspectiveComponent implements OnInit, OnDestroy {

  public documents$: Observable<DocumentModel[]>;
  public collection$: Observable<CollectionModel>;
  public config$: Observable<GanttChartConfig>;
  public currentView$: Observable<ViewModel>;

  public query$ = new BehaviorSubject<QueryModel>(null);

  private ganttChartId = DEFAULT_GANTT_CHART_ID;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {
  }

  public ngOnInit() {
    this.initGanttChart();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery))
      .subscribe(query => {
        this.query$.next(query);
        this.fetchDocuments(query);
      });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: QueryModel) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
  }

  private initGanttChart() {
    const subscription = this.store$.pipe(select(selectCurrentView),
      take(1))
      .subscribe(view => {
        const config = view && view.config && view.config.ganttChart || this.createDefaultConfig();
        const ganttChart = {id: this.ganttChartId, config};
        this.store$.dispatch(new GanttChartAction.AddGanttChart({ganttChart}));
      });
    this.subscriptions.add(subscription);
  }

  private createDefaultConfig(): GanttChartConfig {
    return {mode: GanttChartMode.Day, bars: {}};
  }

  private subscribeData() {
    this.documents$ = this.store$.pipe(select(selectDocumentsByQuery));
    this.collection$ = this.store$.pipe(select(selectCollectionsByQuery),
      map(collections => collections[0]));
    this.config$ = this.store$.pipe(select(selectGanttChartConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.store$.dispatch(new GanttChartAction.RemoveGanttChart({ganttChartId: this.ganttChartId}));
  }

  public onConfigChanged(config: GanttChartConfig) {
    this.store$.dispatch(new GanttChartAction.SetConfig({ganttChartId: this.ganttChartId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  // private showGantt() {
  //
  //   // console.log(this.collections$.)
  //
  //   const tasks = [
  //     {
  //       start: '2018-10-01',
  //       end: '2018-10-08',
  //       name: 'Redesign website',
  //       id: 'Task 0',
  //       progress: 20
  //     },
  //     {
  //       start: '2018-10-03',
  //       end: '2018-10-06',
  //       name: 'Write new content',
  //       id: 'Task 1',
  //       progress: 5,
  //       dependencies: 'Task 0'
  //     },
  //     {
  //       start: '2018-10-04',
  //       end: '2018-10-08',
  //       name: 'Apply new styles',
  //       id: 'Task 2',
  //       progress: 10,
  //       dependencies: 'Task 1'
  //     },
  //     {
  //       start: '2018-10-08',
  //       end: '2018-10-09',
  //       name: 'Review',
  //       id: 'Task 3',
  //       progress: 5,
  //       dependencies: 'Task 2'
  //     },
  //     {
  //       start: '2018-10-08',
  //       end: '2018-10-10',
  //       name: 'Deploy',
  //       id: 'Task 4',
  //       progress: 0,
  //       dependencies: 'Task 2'
  //     },
  //     {
  //       start: '2018-10-11',
  //       end: '2018-10-11',
  //       name: 'Go Live!',
  //       id: 'Task 5',
  //       progress: 0,
  //       dependencies: 'Task 4',
  //       custom_class: 'bar-milestone'
  //     },
  //     {
  //       start: '2014-01-05',
  //       end: '2019-10-12',
  //       name: 'Long term task',
  //       id: 'Task 6',
  //       progress: 0
  //     }
  //   ];
  //
  //   //const because of push (let and var are rejected)
  //   const gantt_chart = new frappeGantt.default('.gantt-target', tasks, {
  //     // console logs are forbidden for push
  //     /*on_click: function (task) {
  //       console.log(task);
  //     },
  //     on_date_change: function(task, start, end) {
  //       console.log(task, start, end);
  //     },
  //     on_progress_change: function(task, progress) {
  //       console.log(task, progress);
  //     },
  //     on_view_change: function(mode) {
  //       console.log(mode);
  //     },*/
  //     view_mode: 'Month',
  //     language: 'en'
  //   });
  //  // console.log(gantt_chart);
  //
  //
  //
  // }


}
