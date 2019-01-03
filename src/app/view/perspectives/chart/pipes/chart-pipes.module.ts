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
import {AttributeNamePipe} from './attribute-name.pipe';
import {ShowAxisSelectPipe} from './show-axis-select.pipe';
import {ChartTypesToSelectPipe} from './chart-types-to-select.pipe';
import {AxisSelectEmptyValuePipe} from './axis-select-empty-value.pipe';
import {AxisSelectItemsPipe} from './axis-select-items.pipe';
import {ConfigAxisByTypePipe} from './config-axis-by-type.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    DisplayablePipe,
    AttributeNamePipe,
    ShowAxisSelectPipe,
    ChartTypesToSelectPipe,
    AxisSelectEmptyValuePipe,
    AxisSelectItemsPipe,
    ConfigAxisByTypePipe,
  ],
  exports: [
    DisplayablePipe,
    AttributeNamePipe,
    ShowAxisSelectPipe,
    ChartTypesToSelectPipe,
    AxisSelectEmptyValuePipe,
    AxisSelectItemsPipe,
    ConfigAxisByTypePipe,
  ],
})
export class ChartPipesModule {}
