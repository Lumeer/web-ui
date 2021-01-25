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
import {Collection} from '../../../core/store/collections/collection';
import {combineLatest, Observable, of, Subscription} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {
  selectCanManageViewConfig,
  selectCollectionsByQuery,
  selectDocumentsAndLinksByQuerySorted,
  selectLinkTypesInQuery,
} from '../../../core/store/common/permissions.selectors';
import {Query} from '../../../core/store/navigation/query/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {distinctUntilChanged, map, mergeMap, pairwise, startWith, switchMap, take, tap} from 'rxjs/operators';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {View, ViewSettings} from '../../../core/store/views/view';
import {selectViewSettings} from '../../../core/store/view-settings/view-settings.state';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectCurrentView, selectPanelWidth, selectViewQuery} from '../../../core/store/views/views.state';
import {DEFAULT_WORKFLOW_ID, WorkflowConfig} from '../../../core/store/workflows/workflow';
import {
  selectWorkflowById,
  selectWorkflowConfig,
  selectWorkflowSelectedDocumentId,
} from '../../../core/store/workflows/workflow.state';
import {checkOrTransformWorkflowConfig} from '../../../core/store/workflows/workflow.utils';
import {WorkflowsAction} from '../../../core/store/workflows/workflows.action';
import {preferViewConfigUpdate} from '../../../core/store/views/view.utils';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {ViewsAction} from '../../../core/store/views/views.action';
import {selectCurrentQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectCurrentQueryLinkInstancesLoaded} from '../../../core/store/link-instances/link-instances.state';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {ConstraintData} from '@lumeer/data-filters';

@Component({
  selector: 'workflow-perspective',
  templateUrl: './workflow-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block h-100'},
})
export class WorkflowPerspectiveComponent implements OnInit, OnDestroy {
  public collections$: Observable<Collection[]>;
  public documentsAndLinks$: Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}>;
  public dataLoaded$: Observable<boolean>;
  public linkTypes$: Observable<LinkType[]>;
  public canManageConfig$: Observable<boolean>;
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public query$: Observable<Query>;
  public viewSettings$: Observable<ViewSettings>;
  public config$: Observable<WorkflowConfig>;
  public constraintData$: Observable<ConstraintData>;
  public selectedDocumentId$: Observable<string>;
  public panelWidth$: Observable<number>;

  private subscriptions = new Subscription();
  private workflowId: string;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initWorkflow();
    this.subscribeData();
  }

  private initWorkflow() {
    const subscription = this.store$
      .pipe(
        select(selectCurrentView),
        startWith(null as View),
        pairwise(),
        switchMap(([previousView, view]) =>
          view ? this.subscribeToView(previousView, view) : this.subscribeToDefault()
        )
      )
      .subscribe(({workflowId, config}: {workflowId?: string; config?: WorkflowConfig}) => {
        if (workflowId) {
          this.workflowId = workflowId;
          this.store$.dispatch(new WorkflowsAction.AddWorkflow({workflow: {id: workflowId, config}}));
        }
      });
    this.subscriptions.add(subscription);
  }

  private subscribeToView(previousView: View, view: View): Observable<{workflowId?: string; config?: WorkflowConfig}> {
    const workflowId = view.code;
    return this.store$.pipe(
      select(selectWorkflowById(workflowId)),
      take(1),
      mergeMap(workflowEntity => {
        const workflowConfig = view.config?.workflow;
        if (preferViewConfigUpdate(previousView?.config?.workflow, view?.config?.workflow, !!workflowEntity)) {
          return this.checkWorkflowConfig(workflowConfig).pipe(map(config => ({workflowId, config})));
        }
        return of({workflowId: workflowId, config: workflowEntity?.config || workflowConfig});
      })
    );
  }

  private checkWorkflowConfig(config: WorkflowConfig): Observable<WorkflowConfig> {
    return combineLatest([
      this.store$.pipe(select(selectViewQuery)),
      this.store$.pipe(select(selectCollectionsByQuery)),
      this.store$.pipe(select(selectLinkTypesInQuery)),
    ]).pipe(
      take(1),
      map(([query, collections, linkTypes]) => checkOrTransformWorkflowConfig(config, query, collections, linkTypes))
    );
  }

  private subscribeToDefault(): Observable<{workflowId?: string; config: WorkflowConfig}> {
    return this.store$.pipe(
      select(selectWorkflowById(DEFAULT_WORKFLOW_ID)),
      take(1),
      mergeMap(workflow => this.checkWorkflowConfig(workflow?.config)),
      map(config => ({workflowId: DEFAULT_WORKFLOW_ID, config}))
    );
  }

  public subscribeData() {
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesInQuery));
    this.canManageConfig$ = this.store$.pipe(select(selectCanManageViewConfig));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.documentsAndLinks$ = this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
    this.query$ = this.store$.pipe(
      select(selectViewQuery),
      tap(query => this.fetchData(query))
    );
    this.viewSettings$ = this.store$.pipe(select(selectViewSettings));
    this.config$ = this.store$.pipe(select(selectWorkflowConfig));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.selectedDocumentId$ = this.store$.pipe(select(selectWorkflowSelectedDocumentId));
    this.panelWidth$ = this.store$.pipe(select(selectPanelWidth));
    this.dataLoaded$ = combineLatest([
      this.store$.pipe(select(selectCurrentQueryDocumentsLoaded)),
      this.store$.pipe(select(selectCurrentQueryLinkInstancesLoaded)),
    ]).pipe(
      map(loaded => loaded.every(load => load)),
      distinctUntilChanged()
    );
  }

  private fetchData(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query}));
    this.store$.dispatch(new LinkInstancesAction.Get({query}));
  }

  public onConfigChanged(config: WorkflowConfig) {
    if (this.workflowId) {
      this.store$.dispatch(new WorkflowsAction.SetConfig({workflowId: this.workflowId, config}));
    }
  }

  public ngOnDestroy() {
    this.onCloseSidebar();
  }

  public onCloseSidebar() {
    this.store$.dispatch(new WorkflowsAction.ResetOpenedDocument());
  }

  public setSidebarWidth(width: number) {
    this.store$.dispatch(new ViewsAction.SetPanelWidth({width}));
  }
}
