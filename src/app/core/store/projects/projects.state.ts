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
import {OrganizationModel} from '../organizations/organization.model';
import {selectSelectedOrganizationId} from '../organizations/organizations.state';
import {ProjectModel} from './project.model';

export interface ProjectsState extends EntityState<ProjectModel> {

  selectedProjectId: string;

}

export const projectsAdapter = createEntityAdapter<ProjectModel>({selectId: project => project.id});

export const initialProjectsState: ProjectsState = projectsAdapter.getInitialState({
  selectedProjectId: null
});

export const selectProjectsState = (state: AppState) => state.projects;
export const selectAllProjects = createSelector(selectProjectsState, projectsAdapter.getSelectors().selectAll);
export const selectProjectsDictionary = createSelector(selectProjectsState, projectsAdapter.getSelectors().selectEntities);
export const selectSelectedProjectId = createSelector(selectProjectsState, projectsState => projectsState.selectedProjectId);
export const selectProjectsForSelectedOrganization = createSelector(selectAllProjects, selectSelectedOrganizationId, (projects, organizationId) => {
  return projects.filter(project => project.organizationId === organizationId);
});
export const selectSelectedProject = createSelector(selectProjectsDictionary, selectSelectedProjectId, (projects, selectedId)=>{
  return selectedId ? projects[selectedId] : null;
});

export const selectProjectByCode = (code) => createSelector(selectAllProjects, projects => {
  return projects.find(project => project.code === code);
});

export const selectProjectById = (id) => createSelector(selectProjectsDictionary, projects => {
  return projects[id];
});
