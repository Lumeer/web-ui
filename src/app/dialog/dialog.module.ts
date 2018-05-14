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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {PickerModule} from '../shared/picker/picker.module';
import {SharedModule} from '../shared/shared.module';
import {DialogBaseComponent} from './dialog-base.component';
import {DialogRoutingModule} from './dialog-routing.module';
import {DialogService} from './dialog.service';
import {CreateCollectionDialogComponent} from './create-collection/create-collection-dialog.component';
import {CreateLinkDialogComponent} from './create-link/create-link-dialog.component';
import {OverwriteViewDialogComponent} from './overwrite-view/overwrite-view-dialog.component';
import {ShareViewDialogComponent} from './share-view/share-view-dialog.component';
import {CollectionNameInputComponent} from './shared/collection-name-input/collection-name-input.component';
import {LinkNameInputComponent} from './shared/link-name-input/link-name-input.component';
import {DialogWrapperComponent} from './shared/wrapper/dialog-wrapper.component';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PickerModule,
    DialogRoutingModule
  ],
  declarations: [
    DialogWrapperComponent,
    CreateCollectionDialogComponent,
    CollectionNameInputComponent,
    LinkNameInputComponent,
    CreateLinkDialogComponent,
    DialogBaseComponent,
    ShareViewDialogComponent,
    OverwriteViewDialogComponent
  ],
  providers: [
    DialogService
  ],
  entryComponents: [
    CreateCollectionDialogComponent,
    CreateLinkDialogComponent,
    ShareViewDialogComponent,
    OverwriteViewDialogComponent
  ],
  exports: [
    DialogBaseComponent
  ]
})
export class DialogModule {
}
