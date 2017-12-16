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
import {selectSelectedOrganizationCode} from '../organizations/organizations.state';
import {ProjectModel} from './project.model';

export interface ProjectsState extends EntityState<ProjectModel> {

  organizationCode: string;
  selectedProjectCode: string;

}

export const projectsAdapter = createEntityAdapter<ProjectModel>({selectId: project => project.code});

export const initialProjectsState: ProjectsState = projectsAdapter.getInitialState({
  organizationCode: null,
  selectedProjectCode: null
});

export const selectProjectsState = (state: AppState) => state.projects;
export const selectAllProjects = createSelector(selectProjectsState, projectsAdapter.getSelectors().selectAll);
export const selectProjectsDictionary = createSelector(selectProjectsState, projectsAdapter.getSelectors().selectEntities);
export const selectProjectsOrganizationCode = createSelector(selectProjectsState, projectsState => projectsState.organizationCode);
export const selectSelectedProjectCode = createSelector(selectProjectsState, projectsState => projectsState.selectedProjectCode);
export const selectProjectsForSelectedOrganization = createSelector(selectAllProjects, selectSelectedOrganizationCode, (projects, organizationCode) => {
  return projects.filter(project => project.organizationCode === organizationCode);
});
