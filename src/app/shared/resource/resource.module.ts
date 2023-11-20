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

import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {InputModule} from '../input/input.module';
import {PickerModule} from '../picker/picker.module';
import {PipesModule} from '../pipes/pipes.module';
import {ResourceActivityModule} from './activity/resource-activity.module';
import {ResourceCommentsModule} from './comments/resource-comments.module';
import {ResourceHeaderComponent} from './header/resource-header.component';
import {ResourceVariableHeaderComponent} from './variables/header/resource-variable-header.component';
import {FilterResourceVariablesPipe} from './variables/pipes/filter-resource-variables.pipe';
import {ResourceVariablesKeysPipe} from './variables/pipes/resource-variables-keys.pipe';
import {ResourceVariablesComponent} from './variables/resource-variables.component';
import {ResourceVariablesModule} from './variables/resource-variables.module';
import {ResourceVariablesTableComponent} from './variables/table/resource-variables-table.component';
import {ResourceVariableRowComponent} from './variables/table/row/resource-variable-row.component';

@NgModule({
  declarations: [ResourceHeaderComponent],
  imports: [
    CommonModule,
    InputModule,
    PickerModule,
    ResourceVariablesModule,
    ResourceActivityModule,
    ResourceCommentsModule,
  ],
  exports: [ResourceHeaderComponent, ResourceVariablesComponent, ResourceActivityModule, ResourceCommentsModule],
})
export class ResourceModule {}
