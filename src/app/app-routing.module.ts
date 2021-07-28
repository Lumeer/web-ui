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
import {RouterStateSerializer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {AuthGuard} from './auth/auth.guard';
import {CurrentUserGuard} from './core/guards/current-user.guard';
import {PageNotFoundGuard} from './core/guards/page-not-found.guard';
import {HomeComponent} from './core/components/home.component';
import {RedirectComponent} from './core/components/redirect.component';
import {LumeerRouterStateSerializer} from './core/store/router/lumeer-router-state-serializer';

const appRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [AuthGuard, CurrentUserGuard],
    component: HomeComponent,
  },
  {
    path: 'index.html',
    redirectTo: '',
  },
  {
    path: 'template/:templateCode',
    canActivate: [AuthGuard, CurrentUserGuard],
    component: RedirectComponent,
  },
  {
    path: 'open/:organizationId/:projectId',
    canActivate: [AuthGuard, CurrentUserGuard],
    component: RedirectComponent,
  },
  {
    path: '**',
    canActivate: [AuthGuard, CurrentUserGuard, PageNotFoundGuard],
    component: HomeComponent,
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {scrollPositionRestoration: 'top', relativeLinkResolution: 'legacy'}),
    StoreRouterConnectingModule.forRoot(),
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: RouterStateSerializer,
      useClass: LumeerRouterStateSerializer,
    },
  ],
})
export class AppRoutingModule {}
