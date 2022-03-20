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

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '../auth/auth.guard';
import {CurrentUserGuard} from '../core/guards/current-user.guard';
import {UsersGuard} from '../core/guards/data/users.guard';
import {GroupsGuard} from '../core/guards/data/groups.guard';
import {ServiceLimitsGuard} from '../core/guards/data/service-limits.guard';
import {RoleType} from '../core/model/role-type';
import {OrganizationsProjectsGuard} from '../core/guards/data/organizations-projects.guard';
import {WorkspaceUserComponent} from './workspace/workspace-user.component';
import {WorkspaceUserActivityComponent} from './workspace/activity/workspace-user-activity.component';
import {WorkspaceUserResourcesComponent} from './workspace/resources/workspace-user-resources.component';
import {WorkspaceUserSettingsGuard} from './workspace/workspace-user-settings.guard';
import {WorkspaceUserTabGuard} from './workspace/workspace-user-tab.guard';

const userRoutes: Routes = [
  {
    path: 'o/:organizationCode/u/:userId',
    component: WorkspaceUserComponent,
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceUserSettingsGuard],
    canActivateChild: [WorkspaceUserTabGuard],
    resolve: {
      organizations: OrganizationsProjectsGuard,
      limits: ServiceLimitsGuard,
      users: UsersGuard,
      groups: GroupsGuard,
    },
    children: [
      {
        path: 'activity',
        component: WorkspaceUserActivityComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'resources',
        component: WorkspaceUserResourcesComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: '',
        redirectTo: 'resources',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(userRoutes)],
  exports: [RouterModule],
})
export class UserRoutingModule {}
