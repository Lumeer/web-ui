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
import {AgreementComponent} from './agreement/agreement.component';
import {AuthGuard} from './auth.guard';
import {AuthCallbackComponent} from './callback/auth-callback.component';
import {LogoutComponent} from './logout/logout.component';
import {SessionExpiredComponent} from './session-expired/session-expired.component';

const authRoutes: Routes = [
  {
    path: 'agreement',
    canActivate: [AuthGuard],
    component: AgreementComponent,
  },
  {
    path: 'auth',
    component: AuthCallbackComponent,
  },
  {
    path: 'logout',
    component: LogoutComponent,
  },
  {
    path: 'session-expired',
    component: SessionExpiredComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(authRoutes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
