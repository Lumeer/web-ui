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
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {Collection} from '../../../core/store/collections/collection';
import {
  selectCollectionsByQuery,
  selectDocumentsAndLinksByCustomQuery,
  selectLinkTypesInQuery,
} from '../../../core/store/common/permissions.selectors';
import {DocumentMetaData, DocumentModel} from '../../../core/store/documents/document.model';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {Query} from '../../../core/store/navigation/query/query';
import {selectCurrentView, selectSidebarOpened} from '../../../core/store/views/views.state';
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
import {View} from '../../../core/store/views/view';
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
import {checkOrTransformGanttConfig} from './util/gantt-chart-util';
import {ConstraintData} from '../../../core/model/data/constraint';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {selectCurrentQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectCurrentQueryLinkInstancesLoaded} from '../../../core/store/link-instances/link-instances.state';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';

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
  public dataLoaded$: Observable<boolean>;

  public sidebarOpened$ = new BehaviorSubject(false);
  public query$ = new BehaviorSubject<Query>(null);
  public ganttChartId: string;

  private subscriptions = new Subscription();

  constructor(
    private store$: Store<AppState>,
    private collectionsPermissionsPipe: CollectionsPermissionsPipe,
    private i18n: I18n
  ) {}

  public ngOnInit() {
    this.initGanttChart();
    this.subscribeToQuery();
    this.subscribeData();
    this.setupSidebar();
  }

  private initGanttChart() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({ganttChartId, config}: {ganttChartId?: string; config?: GanttChartConfig}) => {
        if (ganttChartId) {
          this.ganttChartId = ganttChartId;
          this.store$.dispatch(new GanttChartAction.AddGanttChart({ganttChart: {id: ganttChartId, config}}));
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(
    previousView: View,
    view: View
  ): Observable<{ganttChartId?: string; config?: GanttChartConfig}> {
    const ganttChartId = view.code;
    return this.store$.pipe(
      select(selectGanttChartById(ganttChartId)),
      take(1),
      mergeMap(ganttEntity => {
        const ganttConfig = view.config && view.config.ganttChart;
        if (preferViewConfigUpdate(previousView, view, !!ganttEntity)) {
          return this.checkGanttConfig(ganttConfig).pipe(map(config => ({ganttChartId, config})));
        }
        return of({ganttChartId, config: ganttEntity?.config || ganttConfig});
      })
    );
  }

  private checkGanttConfig(config: GanttChartConfig): Observable<GanttChartConfig> {
    return combineLatest([
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformGanttConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{ganttChartId?: string; config?: GanttChartConfig}> {
    const ganttChartId = DEFAULT_GANTT_CHART_ID;
    return this.store$.pipe(
      select(selectQuery),
      withLatestFrom(this.store$.pipe(select(selectGanttChartById(ganttChartId)))),
      mergeMap(([, gantt]) => this.checkGanttConfig(gantt?.config)),
      map(config => ({ganttChartId, config}))
    );
  }

  private subscribeToQuery() {
    const subscription = this.store$.pipe(select(selectQuery)).subscribe(query => {
      this.query$.next(query);
      this.fetchData(query);
      this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByCustomQuery(query, false, true)));
    });
    this.subscriptions.add(subscription);
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  private subscribeData() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.config$ = this.store$.pipe(select(selectGanttChartConfig));
    this.currentView$ = this.store$.pipe(select(selectCurrentView));
    this.permissions$ = this.collections$.pipe(
      mergeMap(collections => this.collectionsPermissionsPipe.transform(collections)),
      distinctUntilChanged((x, y) => deepObjectsEquals(x, y))
    );
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.dataLoaded$ = combineLatest([
      this.store$.pipe(select(selectCurrentQueryDocumentsLoaded)),
      this.store$.pipe(select(selectCurrentQueryLinkInstancesLoaded)),
    ]).pipe(map(loaded => loaded.every(load => load)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onConfigChanged(config: GanttChartConfig) {
    if (this.ganttChartId) {
      this.store$.dispatch(new GanttChartAction.SetConfig({ganttChartId: this.ganttChartId, config}));
    }
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

  public updateLinkDocuments(payload: {linkInstanceId: string; documentIds: [string, string]}) {
    this.store$.dispatch(new LinkInstancesAction.ChangeDocuments(payload));
  }

  public createDocumentsChain(data: {documents: DocumentModel[]; linkInstances: LinkInstance[]}) {
    const failureMessage = this.i18n({id: '@@perspective.gantt.create.task.failure', value: 'Could not create task'});
    this.store$.dispatch(new DocumentsAction.CreateChain({...data, failureMessage}));
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
