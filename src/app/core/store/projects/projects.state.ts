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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {Project} from './project';
import {LoadingState} from '../../model/loading-state';
import {selectPublicProjectId} from '../public-data/public-data.state';
import {sortResourcesByOrder} from '../../../shared/utils/resource.utils';

export interface ProjectsState extends EntityState<Project> {
  projectCodes: {[organizationId: string]: string[]};
  loaded: {[organizationId: string]: boolean};
  templates: Project[];
  templatesState: LoadingState;
  dismissedWarningIds: string[];
}

export const projectsAdapter = createEntityAdapter<Project>({selectId: project => project.id});

export const initialProjectsState: ProjectsState = projectsAdapter.getInitialState({
  projectCodes: {},
  loaded: {},
  templates: [],
  templatesState: LoadingState.NotLoaded,
  dismissedWarningIds: [],
});

export const selectProjectsState = (state: AppState) => state.projects;
export const selectAllProjects = createSelector(selectProjectsState, projectsAdapter.getSelectors().selectAll);

export const selectAllProjectsSorted = createSelector(selectAllProjects, projects => sortResourcesByOrder(projects));

export const selectProjectsDictionary = createSelector(
  selectProjectsState,
  projectsAdapter.getSelectors().selectEntities
);
export const selectProjectsLoaded = createSelector(selectProjectsState, projectState => projectState.loaded);

export const selectProjectsCodes = createSelector(selectProjectsState, projectState => projectState.projectCodes);

export const selectProjectsCodesForOrganization = id =>
  createSelector(selectProjectsCodes, projectCodes => projectCodes[id]);

export const selectProjectsLoadedForOrganization = id => createSelector(selectProjectsLoaded, loaded => loaded[id]);

export const selectProjectsForWorkspace = createSelector(
  selectAllProjects,
  selectOrganizationByWorkspace,
  (projects, organization) => {
    return sortResourcesByOrder(
      organization ? projects.filter(project => project.organizationId === organization.id) : []
    );
  }
);

export const selectProjectById = id =>
  createSelector(selectProjectsDictionary, projects => {
    return projects[id];
  });

export const selectProjectByWorkspace = createSelector(
  selectWorkspace,
  selectProjectsForWorkspace,
  (workspace, projects) => {
    return workspace && workspace.projectCode ? projects.find(project => project.code === workspace.projectCode) : null;
  }
);

export const selectProjectsByOrganizationId = id =>
  createSelector(selectAllProjects, projects => {
    return sortResourcesByOrder(projects.filter(project => project.organizationId === id));
  });

export const selectProjectByOrganizationAndCode = (organizationId: string, projectCode: string) =>
  createSelector(selectAllProjects, projects =>
    projects.find(project => project.organizationId === organizationId && project.code === projectCode)
  );

export const selectProjectTemplates = createSelector(selectProjectsState, state => state.templates);

export const selectPublicProject = createSelector(
  selectProjectsDictionary,
  selectPublicProjectId,
  (projects, id) => projects[id]
);

export const selectProjectTemplatesLoadingState = createSelector(selectProjectsState, state => state.templatesState);

export const selectProjectDismissedWarningIds = createSelector(selectProjectsState, state => state.dismissedWarningIds);
