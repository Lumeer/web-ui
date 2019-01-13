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
import {CreateCollectionDialogComponent} from './create-collection/create-collection-dialog.component';
import {CreateLinkDialogComponent} from './create-link/create-link-dialog.component';
import {CollectionNameInputComponent} from './shared/collection-name-input/collection-name-input.component';
import {LinkNameInputComponent} from './shared/link-name-input/link-name-input.component';
import {CreateResourceDialogComponent} from './create-resource/create-resource-dialog.component';
import {ResourceCodeInputComponent} from './create-resource/resource-code-input/resource-code-input.component';
import {ResourceNameInputComponent} from './create-resource/resource-name-input/resource-name-input.component';
import {FeedbackDialogComponent} from './dialog/feedback-dialog.component';
import {ShareViewDialogModule} from './share-view/share-view-dialog.module';
import {DialogWrapperModule} from './shared/wrapper/dialog-wrapper.module';
import {PlayVideoComponent} from './play-video/play-video.component';
import {AttributeTypeDialogComponent} from './attribute-type/attribute-type-dialog.component';
import {AttributeTypeFormModule} from './attribute-type/form/attribute-type-form.module';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    PickerModule,
    DialogRoutingModule,
    DialogWrapperModule,
    ShareViewDialogModule,
    AttributeTypeFormModule,
  ],
  declarations: [
    CreateCollectionDialogComponent,
    CollectionNameInputComponent,
    LinkNameInputComponent,
    CreateLinkDialogComponent,
    DialogBaseComponent,
    CreateResourceDialogComponent,
    ResourceCodeInputComponent,
    ResourceNameInputComponent,
    FeedbackDialogComponent,
    PlayVideoComponent,
    AttributeTypeDialogComponent,
  ],
  entryComponents: [CreateCollectionDialogComponent, CreateLinkDialogComponent, CreateResourceDialogComponent],
  exports: [DialogBaseComponent],
})
export class DialogModule {}
