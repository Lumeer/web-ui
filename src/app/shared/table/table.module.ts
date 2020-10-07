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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {TableComponent} from './table.component';
import {TableHeaderComponent} from './content/header/table-header.component';
import {TableRowComponent} from './content/row/table-row.component';
import {DataInputModule} from '../data-input/data-input.module';
import {PipesModule} from '../pipes/pipes.module';
import {ColumnHandleLeftPipe} from './pipes/column-handle-left.pipe';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {TableItemSizeDirective} from './strategy/table-item-size-directive';
import {TableAlternativeHeaderComponent} from './content/alternative-header/table-alternative-header.component';
import {TableResizeHeaderComponent} from './content/resize-header/table-resize-header.component';
import {TableRowDataCursorPipe} from './pipes/table-row-data-cursor.pipe';
import {InputModule} from '../input/input.module';
import {ClickOutsideModule} from 'ng-click-outside';
import {TableCellSelectedPipe} from './pipes/table-cell-selected.pipe';
import {TableCellEditedPipe} from './pipes/table-cell-edited.pipe';
import {TableBodyCellSelectedPipe} from './pipes/table-body-cell-selected.pipe';
import {TableHeaderInputComponent} from './content/header/cell/input/table-header-input.component';
import {TableHeaderCellComponent} from './content/header/cell/table-header-cell.component';
import {TableMenuComponent} from './content/common/menu/table-menu.component';
import {ContextMenuModule} from 'ngx-contextmenu';
import {GroupTableMenuItemsPipe} from './pipes/group-table-menu-items.pipe';

@NgModule({
  declarations: [
    TableComponent,
    TableHeaderComponent,
    TableRowComponent,
    ColumnHandleLeftPipe,
    TableItemSizeDirective,
    TableAlternativeHeaderComponent,
    TableResizeHeaderComponent,
    TableRowDataCursorPipe,
    TableCellSelectedPipe,
    TableCellEditedPipe,
    TableBodyCellSelectedPipe,
    TableHeaderInputComponent,
    TableHeaderCellComponent,
    TableMenuComponent,
    GroupTableMenuItemsPipe,
  ],
  imports: [
    CommonModule,
    DataInputModule,
    PipesModule,
    DragDropModule,
    ScrollingModule,
    InputModule,
    ClickOutsideModule,
    ContextMenuModule,
  ],
  exports: [TableComponent],
})
export class TableModule {}
