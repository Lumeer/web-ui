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
import {ViewConfigCleanUpGuard} from '../core/guards/view-config-clean-up-guard.service';
import {WorkspaceGuard} from '../core/guards/workspace.guard';
import {PrintComponent} from './print/print.component';
import {LinkTypesGuard} from '../core/guards/data/link-types.guard';

const printRoutes: Routes = [
  {
    path: 'print/:organizationCode/:projectCode/:resourceType/:resourceId/:documentId/:attributeId',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceGuard],
    canDeactivate: [ViewConfigCleanUpGuard],
    resolve: {
      collections: CollectionsGuard,
      linkTypes: LinkTypesGuard,
    },
    component: PrintComponent,
  },
  {
    path: 'print/:organizationCode/:projectCode/:resourceType',
    canActivate: [AuthGuard, CurrentUserGuard, WorkspaceGuard],
    canDeactivate: [ViewConfigCleanUpGuard],
    component: PrintComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(printRoutes)],
  exports: [RouterModule],
})
export class PrintRoutingModule {}
