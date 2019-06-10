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

import {OverlayModule} from '@angular/cdk/overlay';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ClickOutsideModule} from 'ng-click-outside';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {PipesModule} from '../pipes/pipes.module';
import {DateTimeInputComponent} from './input/date-time-input.component';
import {DateTimePickerComponent} from './picker/date-time-picker.component';
import {HasDateOptionPipe} from './picker/has-date-option.pipe';
import {HasTimeOptionPipe} from './picker/has-time-option.pipe';

@NgModule({
  imports: [
    BsDatepickerModule,
    CommonModule,
    OverlayModule,
    PipesModule,
    ReactiveFormsModule,
    TimepickerModule,
    ClickOutsideModule,
  ],
  declarations: [DateTimeInputComponent, DateTimePickerComponent, HasDateOptionPipe, HasTimeOptionPipe],
  exports: [DateTimeInputComponent, DateTimePickerComponent],
})
export class DateTimeModule {}
