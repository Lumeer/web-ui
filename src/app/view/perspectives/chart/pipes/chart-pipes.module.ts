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
import {DisplayablePipe} from './displayable.pipe';
import {ShowAxisSelectPipe} from './axis/show-axis-select.pipe';
import {ChartTypesToSelectPipe} from './chart-types-to-select.pipe';
import {DataSetSelectPlaceholderPipe} from './axis/data-set-select-placeholder.pipe';
import {AxisSelectItemsPipe} from './axis/axis-select-items.pipe';
import {ConfigAxisByTypePipe} from './axis/config-axis-by-type.pipe';
import {DataSetSelectItemsPipe} from './axis/data-set-select-items.pipe';
import {SortSelectItemsPipe} from './sort/sort-select-items.pipe';
import {ChartDraggable} from './chart-draggable';
import {SortTypeSelectItemsPipe} from './sort/sort-type-select-items.pipe';
import {AggregationSelectPlaceholderPipe} from './axis/aggregation-select-placeholder.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DisplayablePipe,
    ShowAxisSelectPipe,
    ChartTypesToSelectPipe,
    DataSetSelectPlaceholderPipe,
    AxisSelectItemsPipe,
    ConfigAxisByTypePipe,
    DataSetSelectItemsPipe,
    SortSelectItemsPipe,
    ChartDraggable,
    SortTypeSelectItemsPipe,
    AggregationSelectPlaceholderPipe,
  ],
  exports: [
    DisplayablePipe,
    ShowAxisSelectPipe,
    ChartTypesToSelectPipe,
    DataSetSelectPlaceholderPipe,
    AxisSelectItemsPipe,
    ConfigAxisByTypePipe,
    DataSetSelectItemsPipe,
    SortSelectItemsPipe,
    ChartDraggable,
    SortTypeSelectItemsPipe,
    AggregationSelectPlaceholderPipe,
  ],
})
export class ChartPipesModule {}
