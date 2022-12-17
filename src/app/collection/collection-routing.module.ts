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
import {CollectionSettingsGuard} from './collection-settings.guard';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';
import {CollectionsGuard} from '../core/guards/data/collections.guard';
import {UsersGuard} from '../core/guards/data/users.guard';
import {CollectionRulesComponent} from './settings/tab/rules/collection-rules.component';
import {CollectionPurposeComponent} from './settings/tab/purpose/collection-purpose.component';
import {ViewsGuard} from '../core/guards/data/views.guard';
import {GroupsGuard} from '../core/guards/data/groups.guard';
import {CollectionTeamsComponent} from './settings/tab/teams/collection-teams.component';
import {CollectionTabGuard} from './collection-tab.guard';
import {RoleType} from '../core/model/role-type';
import {CollectionActivityComponent} from './settings/tab/activity/collection-activity.component';
import {OrganizationsProjectsGuard} from '../core/guards/data/organizations-projects.guard';

const collectionRoutes: Routes = [
  {
    path: 'o/:organizationCode/p/:projectCode/c/:collectionId',
    canActivate: [AuthGuard, CurrentUserGuard, CollectionSettingsGuard],
    canActivateChild: [CollectionTabGuard],
    component: CollectionSettingsComponent,
    resolve: {
      organizations: OrganizationsProjectsGuard,
      linkTypes: LinkTypesGuard,
      collections: CollectionsGuard,
      users: UsersGuard,
      views: ViewsGuard,
      groups: GroupsGuard,
    },
    children: [
      {
        path: 'attributes',
        component: CollectionAttributesComponent,
        data: {role: RoleType.AttributeEdit},
      },
      {
        path: 'rules',
        component: CollectionRulesComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: 'activity',
        component: CollectionActivityComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'linktypes',
        component: CollectionLinkTypesComponent,
      },
      {
        path: 'users',
        component: CollectionUsersComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: 'teams',
        component: CollectionTeamsComponent,
        data: {role: RoleType.UserConfig},
      },
      {
        path: 'purpose',
        component: CollectionPurposeComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: '',
        redirectTo: 'purpose',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(collectionRoutes)],
  exports: [RouterModule],
})
export class CollectionRoutingModule {}
