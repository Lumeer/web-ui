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
import {CollectionsGuard} from '../core/store/collections/collections.guard';
import {Perspective} from './perspectives/perspective';
import {PostItPerspectiveComponent} from './perspectives/post-it/post-it-perspective.component';
import {SearchAllComponent} from './perspectives/search/all/search-all.component';
import {SearchCollectionsComponent} from './perspectives/search/collections/search-collections.component';
import {SearchDocumentsComponent} from './perspectives/search/documents/search-documents.component';
import {SearchLinksComponent} from './perspectives/search/links/search-links.component';
import {SearchPerspectiveComponent} from './perspectives/search/search-perspective.component';
import {SearchViewsComponent} from './perspectives/search/views/search-views.component';
import {SmartDocPerspectiveComponent} from './perspectives/smartdoc/smartdoc-perspective.component';
import {TablePerspectiveComponent} from './perspectives/table/table-perspective.component';
import {ViewLoadingComponent} from './view-loading.component';
import {ViewComponent} from './view.component';
import {ViewGuard} from './view.guard';

const viewRoutes: Routes = [
  {
    path: 'w/:organizationId/:projectCode/view',
    canActivate: [CollectionsGuard],
    component: ViewComponent,
    children: [
      {
        path: Perspective.PostIt,
        component: PostItPerspectiveComponent
      },
      {
        path: Perspective.Search,
        component: SearchPerspectiveComponent,
        children: [
          {
            path: 'all',
            component: SearchAllComponent
          },
          {
            path: 'files',
            component: SearchCollectionsComponent
          },
          {
            path: 'records',
            component: SearchDocumentsComponent
          },
          {
            path: 'links',
            component: SearchLinksComponent
          },
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
      },
      {
        path: Perspective.Table,
        component: TablePerspectiveComponent
      },
      {
        path: Perspective.SmartDoc,
        component: SmartDocPerspectiveComponent
      },
      {
        path: '',
        pathMatch: 'full',
        canActivate: [ViewGuard],
        component: ViewLoadingComponent
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(viewRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class ViewRoutingModule {

}
