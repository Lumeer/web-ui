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
import {Collection} from '../../../core/store/collections/collection';
import {
  selectCollectionsByQuery,
  selectDocumentsAndLinksByCustomQuery,
  selectLinkTypesByQuery,
} from '../../../core/store/common/permissions.selectors';
import {DocumentMetaData, DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query/query';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
import {distinctUntilChanged, mergeMap, take, withLatestFrom} from 'rxjs/operators';
import {View, ViewConfig} from '../../../core/store/views/view';
import {AppState} from '../../../core/store/app.state';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {DEFAULT_GANTT_CHART_ID, GanttChartConfig} from '../../../core/store/gantt-charts/gantt-chart';
import {selectGanttChartById, selectGanttChartConfig} from '../../../core/store/gantt-charts/gantt-charts.state';
import {GanttChartAction} from '../../../core/store/gantt-charts/gantt-charts.action';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {CollectionsPermissionsPipe} from '../../../shared/pipes/permissions/collections-permissions.pipe';
import {ViewsAction} from '../../../core/store/views/views.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {checkOrTransformGanttConfig, ganttConfigIsEmpty} from './util/gantt-chart-util';
import {ConstraintData} from '../../../core/model/data/constraint';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'gantt-chart-perspective',
  templateUrl: './gantt-chart-perspective.component.html',
  styleUrls: ['./gantt-chart-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartPerspectiveComponent implements OnInit, OnDestroy {
  public collections$: Observable<Collection[]>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public linkTypes$: Observable<LinkType[]>;
  public config$: Observable<GanttChartConfig>;
  public currentView$: Observable<View>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public constraintData$: Observable<ConstraintData>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);
  public ganttChartId = DEFAULT_GANTT_CHART_ID;

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private collectionsPermissionsPipe: CollectionsPermissionsPipe) {}

  public ngOnInit() {
    this.initGanttChart();
    this.subscribeToQuery();
    this.subscribeData();
  }

  private initGanttChart() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        withLatestFrom(this.store$.pipe(select(selectGanttChartById(this.ganttChartId)))),
        withLatestFrom(this.store$.pipe(select(selectSidebarOpened)))
      )
      .subscribe(([[view, ganttChart], sidebarOpened]) => {
        if (ganttChart) {
          this.refreshGanttChart(view && view.config);
        } else {
          this.createGanttChart(view, sidebarOpened);
        }
      });
    this.subscriptions.add(subscription);
  }

  private refreshGanttChart(viewConfig: ViewConfig) {
    if (viewConfig && viewConfig.ganttChart) {
      this.store$.dispatch(
        new GanttChartAction.SetConfig({ganttChartId: this.ganttChartId, config: viewConfig.ganttChart})
      );
    }
  }

  private createGanttChart(view: View, sidebarOpened: boolean) {
    combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesByQuery)),
    ])
      .pipe(take(1))
      .subscribe(([query, collections, linkTypes]) => {
        const config = checkOrTransformGanttConfig(
          view && view.config && view.config.ganttChart,
          query,
          collections,
          linkTypes
        );
        const ganttChart = {id: this.ganttChartId, config};
        this.store$.dispatch(new GanttChartAction.AddGanttChart({ganttChart}));
        this.setupSidebar(view, config, sidebarOpened);
      });
  }

  private setupSidebar(view: View, config: GanttChartConfig, opened: boolean) {
    if (!view || ganttConfigIsEmpty(config)) {
      this.sidebarOpened$.next(true);
    } else {
      this.sidebarOpened$.next(opened);
    }
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.fetchDocuments(query);
      this.query$.next(query);
      this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByCustomQuery(query, false, true)));
    });
    this.subscriptions.add(subscription);
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeData() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesByQuery));
    this.config$ = this.store$.pipe(select(selectGanttChartConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.permissions$ = this.collections$.pipe(
      mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
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

  public patchDocumentMetaData(payload: {collectionId: string; documentId: string; metaData: DocumentMetaData}) {
    this.store$.dispatch(new DocumentsAction.PatchMetaData(payload));
  }

  public onSidebarToggle() {
    const opened = !this.sidebarOpened$.getValue();
    this.store$.dispatch(new ViewsAction.SetSidebarOpened({opened}));
    this.sidebarOpened$.next(opened);
  }

  public patchLinkInstanceData(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.PatchData({linkInstance}));
  }

  public createDocument(document: DocumentModel) {
    this.store$.dispatch(new DocumentsAction.Create({document}));
  }
}
