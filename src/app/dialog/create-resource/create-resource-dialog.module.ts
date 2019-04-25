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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {ResourceCodeInputComponent} from './form/code-input/resource-code-input.component';
import {ResourceNameInputComponent} from './form/name-input/resource-name-input.component';
import {CreateResourceDialogComponent} from './create-resource-dialog.component';
import {DialogWrapperModule} from '../shared/wrapper/dialog-wrapper.module';
import {SharedModule} from '../../shared/shared.module';
import {PickerModule} from '../../shared/picker/picker.module';
import {CreateResourceDialogFormComponent} from './form/create-resource-dialog-form.component';
import {CreateResourceDialogParentComponent} from './form/parent/create-resource-dialog-parent.component';
import {CreateResourceDialogTemplatesComponent} from './form/templates/create-resource-dialog-templates.component';
import {CreateResourceDialogTemplateComponent} from './form/templates/template/create-resource-dialog-template.component';

@NgModule({
  declarations: [
    ResourceCodeInputComponent,
    ResourceNameInputComponent,
    CreateResourceDialogComponent,
    CreateResourceDialogFormComponent,
    CreateResourceDialogParentComponent,
    CreateResourceDialogTemplatesComponent,
    CreateResourceDialogTemplateComponent,
  ],
  imports: [CommonModule, SharedModule, FormsModule, ReactiveFormsModule, DialogWrapperModule, PickerModule],
  exports: [CreateResourceDialogComponent],
  entryComponents: [CreateResourceDialogComponent],
})
export class CreateResourceDialogModule {}
