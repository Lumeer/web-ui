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

import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {DateTimeModule} from '../../../shared/date-time/date-time.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {SelectModule} from '../../../shared/select/select.module';
import {AttributeTypeFormComponent} from './attribute-type-form.component';
import {ConstraintConfigFormComponent} from './constraint-config/constraint-config-form.component';
import {DatetimeConstraintConfigFormComponent} from './constraint-config/datetime/datetime-constraint-config-form.component';
import {NumberConstraintConfigFormComponent} from './constraint-config/number/number-constraint-config-form.component';
import {PercentageConstraintConfigFormComponent} from './constraint-config/percentage/percentage-constraint-config-form.component';
import {SelectConstraintOptionsFormComponent} from './constraint-config/select/options/select-constraint-options-form.component';
import {SelectConstraintConfigFormComponent} from './constraint-config/select/select-constraint-config-form.component';
import {TextConstraintConfigFormComponent} from './constraint-config/text/text-constraint-config-form.component';
import {UserConstraintConfigFormComponent} from './constraint-config/user/user-constraint-config-form.component';
import {CoordinatesConstraintConfigFormComponent} from './constraint-config/coordinates/coordinates-constraint-config-form.component';
import {AddressConstraintConfigFormComponent} from './constraint-config/address/address-constraint-config-form.component';
import {AttributeTypeSelectComponent} from './select/attribute-type-select.component';

@NgModule({
  imports: [CommonModule, DateTimeModule, DragDropModule, PipesModule, ReactiveFormsModule, SelectModule],
  declarations: [
    AttributeTypeFormComponent,
    NumberConstraintConfigFormComponent,
    TextConstraintConfigFormComponent,
    ConstraintConfigFormComponent,
    DatetimeConstraintConfigFormComponent,
    PercentageConstraintConfigFormComponent,
    SelectConstraintConfigFormComponent,
    SelectConstraintOptionsFormComponent,
    UserConstraintConfigFormComponent,
    CoordinatesConstraintConfigFormComponent,
    AddressConstraintConfigFormComponent,
    AttributeTypeSelectComponent,
  ],
  exports: [AttributeTypeFormComponent],
})
export class AttributeTypeFormModule {}
