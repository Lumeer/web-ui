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
import {DropdownModule} from '../dropdown/dropdown.module';
import {PickerModule} from '../picker/picker.module';
import {PipesModule} from '../pipes/pipes.module';
import {SelectItemWithConstraintComponent} from './select-constraint-item/select-item-with-constraint.component';
import {SelectItemWithConstraintConfigPipe} from './select-constraint-item/select-items-with-constraint-config.pipe';
import {SelectItemsWithConstraintPipe} from './select-constraint-item/select-items-with-constraint.pipe';
import {AreIdsEqualPipe} from './select-item/pipes/are-ids-equal.pipe';
import {GetSelectItemPipe} from './select-item/pipes/get-select-item.pipe';

import {SelectItemComponent} from './select-item/select-item.component';
import {PresenterModule} from '../presenter/presenter.module';
import {SelectDataItemComponent} from './select-data-item/select-data-item.component';
import {DataInputModule} from '../data-input/data-input.module';
import {GetSelectDataItemPipe} from './select-data-item/get-select-data-item.pipe';
import {DataDropdownModule} from '../data-dropdown/data-dropdown.module';
import {SelectCollectionComponent} from './select-collection/select-collection.component';
import {SelectItem2Component} from './select-item2/select-item2.component';
import {SelectItemRowComponent} from './select-item/row/select-item-row.component';
import {SelectItemWithConstraint2Component} from './select-constraint-item2/select-item-with-constraint2.component';
import {SelectItemsWithConstraint2Pipe} from './select-constraint-item2/select-items-with-constraint2.pipe';
import {GetSelectedItemsPipe} from './select-item2/get-selected-items.pipe';
import {MenuModule} from '../menu/menu.module';
import {MatMenuModule} from '@angular/material/menu';

@NgModule({
  imports: [
    CommonModule,
    PickerModule,
    PresenterModule,
    PipesModule,
    OverlayModule,
    DropdownModule,
    DataInputModule,
    DataDropdownModule,
    MenuModule,
    MatMenuModule,
  ],
  declarations: [
    SelectItemComponent,
    SelectItem2Component,
    GetSelectItemPipe,
    GetSelectedItemsPipe,
    AreIdsEqualPipe,
    SelectItemWithConstraintComponent,
    SelectItemWithConstraint2Component,
    SelectItemWithConstraintConfigPipe,
    SelectItemsWithConstraintPipe,
    SelectItemsWithConstraint2Pipe,
    SelectDataItemComponent,
    GetSelectDataItemPipe,
    SelectCollectionComponent,
    SelectItemRowComponent,
  ],
  providers: [AreIdsEqualPipe],
  exports: [
    SelectItemComponent,
    SelectItem2Component,
    SelectItemWithConstraintComponent,
    SelectItemWithConstraint2Component,
    SelectDataItemComponent,
    SelectCollectionComponent,
    SelectItemsWithConstraintPipe,
  ],
})
export class SelectModule {}
