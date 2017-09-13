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

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CollectionListComponent } from './list/collection-list.component';
import { CollectionComponent } from './collection.component';
import { CollectionConfigComponent } from './config/collection-config.component';
import { CollectionAttributesComponent } from './config/attributes/collection-attributes.component';
import { CollectionEventsComponent } from './config/events/collection-events.component';
import { CollectionAccessRightsComponent } from './config/access-rights/collection-access-rights.component';
import { CollectionLinkTypesComponent } from './config/link-types/collection-link-types.component';

const collectionRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/c/:collectionCode',
    component: CollectionConfigComponent,
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
        path: 'accessrights',
        component: CollectionAccessRightsComponent
      },
      {
        path: '',
        redirectTo: 'attributes',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'w/:organizationCode/:projectCode/collections',
    component: CollectionComponent,
    children: [
      {
        path: '',
        component: CollectionListComponent
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
