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

import {WorkspaceGuard} from '../workspace/workspace.guard';
import {DocumentsComponent} from './documents.component';
import {AuthGuard} from '../core/guards/auth.guard';

const documentRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/f/:collectionId/records',
    canActivate: [AuthGuard, WorkspaceGuard],
    component: DocumentsComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(documentRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class DocumentRoutingModule {

}
