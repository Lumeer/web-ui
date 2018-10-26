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
import {CollectionsGuard} from '../core/guards/data/collections.guard';
import {DocumentsGuard} from '../core/guards/data/documents.guard';
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';
import {ViewsGuard} from '../core/guards/data/views.guard';
import {ViewConfigCleanUpGuard} from '../core/guards/view-config-clean-up-guard.service';
import {ViewRedirectGuard} from '../core/guards/view-redirect.guard';
import {WorkspaceGuard} from '../core/guards/workspace.guard';
import {Perspective} from './perspectives/perspective';
import {PostItPerspectiveComponent} from './perspectives/post-it/post-it-perspective.component';
import {ViewLoadingComponent} from './view-loading.component';
import {ViewComponent} from './view.component';

const viewRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/view',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceGuard],
    canDeactivate: [ViewConfigCleanUpGuard],
    resolve: {
      collections: CollectionsGuard,
      documents: DocumentsGuard,
      linkTypes: LinkTypesGuard,
      views: ViewsGuard
    },
    component: ViewComponent,
    children: [
      {
        path: Perspective.Detail,
        loadChildren: './perspectives/detail/detail-perspective.module#DetailPerspectiveModule'
      },
      {
        path: Perspective.PostIt,
        component: PostItPerspectiveComponent
      },
      {
        path: Perspective.Chart,
        loadChildren: './perspectives/chart/chart-perspective.module#ChartPerspectiveModule'
      },
      {
        path: Perspective.Map,
        loadChildren: './perspectives/map/map-perspective.module#MapPerspectiveModule'
      },
      {
        path: Perspective.Search,
        loadChildren: './perspectives/search/search-perspective.module#SearchPerspectiveModule' // TODO sync
      },
      {
        path: Perspective.Table,
        loadChildren: './perspectives/table/table-perspective.module#TablePerspectiveModule',
      },
      {
        path: '',
        pathMatch: 'full',
        canActivate: [ViewRedirectGuard],
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
