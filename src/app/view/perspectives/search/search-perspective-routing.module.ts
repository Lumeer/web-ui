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
import {SearchAllComponent} from './all/search-all.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchDocumentsComponent} from './documents/search-documents.component';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchViewsComponent} from './views/search-views.component';

const searchRoutes: Routes = [
  {
    path: '',
    component: SearchPerspectiveComponent,
    children: [
      {
        path: 'all',
        component: SearchAllComponent,
      },
      {
        path: 'collections',
        component: SearchCollectionsComponent
      },
      {
        path: 'records',
        component: SearchDocumentsComponent
      },
      /*{
        path: 'links',
        component: SearchLinksComponent
      },*/
      {
        path: 'views',
        component: SearchViewsComponent
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all'
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(searchRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class SearchPerspectiveRoutingModule {

}
