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
import {AuthGuard} from '../core/guards/auth.guard';
import {CollectionsGuard} from '../core/guards/collections.guard';
import {LinkTypesGuard} from '../core/guards/link-types.guard';
import {ViewExistGuard} from '../core/guards/view/view-exist.guard';
import {ViewRedirectGuard} from '../core/guards/view/view-redirect.guard';
import {ViewsLoadedGuard} from '../core/guards/view/views-loaded.guard';
import {WorkspaceGuard} from '../workspace/workspace.guard';
import {Perspective} from './perspectives/perspective';
import {PostItPerspectiveComponent} from './perspectives/post-it/post-it-perspective.component';
import {TablePerspectiveComponent} from './perspectives/table/table-perspective.component';
import {ViewLoadingComponent} from './view-loading.component';
import {ViewComponent} from './view.component';

const viewRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/view',
    canActivate: [AuthGuard, WorkspaceGuard, CollectionsGuard, LinkTypesGuard, ViewsLoadedGuard, ViewExistGuard],
    component: ViewComponent,
    children: [
      {
        path: Perspective.PostIt,
        component: PostItPerspectiveComponent
      },
      {
        path: Perspective.Chart,
        loadChildren: './perspectives/chart/chart-perspective.module#ChartPerspectiveModule'
      },
      {
        path: Perspective.Search,
        loadChildren: './perspectives/search/search-perspective.module#SearchPerspectiveModule' // TODO sync
      },
      {
        path: Perspective.Table,
        component: TablePerspectiveComponent
      },
      {
        path: Perspective.Table2,
        loadChildren: './perspectives/table2/table2-perspective.module#Table2PerspectiveModule',
      },
      {
        path: Perspective.SmartDoc,
        loadChildren: './perspectives/smartdoc/smartdoc-perspective.module#SmartDocPerspectiveModule',
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
