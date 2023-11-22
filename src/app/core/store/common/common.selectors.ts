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
import {createSelector} from '@ngrx/store';

import {selectWorkspace} from '../navigation/navigation.state';
import {Workspace} from '../navigation/workspace';
import {selectAllOrganizations, selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {selectAllProjects, selectProjectByWorkspace} from '../projects/projects.state';
import {selectAllViews} from '../views/views.state';

export const selectWorkspaceModels = createSelector(
  selectOrganizationByWorkspace,
  selectProjectByWorkspace,
  (organization, project) => ({organization, project})
);

export const selectWorkspaceWithIds = createSelector(
  selectWorkspace,
  selectAllOrganizations,
  selectAllProjects,
  selectAllViews,
  (workspace, organizations, projects, views) => {
    if (!workspace) {
      return {} as Workspace;
    }
    const organization = organizations.find(org => org.code === workspace.organizationCode);
    const project =
      organization &&
      projects.find(proj => proj.organizationId === organization.id && proj.code === workspace.projectCode);
    const view = views.find(v => v.code === workspace.viewCode);
    return {
      ...workspace,
      organizationId: organization?.id || '',
      projectId: project?.id || '',
      viewId: view?.id || '',
    };
  }
);
