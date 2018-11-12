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
import {CreateCollectionDialogComponent} from './create-collection/create-collection-dialog.component';
import {CreateLinkDialogComponent} from './create-link/create-link-dialog.component';
import {CreateResourceDialogComponent} from './create-resource/create-resource-dialog.component';
import {DialogPath} from './dialog-path';
import {FeedbackDialogComponent} from './dialog/feedback-dialog.component';
import {OverwriteViewDialogComponent} from './overwrite-view/overwrite-view-dialog.component';
import {ShareViewDialogComponent} from './share-view/share-view-dialog.component';

const routes: Routes = [
  {
    path: `${DialogPath.CREATE_COLLECTION}/:linkedCollectionId`,
    component: CreateCollectionDialogComponent,
    outlet: 'dialog',
  },
  {
    path: DialogPath.CREATE_COLLECTION,
    component: CreateCollectionDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.CREATE_LINK}/:linkCollectionIds`,
    component: CreateLinkDialogComponent,
    outlet: 'dialog',
  },
  {
    path: DialogPath.FEEDBACK,
    component: FeedbackDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.OVERWRITE_VIEW}/:existingViewCode`,
    component: OverwriteViewDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.SHARE_VIEW}/:viewCode`,
    component: ShareViewDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.CREATE_ORGANIZATION}`,
    component: CreateResourceDialogComponent,
    outlet: 'dialog',
  },
  {
    path: `${DialogPath.CREATE_PROJECT}/:organizationId`,
    component: CreateResourceDialogComponent,
    outlet: 'dialog',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DialogRoutingModule {}
