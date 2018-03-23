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
import {OrganizationsActionType} from "../organizations/organizations.action";
import {organizationsAdapter} from "../organizations/organizations.state";

export function projectsReducer(state: ProjectsState = initialProjectsState, action: ProjectsAction.All): ProjectsState {
  switch (action.type) {
    case ProjectsActionType.GET_SUCCESS:
      return projectsAdapter.addMany(action.payload.projects, state);
    case ProjectsActionType.GET_CODES_SUCCESS:
      const projectCodes = {...state.projectCodes};
      projectCodes[action.payload.organizationId] = action.payload.projectCodes;
      return {...state, projectCodes};
    case ProjectsActionType.CREATE_SUCCESS:
      const project = action.payload.project;
      const newState = projectsAdapter.addOne(project, state);

      const projectCodesCopy = {...state.projectCodes};
      projectCodesCopy[project.organizationId].push(project.code);

      return {...newState, projectCodes: projectCodesCopy};
    case ProjectsActionType.UPDATE_SUCCESS:
      return projectsAdapter.updateOne({id: action.payload.project.id, changes: action.payload.project}, state);
    case ProjectsActionType.DELETE_SUCCESS:
      return projectsAdapter.removeOne(action.payload.projectId, state);
    case ProjectsActionType.SELECT:
      return {...state, selectedProjectId: action.payload.projectId};
    default:
      return state;
  }
}
