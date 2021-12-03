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

import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {ResourceVariable} from './resource-variable';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {selectWorkspaceWithIds} from '../common/common.selectors';
import {ResourceType} from '../../model/resource-type';

export interface ResourceVariablesState extends EntityState<ResourceVariable> {
  loadedProjects: string[];
}

export const resourceVariablesAdapter: EntityAdapter<ResourceVariable> = createEntityAdapter<ResourceVariable>({
  selectId: variable => variable.id,
});

export const initialResourceVariablesState: ResourceVariablesState = resourceVariablesAdapter.getInitialState({
  loadedProjects: [],
});

export const selectResourceVariablesState = (state: AppState) => state.variables;

export const selectResourceVariablesLoadedProjects = createSelector(
  selectResourceVariablesState,
  state => state.loadedProjects
);

export const selectAllResourceVariables = createSelector(
  selectResourceVariablesState,
  resourceVariablesAdapter.getSelectors().selectAll
);

export const selectResourceVariablesDictionary = createSelector(
  selectResourceVariablesState,
  resourceVariablesAdapter.getSelectors().selectEntities
);

export const selectResourceVariablesByResourceType = (resourceId: string, resourceType: ResourceType) =>
  createSelector(selectWorkspaceWithIds, selectAllResourceVariables, (workspace, variables) => {
    switch (resourceType) {
      case ResourceType.Organization:
        return variables.filter(
          variable => variable.resourceType === ResourceType.Organization && variable.resourceId === resourceId
        );
      case ResourceType.Project:
        return variables.filter(
          variable =>
            variable.organizationId === workspace.organizationId &&
            variable.resourceType === ResourceType.Project &&
            variable.resourceId === resourceId
        );
      default:
        return variables.filter(
          variable =>
            variable.organizationId === workspace.organizationId &&
            variable.projectId === workspace.projectId &&
            variable.resourceType === resourceType &&
            variable.resourceId === resourceId
        );
    }
  });

export const selectResourceVariablesLoadedForProject = (projectId: string) =>
  createSelector(selectResourceVariablesState, state => state.loadedProjects.includes(projectId));
