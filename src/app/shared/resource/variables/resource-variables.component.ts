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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Resource} from '../../../core/model/resource';
import {ResourceType} from '../../../core/model/resource-type';
import {ResourceVariable} from '../../../core/store/resource-variables/resource-variable';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import * as ResourceVariableActions from '../../../core/store/resource-variables/resource-variables.actions';
import {Observable} from 'rxjs';
import {objectChanged} from '../../utils/common.utils';
import {selectResourceVariablesByResourceType} from '../../../core/store/resource-variables/resource-variables.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {take} from 'rxjs/operators';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Project} from '../../../core/store/projects/project';

@Component({
  selector: 'resource-variables',
  templateUrl: './resource-variables.component.html',
  styleUrls: ['./resource-variables.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceVariablesComponent implements OnChanges {
  @Input()
  public resource: Resource;

  @Input()
  public resourceType: ResourceType;

  public variables$: Observable<ResourceVariable[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (objectChanged(changes.resource) || changes.resourceType) {
      this.observeVariables();
    }
  }

  private observeVariables() {
    this.variables$ = this.store$.pipe(
      select(selectResourceVariablesByResourceType(this.resource?.id, this.resourceType))
    );

    let workspace: Workspace = {};
    switch (this.resourceType) {
      case ResourceType.Organization:
        workspace = {organizationId: this.resource?.id};
        break;
      case ResourceType.Project:
        const project = <Project>this.resource;
        workspace = {organizationId: project.organizationId, projectId: project.id};
        break;
    }
    this.store$.dispatch(ResourceVariableActions.get({workspace}));
  }

  public onDelete(variable: ResourceVariable) {
    this.store$.dispatch(ResourceVariableActions.deleteConfirm({variable}));
  }

  public onChange(variable: ResourceVariable) {
    this.store$.dispatch(ResourceVariableActions.update({variable}));
  }

  public onAddVariable(variable: ResourceVariable) {
    this.store$.pipe(select(selectWorkspaceWithIds), take(1)).subscribe(workspace => {
      this.store$.dispatch(
        ResourceVariableActions.create({variable: this.addWorkspaceToVariable(variable, workspace)})
      );
    });
  }

  private addWorkspaceToVariable(variable: ResourceVariable, workspace: Workspace): ResourceVariable {
    switch (this.resourceType) {
      case ResourceType.Organization:
        return variable;
      case ResourceType.Project:
        return {...variable, organizationId: workspace.organizationId};
      default:
        return {...variable, organizationId: workspace.organizationId, projectId: workspace.projectId};
    }
  }
}
