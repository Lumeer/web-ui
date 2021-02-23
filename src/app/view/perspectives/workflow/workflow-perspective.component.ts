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
import {Observable} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectDocumentsAndLinksByQuerySorted} from '../../../core/store/common/permissions.selectors';
import {Query} from '../../../core/store/navigation/query/query';
import {map} from 'rxjs/operators';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ViewConfig} from '../../../core/store/views/view';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectPanelWidth} from '../../../core/store/views/views.state';
import {WorkflowConfig} from '../../../core/store/workflows/workflow';
import {selectWorkflowById, selectWorkflowSelectedDocumentId} from '../../../core/store/workflows/workflow.state';
import {checkOrTransformWorkflowConfig} from '../../../core/store/workflows/workflow.utils';
import {WorkflowsAction} from '../../../core/store/workflows/workflows.action';
import {ViewsAction} from '../../../core/store/views/views.action';
import {selectCollectionsPermissions} from '../../../core/store/user-permissions/user-permissions.state';
import {PerspectiveComponent} from '../perspective.component';

@Component({
  selector: 'workflow-perspective',
  templateUrl: './workflow-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block h-100'},
})
export class WorkflowPerspectiveComponent extends PerspectiveComponent<WorkflowConfig> implements OnInit, OnDestroy {
  public permissions$: Observable<Record<string, AllowedPermissions>>;
  public selectedDocumentId$: Observable<string>;
  public panelWidth$: Observable<number>;

  constructor(protected store$: Store<AppState>) {
    super(store$);
  }

  public ngOnInit() {
    super.ngOnInit();
    this.subscribeAdditionalData();
  }

  public checkOrTransformConfig(
    config: WorkflowConfig,
    query: Query,
    collections: Collection[],
    linkTypes: LinkType[]
  ): WorkflowConfig {
    return checkOrTransformWorkflowConfig(config, query, collections, linkTypes);
  }

  public subscribeConfig$(perspectiveId: string): Observable<WorkflowConfig> {
    return this.store$.pipe(
      select(selectWorkflowById(perspectiveId)),
      map(entity => entity?.config)
    );
  }

  public getConfig(viewConfig: ViewConfig): WorkflowConfig {
    return viewConfig?.workflow;
  }

  public configChanged(perspectiveId: string, config: WorkflowConfig) {
    this.store$.dispatch(new WorkflowsAction.AddWorkflow({workflow: {id: perspectiveId, config}}));
  }

  public subscribeDocumentsAndLinks$(): Observable<{documents: DocumentModel[]; linkInstances: LinkInstance[]}> {
    return this.store$.pipe(select(selectDocumentsAndLinksByQuerySorted));
  }

  public subscribeAdditionalData() {
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));
    this.selectedDocumentId$ = this.store$.pipe(select(selectWorkflowSelectedDocumentId));
    this.panelWidth$ = this.store$.pipe(select(selectPanelWidth));
  }

  public onConfigChanged(config: WorkflowConfig) {
    this.store$.dispatch(new WorkflowsAction.SetConfig({workflowId: this.perspectiveId$.value, config}));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
    this.onCloseSidebar();
  }

  public onCloseSidebar() {
    this.store$.dispatch(new WorkflowsAction.ResetOpenedDocument());
  }

  public setSidebarWidth(width: number) {
    this.store$.dispatch(new ViewsAction.SetPanelWidth({width}));
  }
}
