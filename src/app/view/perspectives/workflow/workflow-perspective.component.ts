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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {Observable} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {Query} from '../../../core/store/navigation/query/query';
import {map, switchMap} from 'rxjs/operators';
import {ViewConfig} from '../../../core/store/views/view';
import {LinkType} from '../../../core/store/link-types/link.type';
import {selectPanelWidth} from '../../../core/store/views/views.state';
import {WorkflowConfig} from '../../../core/store/workflows/workflow';
import {selectWorkflowById, selectWorkflowSelectedDocumentId} from '../../../core/store/workflows/workflow.state';
import {checkOrTransformWorkflowConfig} from '../../../core/store/workflows/workflow.utils';
import {WorkflowsAction} from '../../../core/store/workflows/workflows.action';
import {ViewsAction} from '../../../core/store/views/views.action';
import {DataPerspectiveDirective} from '../data-perspective.directive';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {defaultWorkflowPerspectiveConfiguration, WorkflowPerspectiveConfiguration} from '../perspective-configuration';
import {generateId} from '../../../shared/utils/resource.utils';

@Component({
  selector: 'workflow-perspective',
  templateUrl: './workflow-perspective.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block h-100'},
})
export class WorkflowPerspectiveComponent
  extends DataPerspectiveDirective<WorkflowConfig>
  implements OnInit, OnDestroy
{
  @Input()
  public perspectiveConfiguration: WorkflowPerspectiveConfiguration = defaultWorkflowPerspectiveConfiguration;

  public selectedDocument$: Observable<DocumentModel>;
  public selectedCollection$: Observable<Collection>;
  public panelWidth$: Observable<number>;
  public workflowId = generateId();

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

  public subscribeAdditionalData() {
    this.panelWidth$ = this.store$.pipe(select(selectPanelWidth));
    this.selectedDocument$ = this.store$.pipe(
      select(selectWorkflowSelectedDocumentId(this.workflowId)),
      switchMap(documentId => this.store$.pipe(select(selectDocumentById(documentId))))
    );
    this.selectedCollection$ = this.selectedDocument$.pipe(
      switchMap(document => this.store$.pipe(select(selectCollectionById(document?.collectionId))))
    );
  }

  public onConfigChanged(config: WorkflowConfig) {
    this.store$.dispatch(new WorkflowsAction.SetConfig({workflowId: this.perspectiveId$.value, config}));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
    this.onCloseSidebar();
  }

  public onCloseSidebar() {
    this.store$.dispatch(new WorkflowsAction.ResetOpenedDocument({workflowId: this.workflowId}));
  }

  public setSidebarWidth(width: number) {
    this.store$.dispatch(new ViewsAction.SetPanelWidth({width}));
  }
}
