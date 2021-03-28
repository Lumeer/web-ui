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
import {CollectionsGuard} from '../core/guards/data/collections.guard';
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';
import {UsersGuard} from '../core/guards/data/users.guard';
import {ViewsGuard} from '../core/guards/data/views.guard';
import {ViewConfigCleanUpGuard} from '../core/guards/view-config-clean-up-guard.service';
import {ViewRedirectGuard} from '../core/guards/view-redirect.guard';
import {WorkspaceGuard} from '../core/guards/workspace.guard';
import {Perspective} from './perspectives/perspective';
import {ViewLoadingComponent} from './view-loading.component';
import {ViewComponent} from './view.component';
import {ViewDefaultConfigsGuard} from '../core/guards/data/view-default-configs.guard';
import {DocumentRedirectComponent} from '../core/components/document-redirect.component';

const viewRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/view',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceGuard],
    canDeactivate: [ViewConfigCleanUpGuard],
    resolve: {
      collections: CollectionsGuard,
      views: ViewsGuard,
      linkTypes: LinkTypesGuard,
      users: UsersGuard,
      defaultConfigs: ViewDefaultConfigsGuard,
    },
    component: ViewComponent,
    children: [
      {
        path: Perspective.Detail,
        loadChildren: () =>
          import('./perspectives/detail/detail-perspective.module').then(m => m.DetailPerspectiveModule),
      },
      {
        path: Perspective.Kanban,
        loadChildren: () =>
          import('./perspectives/kanban/kanban-perspective.module').then(m => m.KanbanPerspectiveModule),
      },
      {
        path: Perspective.Pivot,
        loadChildren: () => import('./perspectives/pivot/pivot-perspective.module').then(m => m.PivotPerspectiveModule),
      },
      {
        path: Perspective.Chart,
        loadChildren: () => import('./perspectives/chart/chart-perspective.module').then(m => m.ChartPerspectiveModule),
      },
      {
        path: Perspective.Map,
        loadChildren: () => import('./perspectives/map/map-perspective.module').then(m => m.MapPerspectiveModule),
      },
      {
        path: Perspective.GanttChart,
        loadChildren: () =>
          import('./perspectives/gantt-chart/gantt-chart-perspective.module').then(m => m.GanttChartPerspectiveModule),
      },
      {
        path: Perspective.Calendar,
        loadChildren: () =>
          import('./perspectives/calendar/calendar-perspective.module').then(m => m.CalendarPerspectiveModule),
      },
      {
        path: Perspective.Search,
        loadChildren: () =>
          import('./perspectives/search/search-perspective.module').then(m => m.SearchPerspectiveModule),
      },
      {
        path: Perspective.Workflow,
        loadChildren: () =>
          import('./perspectives/workflow/workflow-perspective.module').then(m => m.WorkflowPerspectiveModule),
      },
      {
        path: Perspective.Table,
        loadChildren: () => import('./perspectives/table/table-perspective.module').then(m => m.TablePerspectiveModule),
      },
      {
        path: '',
        pathMatch: 'full',
        canActivate: [ViewRedirectGuard],
        component: ViewLoadingComponent,
      },
    ],
  },
  {
    path: 'w/:organizationCode/:projectCode/document/:collectionId/:documentId',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceGuard],
    resolve: {
      collections: CollectionsGuard,
      views: ViewsGuard,
      linkTypes: LinkTypesGuard,
    },
    component: DocumentRedirectComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(viewRoutes)],
  exports: [RouterModule],
})
export class ViewRoutingModule {}
