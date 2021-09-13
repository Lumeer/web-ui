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
import {SearchAllComponent} from './all/search-all.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchTasksComponent} from './tasks/search-tasks.component';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchPerspectiveRedirectGuard} from './search-perspective-redirect.guard';
import {SearchViewsFoldersComponent} from './views/folders/search-views-folders.component';
import {DashboardTabComponent} from './dashboard/dashboard-tab.component';

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
