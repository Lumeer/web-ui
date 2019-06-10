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
import {PipesModule} from '../pipes/pipes.module';
import {BooleanDataInputComponent} from './boolean/boolean-data-input.component';
import {ColorDataInputComponent} from './color/color-data-input.component';
import {DataInputComponent} from './data-input.component';
import {DatetimeDataInputComponent} from './datetime/datetime-data-input.component';
import {NumberDataInputComponent} from './number/number-data-input.component';
import {NumberValidPipe} from './number/number-valid.pipe';
import {PercentageDataInputComponent} from './percentage/percentage-data-input.component';
import {PercentageValidPipe} from './percentage/percentage-valid.pipe';
import {TextDataInputComponent} from './text/text-data-input.component';
import {UserDataInputComponent} from './user/user-data-input.component';
import {SelectDataInputComponent} from './select/select-data-input.component';

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
  ],
  declarations: [
    DataInputComponent,
    TextDataInputComponent,
    DatetimeDataInputComponent,
    NumberDataInputComponent,
    BooleanDataInputComponent,
    PercentageDataInputComponent,
    PercentageValidPipe,
    NumberValidPipe,
    ColorDataInputComponent,
    UserDataInputComponent,
    SelectDataInputComponent,
  ],
  exports: [DataInputComponent, BooleanDataInputComponent, UserDataInputComponent],
})
export class DataInputModule {}
