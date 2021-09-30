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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {FilterBoxComponent} from './filter-box/filter-box.component';
import {InputBoxComponent} from './input-box/input-box.component';
import {InvitationTypeSelectComponent} from './invitation-type-select/invitation-type-select.component';
import {HiddenInputComponent} from './hidden-input/hidden-input.component';
import {CopyTextBoxComponent} from './copy-text-box/copy-text-box.component';
import {CustomCheckboxComponent} from './custom-checkbox/custom-checkbox.component';
import {InputTagsComponent} from './tags/input-tags.component';
import {ReactiveFormsModule} from '@angular/forms';
import {DirectivesModule} from '../directives/directives.module';
import {DropdownModule} from '../dropdown/dropdown.module';
import {FilterUsedSuggestionsPipe} from './tags/filter-used-suggestions.pipe';
import {ToggleCheckboxComponent} from './toggle-checkbox/toggle-checkbox.component';

@NgModule({
  imports: [CommonModule, ReactiveFormsModule, DirectivesModule, DropdownModule],
  declarations: [
    FilterBoxComponent,
    InputBoxComponent,
    InvitationTypeSelectComponent,
    HiddenInputComponent,
    CopyTextBoxComponent,
    CustomCheckboxComponent,
    InputTagsComponent,
    FilterUsedSuggestionsPipe,
    ToggleCheckboxComponent,
  ],
  exports: [
    FilterBoxComponent,
    InputBoxComponent,
    InvitationTypeSelectComponent,
    HiddenInputComponent,
    CopyTextBoxComponent,
    CustomCheckboxComponent,
    InputTagsComponent,
    ToggleCheckboxComponent,
  ],
})
export class InputModule {}
