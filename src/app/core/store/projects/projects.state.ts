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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {selectOrganizationByWorkspace, selectSelectedOrganizationId} from '../organizations/organizations.state';
import {Project} from './project';

export interface ProjectsState extends EntityState<Project> {
  selectedProjectId: string;
  projectCodes: {[organizationId: string]: string[]};
  loaded: {[organizationId: string]: boolean};
}

export const projectsAdapter = createEntityAdapter<Project>({selectId: project => project.id});

export const initialProjectsState: ProjectsState = projectsAdapter.getInitialState({
  selectedProjectId: null,
  projectCodes: {},
  loaded: {},
});

export const selectProjectsState = (state: AppState) => state.projects;
export const selectAllProjects = createSelector(
  selectProjectsState,
  projectsAdapter.getSelectors().selectAll
);
export const selectProjectsDictionary = createSelector(
  selectProjectsState,
  projectsAdapter.getSelectors().selectEntities
);
export const selectProjectsLoaded = createSelector(
  selectProjectsState,
  projectState => projectState.loaded
);
export const selectSelectedProjectId = createSelector(
  selectProjectsState,
  projectsState => projectsState.selectedProjectId
);
export const selectProjectsCodes = createSelector(
  selectProjectsState,
  projectState => projectState.projectCodes
);
export const selectProjectsCodesForSelectedOrganization = createSelector(
  selectProjectsCodes,
  selectSelectedOrganizationId,
  (projectCodes, selectedOrganizationId) => {
    return projectCodes[selectedOrganizationId] || [];
  }
);

export const selectProjectsCodesForOrganization = id =>
  createSelector(
    selectProjectsCodes,
    projectCodes => projectCodes[id]
  );

export const selectProjectsLoadedForOrganization = id =>
  createSelector(
    selectProjectsLoaded,
    loaded => loaded[id]
  );

export const selectProjectsForSelectedOrganization = createSelector(
  selectAllProjects,
  selectSelectedOrganizationId,
  (projects, organizationId) => {
    return projects.filter(project => project.organizationId === organizationId);
  }
);
export const selectSelectedProject = createSelector(
  selectProjectsDictionary,
  selectSelectedProjectId,
  (projects, selectedId) => {
    return selectedId ? projects[selectedId] : null;
  }
);

export const selectProjectsForWorkspace = createSelector(
  selectAllProjects,
  selectOrganizationByWorkspace,
  (projects, organization) => {
    return organization ? projects.filter(project => project.organizationId === organization.id) : [];
  }
);

export const selectProjectById = id =>
  createSelector(
    selectProjectsDictionary,
    projects => {
      return projects[id];
    }
  );

export const selectProjectByWorkspace = createSelector(
  selectWorkspace,
  selectProjectsForWorkspace,
  (workspace, projects) => {
    return workspace && workspace.projectCode ? projects.find(project => project.code === workspace.projectCode) : null;
  }
);

export const selectProjectsByOrganizationId = id =>
  createSelector(
    selectAllProjects,
    projects => {
      return projects.filter(project => project.organizationId === id);
    }
  );

export const selectProjectByOrganizationAndCode = (organizationId: string, projectCode: string) =>
  createSelector(
    selectAllProjects,
    projects => projects.find(project => project.organizationId === organizationId && project.code === projectCode)
  );
