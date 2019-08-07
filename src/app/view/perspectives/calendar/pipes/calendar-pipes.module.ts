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

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CalendarPropertyItemsPipe} from './calendar-property-items.pipe';
import {CalendarPropertyPlaceholderPipe} from './calendar-property-placeholder.pipe';
import {CalendarValuePropertyPipe} from './calendar-value-property.pipe';
import {CalendarRequiredPropertiesSetPipe} from './calendar-required-properties-set.pipe';
import {CalendarModesToSelectPipe} from './calendar-modes-to-select.pipe';
import {FirstDayOfWeekPipe} from './first-day-of-week.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    CalendarPropertyItemsPipe,
    CalendarPropertyPlaceholderPipe,
    CalendarValuePropertyPipe,
    CalendarRequiredPropertiesSetPipe,
    CalendarModesToSelectPipe,
    FirstDayOfWeekPipe,
  ],
  exports: [
    CalendarPropertyItemsPipe,
    CalendarPropertyPlaceholderPipe,
    CalendarValuePropertyPipe,
    CalendarRequiredPropertiesSetPipe,
    CalendarModesToSelectPipe,
    FirstDayOfWeekPipe,
  ],
})
export class CalendarPipesModule {}
