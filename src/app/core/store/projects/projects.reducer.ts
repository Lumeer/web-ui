/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ProjectsAction, ProjectsActionType} from './projects.action';
import {initialProjectsState, projectsAdapter, ProjectsState} from './projects.state';
import {PermissionsHelper} from '../permissions/permissions.helper';
import {Project} from './project';

export function projectsReducer(
  state: ProjectsState = initialProjectsState,
  action: ProjectsAction.All
): ProjectsState {
  switch (action.type) {
    case ProjectsActionType.GET_SUCCESS:
      return addProjects(state, action);
    case ProjectsActionType.GET_ONE_SUCCESS:
      return addOrUpdateProject(state, action.payload.project);
    case ProjectsActionType.GET_CODES_SUCCESS:
      const projectCodes = {...state.projectCodes};
      projectCodes[action.payload.organizationId] = action.payload.projectCodes;
      return {...state, projectCodes};
    case ProjectsActionType.CREATE_SUCCESS:
      return addOrUpdateProject(state, action.payload.project);
    case ProjectsActionType.UPDATE_SUCCESS:
      return addOrUpdateProject(state, action.payload.project);
    case ProjectsActionType.DELETE_SUCCESS:
      return projectsAdapter.removeOne(action.payload.projectId, state);
    case ProjectsActionType.SELECT:
      return {...state, selectedProjectId: action.payload.projectId};
    case ProjectsActionType.CHANGE_PERMISSION_SUCCESS:
      return onChangePermission(state, action);
    case ProjectsActionType.CHANGE_PERMISSION_FAILURE:
      return onChangePermission(state, action);
    default:
      return state;
  }
}

function addProjects(state: ProjectsState, action: ProjectsAction.GetSuccess): ProjectsState {
  const newState = {...state, loaded: {...state.loaded, [action.payload.organizationId]: true}};
  const filteredProjects = action.payload.projects.filter(project => {
    const oldProject = state.entities[project.id];
    return !oldProject || isProjectNewer(project, oldProject);
  });

  return projectsAdapter.addMany(filteredProjects, newState);
}

function addOrUpdateProject(state: ProjectsState, project: Project): ProjectsState {
  const oldProject = state.entities[project.id];
  if (!oldProject) {
    return projectsAdapter.addOne(project, state);
  }

  if (isProjectNewer(project, oldProject)) {
    return projectsAdapter.upsertOne(project, state);
  }
  return state;
}

function isProjectNewer(project: Project, oldProject: Project): boolean {
  return project.version && (!oldProject.version || project.version > oldProject.version);
}

function onChangePermission(
  state: ProjectsState,
  action: ProjectsAction.ChangePermissionSuccess | ProjectsAction.ChangePermissionFailure
): ProjectsState {
  const project = state.entities[action.payload.projectId];
  const permissions = PermissionsHelper.changePermission(
    project.permissions,
    action.payload.type,
    action.payload.permission
  );

  return projectsAdapter.updateOne({id: action.payload.projectId, changes: {permissions: permissions}}, state);
}
