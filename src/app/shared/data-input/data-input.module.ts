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
import {FormsModule} from '@angular/forms';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {TypeaheadModule} from 'ngx-bootstrap/typeahead';
import {ColorPickerModule} from 'ngx-color-picker';
import {GravatarModule} from 'ngx-gravatar';
import {DateTimeModule} from '../date-time/date-time.module';
import {DirectivesModule} from '../directives/directives.module';
import {DropdownModule} from '../dropdown/dropdown.module';
import {PipesModule} from '../pipes/pipes.module';
import {AddressDataInputComponent} from './address/address-data-input.component';
import {BooleanDataInputComponent} from './boolean/boolean-data-input.component';
import {ColorDataInputComponent} from './color/color-data-input.component';
import {CoordinatesDataInputComponent} from './coordinates/coordinates-data-input.component';
import {DataInputComponent} from './data-input.component';
import {DatetimeDataInputComponent} from './datetime/datetime-data-input.component';
import {DurationDataInputComponent} from './duration/duration-data-input.component';
import {FilesDataInputComponent} from './files/files-data-input.component';
import {NumberDataInputComponent} from './number/number-data-input.component';
import {PercentageDataInputComponent} from './percentage/percentage-data-input.component';
import {SelectDataInputComponent} from './select/select-data-input.component';
import {TextDataInputComponent} from './text/text-data-input.component';
import {UserDataInputComponent} from './user/user-data-input.component';
import {DataCursorPipe} from './data-cursor.pipe';
import {FileTypeIconPipe} from './files/file-type-icon.pipe';
import {FilesDropdownComponent} from './files/dropdown/files-dropdown.component';
import {FileAttachmentButtonComponent} from './files/button/file-attachment-button.component';

@NgModule({
  imports: [
    BsDatepickerModule,
    CommonModule,
    FormsModule,
    PipesModule,
    DateTimeModule,
    DirectivesModule,
    ColorPickerModule,
    GravatarModule,
    TypeaheadModule,
    DropdownModule,
  ],
  declarations: [
    DataInputComponent,
    TextDataInputComponent,
    DatetimeDataInputComponent,
    NumberDataInputComponent,
    BooleanDataInputComponent,
    PercentageDataInputComponent,
    ColorDataInputComponent,
    UserDataInputComponent,
    SelectDataInputComponent,
    CoordinatesDataInputComponent,
    AddressDataInputComponent,
    DurationDataInputComponent,
    FilesDataInputComponent,
    DataCursorPipe,
    FileTypeIconPipe,
    FilesDropdownComponent,
    FileAttachmentButtonComponent,
  ],
  exports: [
    DataInputComponent,
    BooleanDataInputComponent,
    UserDataInputComponent,
    DataCursorPipe,
    FileAttachmentButtonComponent,
  ],
})
export class DataInputModule {}
