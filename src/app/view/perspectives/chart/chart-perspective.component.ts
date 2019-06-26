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
import {BehaviorSubject, combineLatest, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {
  selectCollectionsByQuery,
  selectDocumentsByQuery,
  selectLinkInstancesByQuery,
  selectLinkTypesByQuery,
} from '../../../core/store/common/permissions.selectors';
import {Collection} from '../../../core/store/collections/collection';
import {distinctUntilChanged, mergeMap, take, withLatestFrom} from 'rxjs/operators';
import {ChartConfig, DEFAULT_CHART_ID} from '../../../core/store/charts/chart';
import {selectChartById, selectChartConfig} from '../../../core/store/charts/charts.state';
import {User} from '../../../core/store/users/user';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {View, ViewConfig} from '../../../core/store/views/view';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
import {ChartAction} from '../../../core/store/charts/charts.action';
import {Query} from '../../../core/store/navigation/query';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionsPermissionsPipe} from '../../../shared/pipes/permissions/collections-permissions.pipe';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {ChartDataComponent} from './data/chart-data.component';
import * as PlotlyJS from 'plotly.js';
import * as CSLocale from 'plotly.js/lib/locales/cs.js';
import {ViewsAction} from '../../../core/store/views/views.action';
import {chartConfigIsEmpty, checkOrTransformChartConfig} from './visualizer/chart-util';

@Component({
  selector: 'chart-perspective',
  templateUrl: './chart-perspective.component.html',
  styleUrls: ['./chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPerspectiveComponent implements OnInit, OnDestroy {
  @ViewChild(ChartDataComponent, {static: false})
  public chartDataComponent: ChartDataComponent;

  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public linkTypes$: Observable<LinkType[]>;
  public linkInstances$: Observable<LinkInstance[]>;
  public config$: Observable<ChartConfig>;
  public currentView$: Observable<View>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public users$: Observable<User[]>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);

  private chartId = DEFAULT_CHART_ID;
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private collectionsPermissionsPipe: CollectionsPermissionsPipe) {}

  public ngOnInit() {
    (PlotlyJS as any).register(CSLocale);
    this.initChart();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
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
        withLatestFrom(this.store$.pipe(select(selectChartById(this.chartId)))),
        withLatestFrom(this.store$.pipe(select(selectSidebarOpened)))
      )
      .subscribe(([[view, chart], sidebarOpened]) => {
        if (chart) {
          this.refreshChart(view && view.config);
        } else {
          this.createChart(view, sidebarOpened);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshChart(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.chart) {
      this.store$.dispatch(new ChartAction.SetConfig({chartId: this.chartId, config: viewConfig.chart}));
    }
  }

  private createChart(view: View, sidebarOpened: boolean) {
    combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesByQuery)),
    ])
      .pipe(take(1))
      .subscribe(([query, collections, linkTypes]) => {
        const config = checkOrTransformChartConfig(
          view && view.config && view.config.chart,
          query,
          collections,
          linkTypes
        );
        const chart = {id: this.chartId, config};
        this.store$.dispatch(new ChartAction.AddChart({chart}));
        this.setupSidebar(view, config, sidebarOpened);
      });
  }

  private setupSidebar(view: View, config: ChartConfig, opened: boolean) {
    if (!view || chartConfigIsEmpty(config)) {
      this.sidebarOpened$.next(true);
    } else {
      this.sidebarOpened$.next(opened);
    }
  }

  private subscribeData() {
    this.documents$ = this.store$.pipe(
      select(selectDocumentsByQuery),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesByQuery));
    this.linkInstances$ = this.store$.pipe(select(selectLinkInstancesByQuery));
    this.permissions$ = this.collections$.pipe(
      mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );

    this.config$ = this.store$.pipe(select(selectChartConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.users$ = this.store$.pipe(select(selectAllUsers));
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

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public onSidebarToggle() {
    this.chartDataComponent && this.chartDataComponent.resize();

    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }
}
