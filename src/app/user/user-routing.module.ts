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
import {OrganizationUserComponent} from './organization/organization-user.component';
import {ProjectUserComponent} from './project/project-user.component';
import {OrganizationUserActivityComponent} from './organization/activity/organization-user-activity.component';
import {OrganizationUserResourcesComponent} from './organization/resources/organization-user-resources.component';
import {ProjectUserActivityComponent} from './project/activity/project-user-activity.component';
import {ProjectUserResourcesComponent} from './project/resources/project-user-resources.component';
import {ProjectUserSettingsGuard} from './project/project-user-settings.guard';
import {OrganizationUserSettingsGuard} from './organization/organization-user-settings.guard';
import {OrganizationUserTabGuard} from './organization/organization-user-tab.guard';
import {ProjectUserTabGuard} from './project/project-user-tab.guard';

const userRoutes: Routes = [
  {
    path: 'o/:organizationCode/p/:projectCode/u/:userId',
    component: ProjectUserComponent,
    canActivate: [AuthGuard, CurrentUserGuard, ProjectUserSettingsGuard],
    canActivateChild: [ProjectUserTabGuard],
    resolve: {
      organizations: OrganizationsProjectsGuard,
      users: UsersGuard,
      groups: GroupsGuard,
      limits: ServiceLimitsGuard,
    },
    children: [
      {
        path: 'activity',
        component: ProjectUserActivityComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'resources',
        component: ProjectUserResourcesComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: '',
        redirectTo: 'resources',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'o/:organizationCode/u/:userId',
    component: OrganizationUserComponent,
    canActivate: [AuthGuard, CurrentUserGuard, OrganizationUserSettingsGuard],
    canActivateChild: [OrganizationUserTabGuard],
    resolve: {
      organizations: OrganizationsProjectsGuard,
      limits: ServiceLimitsGuard,
      users: UsersGuard,
      groups: GroupsGuard,
    },
    children: [
      {
        path: 'activity',
        component: OrganizationUserActivityComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'resources',
        component: OrganizationUserResourcesComponent,
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
