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
import {OrganizationDetailComponent} from './organization/detail/organization-detail.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {OrganizationSettingsGuard} from './organization/organization-settings.guard';
import {OrganizationUsersComponent} from './organization/users/organization-users.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {ProjectSettingsGuard} from './project/project-settings.guard';
import {ProjectUsersComponent} from './project/users/project-users.component';
import {UsersGuard} from '../core/guards/data/users.guard';
import {ProjectSequencesComponent} from './project/sequences/project-sequences.component';
import {ProjectTemplateComponent} from './project/template/project-template.component';
import {ViewsGuard} from '../core/guards/data/views.guard';
import {CollectionsGuard} from '../core/guards/data/collections.guard';
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';
import {GroupsGuard} from '../core/guards/data/groups.guard';
import {OrganizationTeamsComponent} from './organization/teams/organization-teams.component';
import {ProjectTeamsComponent} from './project/teams/project-teams.component';
import {ServiceLimitsGuard} from '../core/guards/data/service-limits.guard';
import {OrganizationTabGuard} from './organization/organization-tab.guard';
import {RoleType} from '../core/model/role-type';
import {ProjectTabGuard} from './project/project-tab.guard';
import {ProjectSelectionListsComponent} from './project/selection/project-selection-lists.component';
import {SelectionListsGuard} from '../core/guards/selection-lists.guard';

const workspaceRoutes: Routes = [
  {
    path: 'o/:organizationCode/p/:projectCode',
    component: ProjectSettingsComponent,
    canActivate: [AuthGuard, CurrentUserGuard, ProjectSettingsGuard],
    canActivateChild: [ProjectTabGuard],
    resolve: {
      users: UsersGuard,
      groups: GroupsGuard,
      selection: SelectionListsGuard,
      collections: CollectionsGuard,
      views: ViewsGuard,
      limits: ServiceLimitsGuard,
      linkTypes: LinkTypesGuard,
    },
    children: [
      {
        path: 'users',
        component: ProjectUsersComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: 'teams',
        component: ProjectTeamsComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: 'sequences',
        component: ProjectSequencesComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: 'template',
        component: ProjectTemplateComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: 'selection',
        component: ProjectSelectionListsComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'o/:organizationCode',
    component: OrganizationSettingsComponent,
    canActivate: [AuthGuard, CurrentUserGuard, OrganizationSettingsGuard],
    canActivateChild: [OrganizationTabGuard],
    resolve: {
      limits: ServiceLimitsGuard,
      users: UsersGuard,
      groups: GroupsGuard,
    },
    children: [
      {
        path: 'detail',
        component: OrganizationDetailComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'users',
        component: OrganizationUsersComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: 'teams',
        component: OrganizationTeamsComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: '',
        redirectTo: 'detail',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(workspaceRoutes)],
  exports: [RouterModule],
})
export class WorkspaceRoutingModule {}
