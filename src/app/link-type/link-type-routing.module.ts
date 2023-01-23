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
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';
import {CollectionsGuard} from '../core/guards/data/collections.guard';
import {UsersGuard} from '../core/guards/data/users.guard';
import {ViewsGuard} from '../core/guards/data/views.guard';
import {RoleType} from '../core/model/role-type';
import {LinkTypeSettingsGuard} from './link-type-settings.guard';
import {LinkTypeTabGuard} from './link-type-tab.guard';
import {LinkTypeSettingsComponent} from './settings/link-type-settings.component';
import {LinkTypeActivityComponent} from './settings/tab/activity/link-type-activity.component';
import {LinkTypeAttributesComponent} from './settings/tab/attributes/link-type-attributes.component';
import {LinkTypeRulesComponent} from './settings/tab/rules/link-type-rules.component';
import {LinkTypeCollectionsComponent} from './settings/tab/collections/link-type-collections.component';
import {OrganizationsProjectsGuard} from '../core/guards/data/organizations-projects.guard';

const linkTypeRoutes: Routes = [
  {
    path: 'o/:organizationCode/p/:projectCode/l/:linkTypeId',
    canActivate: [AuthGuard, CurrentUserGuard, LinkTypeSettingsGuard],
    canActivateChild: [LinkTypeTabGuard],
    component: LinkTypeSettingsComponent,
    resolve: {
      organizations: OrganizationsProjectsGuard,
      linkTypes: LinkTypesGuard,
      collections: CollectionsGuard,
      users: UsersGuard,
      views: ViewsGuard,
    },
    children: [
      {
        path: 'attributes',
        component: LinkTypeAttributesComponent,
        data: {role: RoleType.AttributeEdit},
      },
      {
        path: 'rules',
        component: LinkTypeRulesComponent,
        data: {role: RoleType.TechConfig},
      },
      {
        path: 'tables',
        component: LinkTypeCollectionsComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: 'activity',
        component: LinkTypeActivityComponent,
        data: {role: RoleType.Manage},
      },
      {
        path: '',
        redirectTo: 'attributes',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(linkTypeRoutes)],
  exports: [RouterModule],
})
export class LinkTypeRoutingModule {}
