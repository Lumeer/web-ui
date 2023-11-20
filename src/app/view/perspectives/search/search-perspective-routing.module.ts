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

import {DashboardTabComponent} from '../dashboard/dashboard-tab/dashboard-tab.component';
import {SearchAllComponent} from '../dashboard/search-all/search-all.component';
import {SearchCollectionsComponent} from '../dashboard/search-collections/search-collections.component';
import {SearchTasksComponent} from '../dashboard/search-tasks/search-tasks.component';
import {SearchViewsFoldersComponent} from '../dashboard/search-views/folders/search-views-folders.component';
import {SearchPerspectiveRedirectGuard} from './search-perspective-redirect.guard';
import {SearchPerspectiveComponent} from './search-perspective.component';

const searchRoutes: Routes = [
  {
    path: '',
    component: SearchPerspectiveComponent,
    canActivate: [SearchPerspectiveRedirectGuard],
    runGuardsAndResolvers: 'always',
    children: [
      {
        path: 'all',
        component: SearchAllComponent,
      },
      {
        path: 'tables',
        component: SearchCollectionsComponent,
      },
      {
        path: 'tasks',
        component: SearchTasksComponent,
      },
      {
        path: 'views',
        component: SearchViewsFoldersComponent,
      },
      {
        path: ':tabId',
        component: DashboardTabComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(searchRoutes)],
  exports: [RouterModule],
})
export class SearchPerspectiveRoutingModule {}
