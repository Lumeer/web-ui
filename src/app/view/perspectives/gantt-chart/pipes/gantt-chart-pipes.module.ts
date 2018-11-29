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
import {DisplayablePipe} from './displayable.pipe';
import {GanttChartModesToSelectPipe} from './gantt-chart-modes-to-select.pipe';
import {BarSelectPropertyRequiredItemsPipe} from './bar-property-required-pipes/bar-select-property-required-items.pipe';
import {BarSelectPlaceholderPropertyRequiredPipe} from './bar-property-required-pipes/bar-select-placeholder-property-required.pipe';
import {BarSelectEmptyValuePropertyRequiredPipe} from './bar-property-required-pipes/bar-select-empty-value-property-required.pipe';
import {BarSelectPropertyOptionalItemsPipe} from './bar-property-optional-pipes/bar-select-property-optional-items.pipe';
import {BarSelectPlaceholderPropertyOptionalPipe} from './bar-property-optional-pipes/bar-select-placeholder-property-optional.pipe';
import {BarSelectEmptyValuePropertyOptionalPipe} from './bar-property-optional-pipes/bar-select-empty-value-property-optional.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DisplayablePipe,
    GanttChartModesToSelectPipe,
    BarSelectPropertyRequiredItemsPipe,
    BarSelectPlaceholderPropertyRequiredPipe,
    BarSelectEmptyValuePropertyRequiredPipe,
    BarSelectPropertyOptionalItemsPipe,
    BarSelectPlaceholderPropertyOptionalPipe,
    BarSelectEmptyValuePropertyOptionalPipe,
  ],
  exports: [
    DisplayablePipe,
    GanttChartModesToSelectPipe,
    BarSelectPropertyRequiredItemsPipe,
    BarSelectPlaceholderPropertyRequiredPipe,
    BarSelectEmptyValuePropertyRequiredPipe,
    BarSelectPropertyOptionalItemsPipe,
    BarSelectPlaceholderPropertyOptionalPipe,
    BarSelectEmptyValuePropertyOptionalPipe,
  ],
})
export class GanttChartPipesModule {}
