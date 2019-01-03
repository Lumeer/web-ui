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
import {CommonModule} from '@angular/common';

import {SharedModule} from '../../shared/shared.module';
import {ShareViewDialogComponent} from './share-view-dialog.component';
import {ShareUserComponent} from './share-user/share-user.component';
import {ShareViewInputComponent} from './share-view-input/share-view-input.component';
import {ShareViewCopyComponent} from './share-view-copy/share-view-copy.component';
import {ViewPermissionsChangedPipe} from './pipes/view-permissions-changed.pipe';
import {DialogWrapperModule} from '../shared/wrapper/dialog-wrapper.module';
import {UserRolesPipe} from './pipes/user-roles.pipe';
import {CanRemoveUserPipe} from './pipes/can-remove-user.pipe';

@NgModule({
  imports: [CommonModule, SharedModule, DialogWrapperModule],
  declarations: [
    ShareViewDialogComponent,
    ShareUserComponent,
    ShareViewInputComponent,
    ShareViewCopyComponent,
    ViewPermissionsChangedPipe,
    UserRolesPipe,
    CanRemoveUserPipe,
  ],
  entryComponents: [ShareViewDialogComponent],
})
export class ShareViewDialogModule {}
