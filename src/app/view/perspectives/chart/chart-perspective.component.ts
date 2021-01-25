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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {
  selectCanManageViewConfig,
  selectCollectionsByQuery,
  selectDocumentsAndLinksByQuerySorted,
  selectLinkTypesInQuery,
} from '../../../core/store/common/permissions.selectors';
import {Collection} from '../../../core/store/collections/collection';
import {
  distinctUntilChanged,
  map,
  mergeMap,
  pairwise,
  startWith,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs/operators';
import {ChartConfig, DEFAULT_CHART_ID} from '../../../core/store/charts/chart';
import {selectChartById, selectChartConfig} from '../../../core/store/charts/charts.state';
import {View} from '../../../core/store/views/view';
import {selectCurrentView, selectSidebarOpened, selectViewQuery} from '../../../core/store/views/views.state';
import {ChartAction} from '../../../core/store/charts/charts.action';
import {Query} from '../../../core/store/navigation/query/query';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {ChartDataComponent} from './data/chart-data.component';
import {ViewsAction} from '../../../core/store/views/views.action';
import {checkOrTransformChartConfig} from './visualizer/chart-util';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {ConstraintData} from '@lumeer/data-filters';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {
  @ViewChild(ChartDataComponent)
  public chartDataComponent: ChartDataComponent;

  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public config$: Observable<ChartConfig>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);

  private chartId: string;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initChart();
    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectViewQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchData(query);
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private initChart() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({chartId, config}: {chartId?: string; config?: ChartConfig}) => {
        if (chartId) {
          this.chartId = chartId;
          this.store$.dispatch(new ChartAction.AddChart({chart: {id: chartId, config}}));
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{chartId?: string; config?: ChartConfig}> {
    const chartId = view.code;
    return this.store$.pipe(
      select(selectChartById(chartId)),
      take(1),
      mergeMap(chartEntity => {
        const chartConfig = view.config?.chart;
        if (preferViewConfigUpdate(previousView?.config?.chart, view?.config?.chart, !!chartEntity)) {
          return this.checkChartConfig(chartConfig).pipe(map(config => ({chartId, config})));
        }
        return of({chartId, config: chartEntity?.config || chartConfig});
      })
    );
  }

  private checkChartConfig(config: ChartConfig): Observable<ChartConfig> {
    return combineLatest([
      this.store$.pipe(select(selectViewQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformChartConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{chartId?: string; config?: ChartConfig}> {
    const chartId = DEFAULT_CHART_ID;
    return this.store$.pipe(
      select(selectViewQuery),
      withLatestFrom(this.store$.pipe(select(selectChartById(chartId)))),
      mergeMap(([, chart]) => this.checkChartConfig(chart?.config)),
      map(config => ({chartId, config}))
    );
  }

  private subscribeData() {
    this.documentsAndLinks$ = this.store$.pipe(
      select(selectDocumentsAndLinksByQuerySorted),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));

    this.config$ = this.store$.pipe(select(selectChartConfig));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onConfigChanged(config: ChartConfig) {
    this.store$.dispatch(new ChartAction.SetConfig({chartId: this.chartId, config}));
  }

  public patchDocumentData(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.PatchData({document}));
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public onSidebarToggle() {
    this.chartDataComponent?.resize();

    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  private setupSidebar() {
    this.store$
      .pipe(select(selectCurrentView), withLatestFrom(this.store$.pipe(select(selectSidebarOpened))), take(1))
      .subscribe(([currentView, sidebarOpened]) => this.openOrCloseSidebar(currentView, sidebarOpened));
  }

  private openOrCloseSidebar(view: View, opened: boolean) {
    if (view) {
      this.sidebarOpened$.next(opened);
    } else {
      this.sidebarOpened$.next(true);
    }
  }
}
