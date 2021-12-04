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
import {ResourceHeaderComponent} from './header/resource-header.component';
import {PickerModule} from '../picker/picker.module';
import {InputModule} from '../input/input.module';
import {ResourceVariablesComponent} from './variables/resource-variables.component';
import {ResourceVariableRowComponent} from './variables/table/row/resource-variable-row.component';
import {ResourceVariableHeaderComponent} from './variables/header/resource-variable-header.component';
import {FormsModule} from '@angular/forms';
import {ResourceVariablesTableComponent} from './variables/table/resource-variables-table.component';
import {PipesModule} from '../pipes/pipes.module';
import {FilterResourceVariablesPipe} from './variables/pipes/filter-resource-variables.pipe';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {ResourceVariablesKeysPipe} from './variables/pipes/resource-variables-keys.pipe';

@NgModule({
  declarations: [
    ResourceHeaderComponent,
    ResourceVariablesComponent,
    ResourceVariableRowComponent,
    ResourceVariableHeaderComponent,
    ResourceVariablesTableComponent,
    FilterResourceVariablesPipe,
    ResourceVariablesKeysPipe,
  ],
  imports: [CommonModule, PickerModule, InputModule, FormsModule, PipesModule, TooltipModule],
  exports: [ResourceHeaderComponent, ResourceVariablesComponent],
})
export class ResourceModuleModule {}
