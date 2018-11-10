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

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../auth/auth.guard';
import {CurrentUserGuard} from '../core/guards/current-user.guard';
import {OrganizationDetailComponent} from './organization/detail/organization-detail.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {OrganizationSettingsGuard} from './organization/organization-settings.guard';
import {OrganizationUsersComponent} from './organization/users/organization-users.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {ProjectSettingsGuard} from './project/project-settings.guard';
import {ProjectUsersComponent} from './project/users/project-users.component';
import {WorkspaceChooserComponent} from './workspace-chooser/workspace-chooser.component';
import {WorkspaceSelectGuard} from './workspace-select.guard';

const workspaceRoutes: Routes = [
  {
    path: 'organization/:organizationCode/project/:projectCode',
    component: ProjectSettingsComponent,
    canActivate: [AuthGuard, CurrentUserGuard, ProjectSettingsGuard],
    children: [
      {
        path: 'users',
        component: ProjectUsersComponent,
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'organization/:organizationCode',
    component: OrganizationSettingsComponent,
    canActivate: [AuthGuard, CurrentUserGuard, OrganizationSettingsGuard],
    children: [
      {
        path: 'detail',
        component: OrganizationDetailComponent,
      },
      {
        path: 'users',
        component: OrganizationUsersComponent,
      },
      {
        path: '',
        redirectTo: 'detail',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'workspace',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceSelectGuard],
    component: WorkspaceChooserComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(workspaceRoutes)],
  exports: [RouterModule],
})
export class WorkspaceRoutingModule {}
