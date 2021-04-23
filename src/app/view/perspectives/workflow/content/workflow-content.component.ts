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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import {ViewSettings} from '../../../../core/store/views/view';
import {Query} from '../../../../core/store/navigation/query/query';
import {AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {WorkflowConfig} from '../../../../core/store/workflows/workflow';
import {checkOrTransformWorkflowConfig} from '../../../../core/store/workflows/workflow.utils';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {ConstraintData} from '@lumeer/data-filters';
import {WorkflowTablesService} from './tables/service/workflow-tables.service';
import {WorkflowTablesStateService} from './tables/service/workflow-tables-state.service';
import {WorkflowTablesMenuService} from './tables/service/workflow-tables-menu.service';
import {WorkflowTablesDataService} from './tables/service/workflow-tables-data.service';
import {WorkflowTablesKeyboardService} from './tables/service/workflow-tables-keyboard.service';

@Component({
  selector: 'workflow-content',
  templateUrl: './workflow-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    WorkflowTablesService,
    WorkflowTablesMenuService,
    WorkflowTablesDataService,
    WorkflowTablesStateService,
    WorkflowTablesKeyboardService,
  ],
})
export class WorkflowContentComponent implements OnChanges {
  @Input()
  public viewSettings: ViewSettings;

  @Input()
  public query: Query;

  @Input()
  public permissions: AllowedPermissionsMap;

  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: WorkflowConfig;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public selectedDocument: DocumentModel;

  @Input()
  public selectedCollection: Collection;

  @Input()
  public sidebarWidth: number;

  @Input()
  public dataLoaded: boolean;

  @Output()
  public configChange = new EventEmitter<WorkflowConfig>();

  @Output()
  public closeSidebar = new EventEmitter();

  @Output()
  public sidebarResize = new EventEmitter<number>();

  public ngOnChanges(changes: SimpleChanges) {
    this.checkConfig();
  }

  private checkConfig() {
    const previousConfig = {...this.config};
    this.config = checkOrTransformWorkflowConfig(this.config, this.query, this.collections, this.linkTypes);
    if (!deepObjectsEquals(previousConfig, this.config)) {
      this.configChange.emit(this.config);
    }
  }
}
