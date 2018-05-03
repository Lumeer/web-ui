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

import {CollectionSettingsGuard} from './collection-settings.guard';
import {CollectionSettingsComponent} from './settings/collection-settings.component';
import {CollectionUsersComponent} from './settings/tab/users/collection-users.component';
import {CollectionAttributesComponent} from './settings/tab/attributes/collection-attributes.component';
import {CollectionEventsComponent} from './settings/tab/events/collection-events.component';
import {CollectionLinkTypesComponent} from './settings/tab/link-types/collection-link-types.component';
import {WorkspaceGuard} from '../workspace/workspace.guard';
import {AuthGuard} from '../core/guards/auth.guard';

const collectionRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/f/:collectionId',
    canActivate:[AuthGuard, WorkspaceGuard, CollectionSettingsGuard],
    component: CollectionSettingsComponent,
    children: [
      {
        path: 'attributes',
        component: CollectionAttributesComponent
      },
      {
        path: 'linktypes',
        component: CollectionLinkTypesComponent
      },
      {
        path: 'events',
        component: CollectionEventsComponent
      },
      {
        path: 'users',
        component: CollectionUsersComponent
      },
      {
        path: '',
        redirectTo: 'attributes',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(collectionRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class CollectionRoutingModule {

}
