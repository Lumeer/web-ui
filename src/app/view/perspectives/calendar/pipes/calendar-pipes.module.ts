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
import {BarSelectPropertyRequiredItemsPipe} from './bar-property-required-pipes/bar-select-property-required-items.pipe';
import {BarSelectPlaceholderPropertyRequiredPipe} from './bar-property-required-pipes/bar-select-placeholder-property-required.pipe';
import {BarSelectEmptyValuePropertyRequiredPipe} from './bar-property-required-pipes/bar-select-empty-value-property-required.pipe';
import {DisplayablePipe} from './displayable.pipe';
import {FilterConfigsPipe} from './filter.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DisplayablePipe,
    BarSelectPropertyRequiredItemsPipe,
    BarSelectPlaceholderPropertyRequiredPipe,
    BarSelectEmptyValuePropertyRequiredPipe,
    FilterConfigsPipe,
  ],
  exports: [
    DisplayablePipe,
    BarSelectPropertyRequiredItemsPipe,
    BarSelectPlaceholderPropertyRequiredPipe,
    BarSelectEmptyValuePropertyRequiredPipe,
    FilterConfigsPipe,
  ],
})
export class CalendarPipesModule {}
