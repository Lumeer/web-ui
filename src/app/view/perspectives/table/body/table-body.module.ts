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

import {ScrollingModule} from '@angular/cdk/scrolling';

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatMenuModule} from '@angular/material/menu';
import {GravatarModule} from 'ngx-gravatar';
import {DataInputModule} from '../../../../shared/data-input/data-input.module';
import {PickerModule} from '../../../../shared/picker/picker.module';
import {PipesModule} from '../../../../shared/pipes/pipes.module';
import {SharedModule} from '../../../../shared/shared.module';
import {TablePipesModule} from '../shared/pipes/table-pipes.module';
import {TableSharedModule} from '../shared/table-shared.module';
import {BooleanCollapsedCellComponent} from './rows/cell-group/collapsed-cell/boolean/boolean-collapsed-cell.component';
import {ColorCollapsedCellComponent} from './rows/cell-group/collapsed-cell/color/color-collapsed-cell.component';
import {GroupColorsByCountPipe} from './rows/cell-group/collapsed-cell/color/group-colors-by-count.pipe';
import {TableCollapsedCellMenuComponent} from './rows/cell-group/collapsed-cell/menu/table-collapsed-cell-menu.component';
import {TableCollapsedCellComponent} from './rows/cell-group/collapsed-cell/table-collapsed-cell.component';
import {TableDataCellMenuComponent} from './rows/cell-group/data-cell/menu/table-data-cell-menu.component';
import {TableDataCellComponent} from './rows/cell-group/data-cell/table-data-cell.component';
import {TableCellGroupComponent} from './rows/cell-group/table-cell-group.component';
import {TableEmptyRowComponent} from './rows/empty-row/table-empty-row.component';
import {TableLinkCellComponent} from './rows/linked-rows/link-cell/table-link-cell.component';
import {TableLinkedRowComponent} from './rows/linked-rows/linked-row/table-linked-row.component';
import {TableLinkedRowsComponent} from './rows/linked-rows/table-linked-rows.component';
import {TableHierarchyCellMenuComponent} from './rows/primary-row/hierarchy-cell/menu/table-hierarchy-cell-menu.component';
import {TableHierarchyCellComponent} from './rows/primary-row/hierarchy-cell/table-hierarchy-cell.component';
import {TableRowNumbersComponent} from './rows/primary-row/row-numbers/table-row-numbers.component';
import {TablePrimaryRowComponent} from './rows/primary-row/table-primary-row.component';
import {TableRowsComponent} from './rows/table-rows.component';
import {TableBodyComponent} from './table-body.component';
import {FilesCollapsedCellComponent} from './rows/cell-group/collapsed-cell/files/files-collapsed-cell.component';
import {CreateCombinedSelectValuePipe} from './rows/cell-group/collapsed-cell/select/create-combined-select-value.pipe';
import {CreateCombinedUserValuePipe} from './rows/cell-group/collapsed-cell/user/create-combined-user-value.pipe';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    PickerModule,
    PipesModule,
    TablePipesModule,
    TableSharedModule,
    DataInputModule,
    ScrollingModule,
    GravatarModule,
    MatMenuModule,
  ],
  declarations: [
    TableBodyComponent,
    TableCellGroupComponent,
    TableLinkCellComponent,
    TableRowsComponent,
    TableDataCellMenuComponent,
    TableCollapsedCellComponent,
    TableRowNumbersComponent,
    TableDataCellComponent,
    TableCollapsedCellMenuComponent,
    TableLinkedRowsComponent,
    TablePrimaryRowComponent,
    TableLinkedRowComponent,
    TableHierarchyCellComponent,
    TableHierarchyCellMenuComponent,
    ColorCollapsedCellComponent,
    GroupColorsByCountPipe,
    TableEmptyRowComponent,
    BooleanCollapsedCellComponent,
    FilesCollapsedCellComponent,
    CreateCombinedSelectValuePipe,
    CreateCombinedUserValuePipe,
  ],
  exports: [TableBodyComponent],
})
export class TableBodyModule {}
